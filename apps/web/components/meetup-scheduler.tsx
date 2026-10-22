"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, RefreshCw, X } from "lucide-react";
import styles from "./outlook-calendar.module.css";

type Account = { id: number; name: string; email: string };
type Match = { matchId: number; colleague: { id: number; firstName: string; lastName: string; email: string; officeLocation?: string | null } };
type SelectedColleague = { id: number; name: string; officeLocation?: string | null; matchId: number };
type Meetup = { meetingId: number; matchId: number; startsAt: string; endsAt: string; location: string; status: string; organiserId: number };
const api = "/api/scheduler";

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${api}/${path}`, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Could not complete the scheduling request.");
  }
  return response.status === 204 ? undefined as T : response.json();
}

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatIcsUtc(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function downloadInviteIcs(args: {
  meetupId: number;
  startsAt: string;
  endsAt: string;
  location: string;
  organiserName: string;
  organiserEmail: string;
  attendeeName: string;
  attendeeEmail: string;
}) {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coffee Connect//Meetup Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:coffee-connect-meetup-${args.meetupId}@coffee-connect`,
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

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `coffee-connect-meetup-${args.meetupId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function MeetupScheduler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [account, setAccount] = useState<Account | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [matchId, setMatchId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedColleague, setSelectedColleague] = useState<SelectedColleague | null>(null);

  async function load() {
    const [auth, savedMatches, savedMeetups] = await Promise.all([
      fetch("/api/auth", { cache: "no-store" }),
      request<Match[]>("matches"),
      request<Meetup[]>("meetups"),
    ]);
    if (!auth.ok) throw new Error("Please log in to manage meetups.");
    const authPayload = await auth.json() as { account: Account };
    setAccount(authPayload.account);
    setMatches(savedMatches);
    setMeetups(savedMeetups);
  }

  const candidateIdFromQuery = useMemo(() => searchParams.get("candidateId"), [searchParams]);
  const candidateNameFromQuery = useMemo(() => searchParams.get("candidateName"), [searchParams]);


  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      await load();
      if (candidateIdFromQuery) {
        const accepted = await request<{ matchId: number; colleagueId: string; colleague: { id: number; name: string; officeLocation?: string | null } }>(
          "matches/select",
          "POST",
          { colleagueId: Number(candidateIdFromQuery) },
        );
        if (!cancelled) {
          setMatchId(String(accepted.matchId));
          setSelectedColleague({
            id: accepted.colleague.id,
            name: candidateNameFromQuery || accepted.colleague.name,
            officeLocation: accepted.colleague.officeLocation,
            matchId: accepted.matchId,
          });
          setNotice("Match accepted. Pick a time below to schedule your meetup.");
        }
        await load();
        router.replace("/meetups");
      }
    }
    bootstrap().catch((caught: Error) => setError(caught.message));
    return () => {
      cancelled = true;
    };
  }, [candidateIdFromQuery, candidateNameFromQuery, router]);

  async function action(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scheduling request failed.");
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  const displayTime = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <div className={styles.calendar}>
      <section className={styles.connection} aria-labelledby="scheduler-heading">
        <div>
          <h2 id="scheduler-heading"><CalendarDays size={23} aria-hidden="true" /> Coffee meetup scheduler</h2>
          <p>{account ? `Signed in as ${account.email}` : "Checking your account..."}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" title="Refresh scheduler" aria-label="Refresh scheduler" disabled={busy} onClick={() => action(load)}><RefreshCw size={18} /></button>
        </div>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      <section className={styles.booking} aria-labelledby="coffee-booking-title">
        <div className={styles.meetingsPanel}>
          <h2>Your coffee meetups</h2>
          {!meetups.length && <p>No meetups booked yet.</p>}
          {meetups.map((meetup) => {
            const match = matches.find((candidate) => candidate.matchId === meetup.matchId);
            const organiser = meetup.organiserId === account?.id;
            return (
              <article key={meetup.meetingId} className={styles.meeting}>
                <div>
                  <h3>{match ? `${match.colleague.firstName} ${match.colleague.lastName}` : "Coffee Connect"}</h3>
                  <p>{displayTime(meetup.startsAt)}</p>
                  <p>{meetup.location}</p>
                  <span className={styles.status}>{meetup.status === "cancelled" ? "Cancelled" : "Scheduled"}</span>
                </div>
                <div className={styles.actions}>
                  {organiser && meetup.status !== "cancelled" && (
                    <>
                      <button
                        type="button"
                        disabled={busy || !match?.colleague.email}
                        onClick={() => {
                          if (!match?.colleague.email) return;
                          void action(async () => {
                            await request(`meetups/${meetup.meetingId}/send-invite`, "POST");
                            setNotice("Invite sent with calendar attachment.");
                          });
                        }}
                      >
                        <Check size={17} /> Send invite
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditing(meetup.meetingId);
                          setMatchId(String(meetup.matchId));
                          setStartsAt(toLocalInputValue(meetup.startsAt));
                          setLocation(meetup.location);
                          document.getElementById("coffee-booking-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                      >
                        <CalendarDays size={17} /> Reschedule
                      </button>
                      <button
                        type="button"
                        disabled={busy || !account || !match?.colleague.email}
                        onClick={() => {
                          if (!account || !match?.colleague.email) return;
                          downloadInviteIcs({
                            meetupId: meetup.meetingId,
                            startsAt: meetup.startsAt,
                            endsAt: meetup.endsAt,
                            location: meetup.location || "Office cafe",
                            organiserName: account.name,
                            organiserEmail: account.email,
                            attendeeName: `${match.colleague.firstName} ${match.colleague.lastName}`.trim(),
                            attendeeEmail: match.colleague.email,
                          });
                          setNotice("Calendar invite (.ics) downloaded. Attach it to your email invite.");
                        }}
                      >
                        <CalendarDays size={17} /> Download .ics
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Cancel this coffee meetup?")) {
                            void action(async () => {
                              await request(`meetups/${meetup.meetingId}/cancel`, "POST");
                              await load();
                              setNotice("Meetup cancelled.");
                            });
                          }
                        }}
                      >
                        <X size={17} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div id="coffee-booking-form">
          <h2 id="coffee-booking-title">{editing ? "Reschedule meetup" : "Arrange a meetup"}</h2>
          {selectedColleague && (
            <article className={styles.previewCard}>
              <h3>{selectedColleague.name}</h3>
              <p>{selectedColleague.officeLocation ? `Office: ${selectedColleague.officeLocation}` : "Office not set"}</p>
              <p>Your accepted match is ready. Choose a time to schedule your meetup.</p>
            </article>
          )}
          {matches.length ? (
            <form onSubmit={(event) => {
              event.preventDefault();
              void action(async () => {
                if (!matchId) throw new Error("Select a colleague first.");
                if (!startsAt) throw new Error("Choose a date and time.");
                if (!location.trim()) throw new Error("Enter a meetup location.");
                await request(
                  editing ? `meetups/${editing}` : "meetups",
                  editing ? "PATCH" : "POST",
                  { matchId: Number(matchId), startsAt: new Date(startsAt).toISOString(), location },
                );
                setStartsAt("");
                setLocation("");
                setEditing(null);
                setSelectedColleague(null);
                await load();
                setNotice(editing ? "Meetup rescheduled." : "Meetup scheduled.");
              });
            }}>
              <div className={styles.fields}>
                <label>
                  Colleague
                  <select value={matchId} required disabled={busy || editing !== null} onChange={(event) => setMatchId(event.target.value)}>
                    <option value="">Select a match</option>
                    {matches.map((match) => (
                      <option key={match.matchId} value={match.matchId}>
                        {match.colleague.firstName} {match.colleague.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date & time
                  <input type="datetime-local" value={startsAt} required onChange={(event) => setStartsAt(event.target.value)} />
                </label>
                <label>
                  Location
                  <input value={location} maxLength={255} onChange={(event) => setLocation(event.target.value)} placeholder="Office cafe" required />
                </label>
              </div>
              <div className={styles.actions}>
                <button type="submit" disabled={busy || !matchId}><Check size={17} /> {busy ? "Saving..." : editing ? "Confirm new time" : "Schedule meetup"}</button>
                {editing && (
                  <button type="button" disabled={busy} onClick={() => { setEditing(null); setStartsAt(""); setLocation(""); }}>
                    <X size={17} /> Stop rescheduling
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p>No saved matches yet. Spin the wheel to create one.</p>
          )}
        </div>
      </section>



    </div>
  );
}
