import { Router } from "express";
import { createHash } from "node:crypto";
import { selectWeightedPerson, topMatchPeople } from "@coffee-connect/matching";
import { type Meeting } from "@prisma/client";
import { AppError } from "../lib/AppError";
import { database } from "../lib/database";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "./microsoft-auth";
import { availableSlots, employeeMatch, synchroniseMeeting, reconcileMeeting } from "../services/outlook-calendar";
import { validTimeZone } from "../services/calendar-slots";

export const calendarRouter = Router();
calendarRouter.use(requireAuth);
calendarRouter.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
calendarRouter.use((req, res, next) => ["GET", "HEAD"].includes(req.method) ? next() : requireCsrf(req, res, next));

function id(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") throw new AppError(400, "A valid identifier is required.");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new AppError(400, "A valid identifier is required.");
  return parsed;
}

function instant(value: unknown): Date {
  if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value))) throw new AppError(400, "Provide an ISO date and time including its timezone.");
  return new Date(value);
}

function meetingView(meeting: Meeting) {
  return { meetingId: meeting.meetingId, matchId: meeting.matchId, startsAt: meeting.startsAt, endsAt: meeting.endsAt,
    location: meeting.location, status: meeting.status, organiserId: meeting.organiserId,
    outlookUrl: meeting.outlookUrl, syncOperation: meeting.syncOperation };
}

calendarRouter.get("/matches", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const matches = await database().match.findMany({ where: { OR: [{ employeeOneId: employeeId }, { employeeTwoId: employeeId }] },
    orderBy: { matchDate: "desc" }, take: 100,
    include: { employeeOne: { select: { employeeId: true, firstName: true, lastName: true } },
      employeeTwo: { select: { employeeId: true, firstName: true, lastName: true } } } });
  res.json(matches.map((match) => ({ matchId: match.matchId, colleague: match.employeeOneId === employeeId ? match.employeeTwo : match.employeeOne })));
});

async function wheelPeople() {
  return database().employee.findMany({ where: { isActive: true },
    select: { employeeId: true, firstName: true, lastName: true, interests: { select: { interest: { select: { interestName: true, categoryId: true } } } } },
    orderBy: { employeeId: "asc" } });
}

calendarRouter.get("/people", async (_req, res) => {
  const people = await wheelPeople();
  res.json(people.map((person) => ({ id: String(person.employeeId), name: `${person.firstName} ${person.lastName}`.trim(),
    interests: person.interests.map((item) => item.interest.interestName),
    categories: [...new Set(person.interests.flatMap((item) => item.interest.categoryId === null ? [] : [String(item.interest.categoryId)]))] })));
});

calendarRouter.post("/matches", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const people = await wheelPeople();
  const current = people.find((person) => person.employeeId === employeeId);
  const candidates = people.map((person) => ({ id: String(person.employeeId), name: `${person.firstName} ${person.lastName}`.trim(), person,
    interests: person.interests.map((item) => item.interest.interestName),
    categories: [...new Set(person.interests.flatMap((item) => item.interest.categoryId === null ? [] : [String(item.interest.categoryId)]))] }));
  const currentInterests = current?.interests.map((item) => item.interest.interestName) ?? [];
  const currentCategories = current?.interests.flatMap((item) => item.interest.categoryId === null ? [] : [String(item.interest.categoryId)]) ?? [];
  const rankedCandidates = topMatchPeople(candidates, String(employeeId), currentInterests, currentCategories, 8);
  const winner = selectWeightedPerson(rankedCandidates, String(employeeId), currentInterests, undefined, currentCategories);
  if (!winner) throw new AppError(409, "No connected colleagues are available yet.");
  const selected = winner.person.person;
  const existing = await database().match.findFirst({ where: { OR: [
    { employeeOneId: employeeId, employeeTwoId: selected.employeeId }, { employeeOneId: selected.employeeId, employeeTwoId: employeeId },
  ] }, orderBy: { matchDate: "desc" } });
  const match = existing ?? await database().match.create({ data: { employeeOneId: employeeId, employeeTwoId: selected.employeeId,
    matchType: "shared_interests", matchStatus: "matched", generatedByWheelSpin: true } });
  res.status(existing ? 200 : 201).json({ matchId: match.matchId, colleagueId: String(selected.employeeId) });
});

calendarRouter.get("/meetings", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meetings = await database().meeting.findMany({ where: { startsAt: { not: null }, match: { OR: [{ employeeOneId: employeeId }, { employeeTwoId: employeeId }] } },
    orderBy: { startsAt: "desc" }, take: 100 });
  res.json(meetings.map(meetingView));
});

calendarRouter.patch("/preferences", async (req, res) => {
  const { timeZone, workStart, workEnd } = req.body ?? {};
  if (typeof timeZone !== "string" || !validTimeZone(timeZone) || !Number.isInteger(workStart) || !Number.isInteger(workEnd) ||
      workStart < 0 || workEnd > 1439 || workEnd - workStart < 30) throw new AppError(400, "Choose a valid timezone and working hours of at least 30 minutes.");
  await database().microsoftAccount.update({ where: { employeeId: Number(req.user!.id) }, data: { timeZone, workStart, workEnd } });
  res.sendStatus(204);
});

calendarRouter.get("/availability", async (req, res) => {
  const from = instant(req.query.from);
  const to = instant(req.query.to);
  if (from.getTime() < Date.now() + 5 * 60_000 || to <= from || to.getTime() - from.getTime() > 14 * 86_400_000 ||
      to.getTime() > Date.now() + 90 * 86_400_000) throw new AppError(400, "Search up to 14 days at a time, at least 5 minutes ahead and within the next 90 days.");
  res.json(await availableSlots(Number(req.user!.id), id(req.query.matchId), from, to));
});

