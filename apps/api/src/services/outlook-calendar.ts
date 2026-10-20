import { type Meeting } from "@prisma/client";
import { AppError } from "../lib/AppError";
import { database } from "../lib/database";
import { findCoffeeSlots, type BusyPeriod } from "./calendar-slots";
import { accessToken, graphRequest, GraphError } from "./microsoft";

export async function employeeMatch(employeeId: number, matchId: number) {
  const match = await database().match.findUnique({ where: { matchId }, include: {
    employeeOne: { include: { microsoftAccount: true } }, employeeTwo: { include: { microsoftAccount: true } },
  } });
  if (!match || ![match.employeeOneId, match.employeeTwoId].includes(employeeId)) throw new AppError(404, "Match not found.");
  if (!match.employeeOne.isActive || !match.employeeTwo.isActive) throw new AppError(409, "Both employees must be active.");
  return match;
}

type ScheduleResponse = { value: {
  scheduleId: string;
  error?: unknown;
  scheduleItems?: { status: string; start: { dateTime: string; timeZone: string }; end: { dateTime: string; timeZone: string } }[];
}[] };

export function readBusyPeriods(response: ScheduleResponse, mailbox: string): BusyPeriod[] {
  const schedule = response.value?.find((item) => item.scheduleId.toLowerCase() === mailbox.toLowerCase());
  if (!schedule || schedule.error || !Array.isArray(schedule.scheduleItems)) throw new AppError(409, "An employee's availability could not be read. Ask IT to check calendar sharing.");
  return schedule.scheduleItems.map((item) => {
    if (item.start?.timeZone !== "UTC" || item.end?.timeZone !== "UTC" || typeof item.status !== "string") {
      throw new AppError(502, "Microsoft returned an unreadable calendar. No time has been assumed free.");
    }
    const utc = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
    const start = utc(item.start.dateTime);
    const end = utc(item.end.dateTime);
    if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) {
      throw new AppError(502, "Microsoft returned an invalid calendar interval.");
    }
    return { start, end, status: item.status };
  });
}

export async function availableSlots(employeeId: number, matchId: number, from: Date, to: Date) {
  const match = await employeeMatch(employeeId, matchId);
  const people = [match.employeeOne, match.employeeTwo];
  if (people.some((person) => !person.microsoftAccount?.connected)) throw new AppError(409, "Both employees must connect their Microsoft accounts before finding times.");
  const token = await accessToken(employeeId);
  const response = await graphRequest<ScheduleResponse>(token, "/me/calendar/getSchedule", "POST", {
    schedules: people.map((person) => person.microsoftAccount!.mailbox),
    startTime: { dateTime: from.toISOString(), timeZone: "UTC" },
    endTime: { dateTime: to.toISOString(), timeZone: "UTC" }, availabilityViewInterval: 15,
  });
  return findCoffeeSlots(from, to, people.map((person) => ({
    timeZone: person.microsoftAccount!.timeZone,
    workStart: person.microsoftAccount!.workStart,
    workEnd: person.microsoftAccount!.workEnd,
    busy: readBusyPeriods(response, person.microsoftAccount!.mailbox),
  })));
}

type OutlookEvent = {
  id: string; webLink: string; transactionId?: string; isCancelled?: boolean;
  start: { dateTime: string; timeZone: string }; end: { dateTime: string; timeZone: string };
  location?: { displayName?: string };
};

async function existingBooking(token: string, meeting: Meeting): Promise<OutlookEvent | undefined> {
  const query = new URLSearchParams({ startDateTime: meeting.startsAt!.toISOString(), endDateTime: meeting.endsAt!.toISOString(),
    "$select": "id,webLink,transactionId,isCancelled,start,end,location", "$top": "100" });
  let path: string | undefined = `/me/calendarView?${query}`;
  for (let page = 0; path && page < 10; page++) {
    const response: { value: OutlookEvent[]; "@odata.nextLink"?: string } = await graphRequest(token, path);
    const event = response.value.find((candidate) => candidate.transactionId === meeting.bookingKey);
    if (event) return event;
    path = undefined;
    if (response["@odata.nextLink"]) {
      const next = new URL(response["@odata.nextLink"]);
      if (next.origin !== "https://graph.microsoft.com" || !next.pathname.startsWith("/v1.0/")) throw new AppError(502, "Invalid calendar pagination response.");
      path = next.pathname.slice("/v1.0".length) + next.search;
    }
  }
  if (path) throw new AppError(502, "Too many events to safely reconcile this booking. Contact an administrator.");
  return undefined;
}

function eventTimes(event: OutlookEvent) {
  return readBusyPeriods({ value: [{ scheduleId: "organiser", scheduleItems: [{ status: "busy", start: event.start, end: event.end }] }] }, "organiser")[0];
}

export async function reconcileMeeting(meeting: Meeting, employeeId: number) {
  if (meeting.organiserId !== employeeId || !meeting.graphEventId || meeting.syncOperation) throw new AppError(409, "Complete the pending operation before checking Outlook.");
  await employeeMatch(employeeId, meeting.matchId);
  const token = await accessToken(employeeId);
  let event: OutlookEvent | undefined;
  try { event = await graphRequest(token, `/me/events/${encodeURIComponent(meeting.graphEventId)}?$select=id,webLink,isCancelled,start,end,location`); }
  catch (error) { if (!(error instanceof GraphError && error.graphStatus === 404)) throw error; }
  const times = event && !event.isCancelled ? eventTimes(event) : undefined;
  const changed = await database().meeting.updateMany({ where: { meetingId: meeting.meetingId, syncOperation: null, syncUpdatedAt: meeting.syncUpdatedAt }, data: times ? {
    startsAt: new Date(times.start), endsAt: new Date(times.end), meetingDate: new Date(times.start), startTime: new Date(times.start), endTime: new Date(times.end),
    location: event!.location?.displayName || meeting.location, outlookUrl: event!.webLink, status: "scheduled", syncUpdatedAt: new Date(),
  } : { status: "cancelled", activeMatchId: null, syncUpdatedAt: new Date() } });
  if (!changed.count) throw new AppError(409, "This meeting changed while checking Outlook. Refresh and try again.");
  return database().meeting.findUniqueOrThrow({ where: { meetingId: meeting.meetingId } });
}

