import { Router } from "express";
import { selectWeightedPerson, topMatchPeople } from "@coffee-connect/matching";
import { type Meeting } from "@prisma/client";
import { AppError } from "../lib/AppError";
import { requiredEnv } from "../lib/config";
import { database } from "../lib/database";
import { requireAuth } from "../middleware/auth";

export const schedulerRouter = Router();
schedulerRouter.use(requireAuth);
schedulerRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function id(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") throw new AppError(400, "A valid identifier is required.");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new AppError(400, "A valid identifier is required.");
  return parsed;
}

function instant(value: unknown): Date {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new AppError(400, "Provide a valid date and time.");
  return new Date(value);
}

function meetingView(meeting: Meeting) {
  return {
    meetingId: meeting.meetingId,
    matchId: meeting.matchId,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    location: meeting.location,
    status: meeting.status,
    organiserId: meeting.organiserId,
  };
}

function formatIcsUtc(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

async function sendBrevoInvite(args: {
  meetingId: number;
  startsAt: Date;
  endsAt: Date;
  location: string;
  organiserName: string;
  organiserEmail: string;
  attendeeName: string;
  attendeeEmail: string;
}) {
  const apiKey = requiredEnv("BREVO_API_KEY");
  const senderEmail = requiredEnv("BREVO_SENDER_EMAIL");
  const senderName = process.env.BREVO_SENDER_NAME || "Coffee Connect";

  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coffee Connect//Meetup Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:coffee-connect-meetup-${args.meetingId}@coffee-connect`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsUtc(args.startsAt)}`,
    `DTEND:${formatIcsUtc(args.endsAt)}`,
    `SUMMARY:${escapeIcs(`Coffee meetup: ${args.organiserName} & ${args.attendeeName}`)}`,
    `DESCRIPTION:${escapeIcs("Coffee Connect meetup")}`,
    `LOCATION:${escapeIcs(args.location || "Office cafe")}`,
    `ORGANIZER;CN=${escapeIcs(args.organiserName)}:mailto:${args.organiserEmail}`,
    `ATTENDEE;CN=${escapeIcs(args.attendeeName)};ROLE=REQ-PARTICIPANT:mailto:${args.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(args.startsAt);
  const recipients = [
    { email: args.attendeeEmail, name: args.attendeeName },
    { email: args.organiserEmail, name: args.organiserName },
  ].filter((recipient, index, all) => all.findIndex((candidate) => candidate.email.toLowerCase() === recipient.email.toLowerCase()) === index);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: recipients,
      replyTo: { email: args.organiserEmail, name: args.organiserName },
      subject: `Coffee Connect meetup invite - ${when}`,
      textContent: `Hi ${args.attendeeName},\n\nWould you like to meet for coffee?\n\nTime: ${when}\nLocation: ${args.location || "Office cafe"}\n\nBest,\n${args.organiserName}`,
      attachment: [{ name: `coffee-connect-meetup-${args.meetingId}.ics`, content: Buffer.from(icsContent, "utf8").toString("base64") }],
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.warn("Brevo invite send failed", { status: response.status, details });
    throw new AppError(502, "Invite email service could not send the message.");
  }
}

async function wheelPeople(employeeId: number) {
  const current = await database().employee.findUnique({ where: { employeeId }, select: { officeLocation: true } });
  if (!current) throw new AppError(404, "Employee not found.");
  if (!current.officeLocation) {
    return database().employee.findMany({
      where: { employeeId, isActive: true },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        officeLocation: true,
        interests: { select: { interest: { select: { interestName: true, categoryId: true } } } },
      },
      orderBy: { employeeId: "asc" },
    });
  }
  return database().employee.findMany({
    where: { isActive: true, officeLocation: current.officeLocation },
    select: {
      employeeId: true,
      firstName: true,
      lastName: true,
      officeLocation: true,
      interests: { select: { interest: { select: { interestName: true, categoryId: true } } } },
    },
    orderBy: { employeeId: "asc" },
  });
}

schedulerRouter.get("/people", async (req, res) => {
  const people = await wheelPeople(Number(req.user!.id));
  res.json(people.map((person) => ({
    id: String(person.employeeId),
    name: `${person.firstName} ${person.lastName}`.trim(),
    officeLocation: person.officeLocation,
    interests: person.interests.map((item) => item.interest.interestName),
    categories: [...new Set(person.interests.flatMap((item) => item.interest.categoryId === null ? [] : [String(item.interest.categoryId)]))],
  })));
});

schedulerRouter.get("/matches", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const matches = await database().match.findMany({
    where: { OR: [{ employeeOneId: employeeId }, { employeeTwoId: employeeId }] },
    orderBy: { matchDate: "desc" },
    take: 100,
    include: {
      employeeOne: { select: { employeeId: true, firstName: true, lastName: true, email: true, officeLocation: true } },
      employeeTwo: { select: { employeeId: true, firstName: true, lastName: true, email: true, officeLocation: true } },
    },
  });
  res.json(matches.map((match) => {
    const colleague = match.employeeOneId === employeeId ? match.employeeTwo : match.employeeOne;
    return {
      matchId: match.matchId,
      colleague: {
        id: colleague.employeeId,
        firstName: colleague.firstName,
        lastName: colleague.lastName,
        email: colleague.email,
        officeLocation: colleague.officeLocation,
      },
      matchDate: match.matchDate,
    };
  }));
});

schedulerRouter.post("/matches/select", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const colleagueId = id(req.body?.colleagueId);
  if (colleagueId === employeeId) throw new AppError(400, "You cannot select yourself.");

  const people = await wheelPeople(employeeId);
  const selected = people.find((person) => person.employeeId === colleagueId);
  if (!selected) throw new AppError(404, "Selected colleague is not currently available for your office draw.");

  const existing = await database().match.findFirst({
    where: {
      OR: [
        { employeeOneId: employeeId, employeeTwoId: selected.employeeId },
        { employeeOneId: selected.employeeId, employeeTwoId: employeeId },
      ],
    },
    orderBy: { matchDate: "desc" },
  });
  const match = existing ?? await database().match.create({
    data: {
      employeeOneId: employeeId,
      employeeTwoId: selected.employeeId,
      matchType: "shared_interests",
      matchStatus: "matched",
      generatedByWheelSpin: true,
    },
  });

  res.status(existing ? 200 : 201).json({
    matchId: match.matchId,
    colleagueId: String(selected.employeeId),
    colleague: {
      id: selected.employeeId,
      name: `${selected.firstName} ${selected.lastName}`.trim(),
      officeLocation: selected.officeLocation,
    },
  });
});

schedulerRouter.post("/matches", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const people = await wheelPeople(employeeId);
  const current = people.find((person) => person.employeeId === employeeId);
  const candidates = people.map((person) => ({
    id: String(person.employeeId),
    name: `${person.firstName} ${person.lastName}`.trim(),
    person,
    interests: person.interests.map((item) => item.interest.interestName),
    categories: [...new Set(person.interests.flatMap((item) => item.interest.categoryId === null ? [] : [String(item.interest.categoryId)]))],
  }));
  const currentInterests = current?.interests.map((item) => item.interest.interestName) ?? [];
  const currentCategories = current?.interests.flatMap((item) => item.interest.categoryId === null ? [] : [String(item.interest.categoryId)]) ?? [];
  const rankedCandidates = topMatchPeople(candidates, String(employeeId), currentInterests, currentCategories, 8);
  const winner = selectWeightedPerson(rankedCandidates, String(employeeId), currentInterests, undefined, currentCategories);
  if (!winner) throw new AppError(409, "No same-office colleagues are available yet.");
  const selected = winner.person.person;
  const existing = await database().match.findFirst({
    where: {
      OR: [
        { employeeOneId: employeeId, employeeTwoId: selected.employeeId },
        { employeeOneId: selected.employeeId, employeeTwoId: employeeId },
      ],
    },
    orderBy: { matchDate: "desc" },
  });
  const match = existing ?? await database().match.create({
    data: {
      employeeOneId: employeeId,
      employeeTwoId: selected.employeeId,
      matchType: "shared_interests",
      matchStatus: "matched",
      generatedByWheelSpin: true,
    },
  });
  res.status(existing ? 200 : 201).json({ matchId: match.matchId, colleagueId: String(selected.employeeId) });
});

schedulerRouter.get("/meetups", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meetings = await database().meeting.findMany({
    where: {
      startsAt: { not: null },
      match: { OR: [{ employeeOneId: employeeId }, { employeeTwoId: employeeId }] },
    },
    orderBy: { startsAt: "desc" },
    take: 100,
  });
  res.json(meetings.map(meetingView));
});

schedulerRouter.post("/meetups", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const matchId = id(req.body?.matchId);
  const startsAt = instant(req.body?.startsAt);
  if (startsAt.getTime() < Date.now() + 5 * 60_000) throw new AppError(400, "Choose a time at least 5 minutes from now.");
  const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
  if (!location || location.length > 255) throw new AppError(400, "Enter a location up to 255 characters.");

  const match = await database().match.findUnique({ where: { matchId } });
  if (!match || (match.employeeOneId !== employeeId && match.employeeTwoId !== employeeId)) {
    throw new AppError(404, "Match not found.");
  }

  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const meeting = await database().meeting.create({
    data: {
      matchId,
      activeMatchId: matchId,
      organiserId: employeeId,
      meetingDate: startsAt,
      startTime: startsAt,
      endTime: endsAt,
      startsAt,
      endsAt,
      location,
      status: "scheduled",
      timeZone: "Europe/London",
    },
  });
  res.status(201).json(meetingView(meeting));
});

schedulerRouter.patch("/meetups/:meetingId", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meetingId = id(req.params.meetingId);
  const meeting = await database().meeting.findUnique({ where: { meetingId } });
  if (!meeting || meeting.organiserId !== employeeId) throw new AppError(404, "Meetup not found, or you are not the organiser.");

  const startsAt = instant(req.body?.startsAt);
  if (startsAt.getTime() < Date.now() + 5 * 60_000) throw new AppError(400, "Choose a time at least 5 minutes from now.");
  const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
  if (!location || location.length > 255) throw new AppError(400, "Enter a location up to 255 characters.");

  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const updated = await database().meeting.update({
    where: { meetingId },
    data: {
      meetingDate: startsAt,
      startTime: startsAt,
      endTime: endsAt,
      startsAt,
      endsAt,
      location,
      status: "scheduled",
    },
  });
  res.json(meetingView(updated));
});

schedulerRouter.post("/meetups/:meetingId/send-invite", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meetingId = id(req.params.meetingId);
  const meeting = await database().meeting.findUnique({
    where: { meetingId },
    include: {
      match: {
        include: {
          employeeOne: { select: { employeeId: true, firstName: true, lastName: true, email: true } },
          employeeTwo: { select: { employeeId: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
  if (!meeting || meeting.organiserId !== employeeId) throw new AppError(404, "Meetup not found, or you are not the organiser.");
  if (!meeting.startsAt || !meeting.endsAt) throw new AppError(409, "Meetup time is missing. Reschedule before sending an invite.");

  const organiser = meeting.match.employeeOne.employeeId === employeeId ? meeting.match.employeeOne : meeting.match.employeeTwo;
  const attendee = meeting.match.employeeOne.employeeId === employeeId ? meeting.match.employeeTwo : meeting.match.employeeOne;
  if (!attendee.email) throw new AppError(409, "Matched colleague does not have an email address.");

  await sendBrevoInvite({
    meetingId: meeting.meetingId,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    location: meeting.location || "Office cafe",
    organiserName: `${organiser.firstName} ${organiser.lastName}`.trim() || "Coffee Connect",
    organiserEmail: organiser.email,
    attendeeName: `${attendee.firstName} ${attendee.lastName}`.trim() || attendee.email,
    attendeeEmail: attendee.email,
  });

  res.status(202).json({ message: "Invite sent." });
});

schedulerRouter.post("/meetups/:meetingId/cancel", async (req, res) => {
  const employeeId = Number(req.user!.id);
  const meetingId = id(req.params.meetingId);
  const meeting = await database().meeting.findUnique({ where: { meetingId } });
  if (!meeting || meeting.organiserId !== employeeId) throw new AppError(404, "Meetup not found, or you are not the organiser.");
  const cancelled = await database().meeting.update({ where: { meetingId }, data: { status: "cancelled" } });
  res.json(meetingView(cancelled));
});