async function checkedBooking(employeeId: number, body: Record<string, unknown>) {
  const matchId = id(body.matchId);
  const start = instant(body.start);
  const end = instant(body.end);
  if (start.getTime() < Date.now() + 5 * 60_000 || end.getTime() - start.getTime() !== 30 * 60_000 ||
      end.getTime() > Date.now() + 90 * 86_400_000 || start.getTime() % (15 * 60_000) !== 0) throw new AppError(400, "Choose a future 30-minute slot from the available times.");
  if (typeof body.location !== "string" || !body.location.trim() || body.location.length > 255) throw new AppError(400, "Enter a location of up to 255 characters.");
  const slots = await availableSlots(employeeId, matchId, start, end);
  if (!slots.some((slot) => slot.start === start.toISOString())) throw new AppError(409, "That time is no longer available for both employees. Find another time.");
  return { matchId, start, end, location: body.location.trim() };
}

calendarRouter.post("/meetings", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const body = req.body ?? {};
  const matchId = id(body.matchId);
  await employeeMatch(employeeId, matchId);
  const start = instant(body.start);
  const end = instant(body.end);
  if (typeof body.location !== "string" || !body.location.trim() || body.location.length > 255 ||
      typeof body.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId)) {
    throw new AppError(400, "Provide a location and a valid booking request identifier.");
  }
  const bookingKey = createHash("sha256").update(JSON.stringify([employeeId, body.requestId])).digest("hex");
  const existing = await database().meeting.findUnique({ where: { bookingKey } });
  if (existing) {
    if (existing.matchId !== matchId || existing.startsAt?.getTime() !== start.getTime() || existing.endsAt?.getTime() !== end.getTime() ||
        existing.location !== body.location.trim()) throw new AppError(409, "This booking identifier was already used for a different request.");
    res.json(meetingView(await synchroniseMeeting(existing, employeeId)));
    return;
  }
  const booking = await checkedBooking(employeeId, body);
  const account = await database().microsoftAccount.findUniqueOrThrow({ where: { employeeId } });
  const meeting = await database().meeting.create({ data: {
    matchId, activeMatchId: matchId, organiserId: employeeId, bookingKey,
    meetingDate: booking.start, startTime: booking.start, endTime: booking.end,
    startsAt: booking.start, endsAt: booking.end, timeZone: account.timeZone,
    location: booking.location, status: "calendar_failed", syncOperation: "create", syncUpdatedAt: new Date(),
  } });
  res.status(201).json(meetingView(await synchroniseMeeting(meeting, employeeId)));
});

async function organiserMeeting(employeeId: number, meetingId: number) {
  const meeting = await database().meeting.findUnique({ where: { meetingId } });
  if (!meeting || meeting.organiserId !== employeeId) throw new AppError(404, "Meeting not found, or you are not its organiser.");
  await employeeMatch(employeeId, meeting.matchId);
  return meeting;
}

calendarRouter.post("/meetings/:meetingId/retry", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meeting = await organiserMeeting(employeeId, id(req.params.meetingId));
  res.json(meetingView(await synchroniseMeeting(meeting, employeeId)));
});

calendarRouter.post("/meetings/:meetingId/sync", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meeting = await organiserMeeting(employeeId, id(req.params.meetingId));
  res.json(meetingView(await reconcileMeeting(meeting, employeeId)));
});

calendarRouter.patch("/meetings/:meetingId", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meeting = await organiserMeeting(employeeId, id(req.params.meetingId));
  if (meeting.status !== "scheduled") throw new AppError(409, "Complete the pending operation before rescheduling.");
  const booking = await checkedBooking(employeeId, { ...req.body, matchId: meeting.matchId });
  const changed = await database().meeting.updateMany({ where: { meetingId: meeting.meetingId, status: "scheduled" }, data: {
    startsAt: booking.start, endsAt: booking.end, meetingDate: booking.start, startTime: booking.start, endTime: booking.end,
    location: booking.location, status: "calendar_failed", syncOperation: "reschedule", syncUpdatedAt: new Date(),
  } });
  if (!changed.count) throw new AppError(409, "Another update is in progress. Refresh and try again.");
  res.json(meetingView(await synchroniseMeeting(await organiserMeeting(employeeId, meeting.meetingId), employeeId)));
});

calendarRouter.post("/meetings/:meetingId/cancel", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meeting = await organiserMeeting(employeeId, id(req.params.meetingId));
  if (!["scheduled", "calendar_failed"].includes(meeting.status)) throw new AppError(409, "Complete the pending operation before cancelling.");
  if (!meeting.graphEventId && meeting.syncUpdatedAt && Date.now() - meeting.syncUpdatedAt.getTime() < 120_000) {
    throw new AppError(409, "Wait two minutes before cancelling an unconfirmed booking, so Outlook can finish processing it.");
  }
  const changed = await database().meeting.updateMany({ where: { meetingId: meeting.meetingId, status: meeting.status, syncUpdatedAt: meeting.syncUpdatedAt },
    data: { status: "calendar_failed", syncOperation: "cancel", syncUpdatedAt: new Date() } });
  if (!changed.count) throw new AppError(409, "Another update is in progress. Refresh and try again.");
  res.json(meetingView(await synchroniseMeeting(await organiserMeeting(employeeId, meeting.meetingId), employeeId)));
});