export async function synchroniseMeeting(meeting: Meeting, employeeId: number) {
  if (meeting.organiserId !== employeeId) throw new AppError(403, "Only the organiser can change this meeting.");
  if (!meeting.syncOperation) return meeting;
  const match = await employeeMatch(employeeId, meeting.matchId);
  const claimed = await database().meeting.updateMany({
    where: { meetingId: meeting.meetingId, syncOperation: meeting.syncOperation, syncUpdatedAt: meeting.syncUpdatedAt, OR: [
      { status: "calendar_failed" }, { status: "calendar_pending", syncUpdatedAt: { lt: new Date(Date.now() - 120_000) } },
    ] }, data: { status: "calendar_pending", syncUpdatedAt: new Date() },
  });
  if (claimed.count !== 1) throw new AppError(409, "This meeting is already being updated. Refresh shortly before retrying.");
  try {
    const token = await accessToken(employeeId);
    const other = match.employeeOneId === employeeId ? match.employeeTwo : match.employeeOne;
    if (meeting.syncOperation === "cancel") {
      const recovered = !meeting.graphEventId && meeting.startsAt && meeting.endsAt ? await existingBooking(token, meeting) : undefined;
      const eventId = meeting.graphEventId || recovered?.id;
      if (eventId && !recovered?.isCancelled) {
        try {
          await graphRequest(token, `/me/events/${encodeURIComponent(eventId)}/cancel`, "POST", { comment: "This Coffee Connect meeting has been cancelled." });
        } catch (error) {
          if (!(error instanceof GraphError && error.graphStatus === 404)) throw error;
        }
      }
      return await database().meeting.update({ where: { meetingId: meeting.meetingId },
        data: { status: "cancelled", activeMatchId: null, syncOperation: null, syncUpdatedAt: new Date(), graphEventId: eventId } });
    }
    if (!meeting.startsAt || !meeting.endsAt) throw new AppError(409, "The saved meeting is missing its start or end time.");
    const event = {
      subject: "Coffee Connect",
      body: { contentType: "Text", content: "Time for a coffee and a conversation." },
      start: { dateTime: meeting.startsAt.toISOString(), timeZone: "UTC" },
      end: { dateTime: meeting.endsAt.toISOString(), timeZone: "UTC" },
      location: { displayName: meeting.location || "" },
      attendees: [{ emailAddress: { address: other.microsoftAccount?.mailbox || other.email }, type: "required" }],
      showAs: "busy",
    };
    const creating = meeting.syncOperation === "create";
    if (!creating && !meeting.graphEventId) throw new AppError(409, "This meeting has no Outlook event to update.");
    const existing = creating ? await existingBooking(token, meeting) :
      await graphRequest<OutlookEvent>(token, `/me/events/${encodeURIComponent(meeting.graphEventId!)}?$select=id,webLink,isCancelled,start,end,location`);
    if (existing?.isCancelled) {
      return await database().meeting.update({ where: { meetingId: meeting.meetingId },
        data: { status: "cancelled", activeMatchId: null, syncOperation: null, graphEventId: existing.id, syncUpdatedAt: new Date() } });
    }
    const times = existing ? eventTimes(existing) : undefined;
    const alreadyUpdated = existing && (creating || (Date.parse(times!.start) === meeting.startsAt.getTime() &&
      Date.parse(times!.end) === meeting.endsAt.getTime() && existing.location?.displayName === meeting.location));
    if (!alreadyUpdated) {
      if (meeting.startsAt.getTime() < Date.now() + 5 * 60_000) throw new AppError(409, "This time is now too close or in the past. Contact an administrator to resolve this saved booking.");
      const slots = await availableSlots(employeeId, meeting.matchId, meeting.startsAt, meeting.endsAt);
      if (!slots.some((slot) => slot.start === meeting.startsAt!.toISOString())) throw new AppError(409, "The saved time is no longer available. Resolve or cancel this booking before selecting another time.");
    }
    const result = alreadyUpdated ? existing : await graphRequest<{ id: string; webLink: string }>(token,
      creating ? "/me/events" : `/me/events/${encodeURIComponent(meeting.graphEventId!)}`,
      creating ? "POST" : "PATCH", creating ? { ...event, transactionId: meeting.bookingKey } : event);
    if (!result.id) throw new AppError(502, "Microsoft did not confirm an event identifier. Retry the saved operation.");
    return await database().meeting.update({ where: { meetingId: meeting.meetingId }, data: {
      graphEventId: result.id, outlookUrl: result.webLink, status: "scheduled", syncOperation: null, syncUpdatedAt: new Date(),
      ...(creating && times ? { startsAt: new Date(times.start), endsAt: new Date(times.end), meetingDate: new Date(times.start),
        startTime: new Date(times.start), endTime: new Date(times.end), location: existing!.location?.displayName || meeting.location } : {}),
    } });
  } catch (error) {
    await database().meeting.update({ where: { meetingId: meeting.meetingId }, data: { status: "calendar_failed", syncUpdatedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}