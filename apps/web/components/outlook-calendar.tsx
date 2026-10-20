"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ExternalLink, Link2, LogOut, RefreshCw, Unlink, X } from "lucide-react";
import SpinWheel from "./spin-wheel";
import styles from "./outlook-calendar.module.css";

type Connection = { configured: boolean; connected: boolean; employeeId?: number; mailbox?: string; csrfToken?: string; timeZone?: string; workStart?: number; workEnd?: number };
type Match = { matchId: number; colleague: { firstName: string; lastName: string } };
type Person = { id: string; name: string; interests: string[]; categories: string[] };
type Slot = { start: string; end: string };
type Meeting = { meetingId: number; matchId: number; startsAt: string; endsAt: string; location: string; status: string; organiserId: number; outlookUrl?: string; syncOperation?: string };
const api = "/api/coffee";
const timeInput = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const minuteValue = (time: string) => Number(time.split(":")[0]) * 60 + Number(time.split(":")[1]);

async function request<T>(path: string, csrf?: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${api}${path}`, { method, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Coffee Connect could not reach the calendar service.");
  }
  return response.status === 204 ? undefined as T : response.json();
}

export default function OutlookCalendar() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [matchId, setMatchId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState("");
  const [fromDay, setFromDay] = useState("");
  const [location, setLocation] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [timeZone, setTimeZone] = useState("Europe/London");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const bookingRequest = useRef<{ signature: string; requestId: string } | null>(null);

  async function load() {
    const status = await request<Connection>("/auth/microsoft/status");
    setConnection(status);
    if (status.connected) {
      const [savedMatches, savedMeetings, colleagues] = await Promise.all([
        request<Match[]>("/calendar/matches"), request<Meeting[]>("/calendar/meetings"), request<Person[]>("/calendar/people"),
      ]);
      setMatches(savedMatches); setMeetings(savedMeetings); setPeople(colleagues);
      setTimeZone(status.timeZone || "Europe/London");
      setWorkStart(timeInput(status.workStart ?? 540)); setWorkEnd(timeInput(status.workEnd ?? 1020));
    } else {
      setMatches([]); setMeetings([]); setPeople([]); setSlots([]);
    }
  }

  useEffect(() => {
    load().catch((caught: Error) => setError(caught.message));
    if (new URLSearchParams(window.location.search).get("outlook") === "denied") setError("Microsoft calendar access was not approved.");
  }, []);

  async function action(operation: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await operation(); } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The calendar request failed.");
      await load().catch(() => undefined);
    } finally { setBusy(false); }
  }

  function clearSlots() { setSlots([]); setSelected(""); bookingRequest.current = null; }
  const displayTime = (value: string) => new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium", timeStyle: "short", timeZone: connection?.timeZone || "Europe/London",
  }).format(new Date(value));
  const safeOutlookUrl = (value?: string) => {
    try { const url = new URL(value || ""); return url.protocol === "https:" && ["outlook.office.com", "outlook.office365.com", "outlook.live.com"].includes(url.hostname) ? url.href : undefined; } catch { return undefined; }
  };

  return (
    <div className={styles.calendar}>
      <section className={styles.connection} aria-labelledby="outlook-heading">
        <div><h2 id="outlook-heading"><CalendarDays size={23} aria-hidden="true" /> Outlook calendar</h2>
          <p>{connection?.connected ? connection.mailbox : connection?.configured === false ? "Outlook setup pending" : connection ? "Not connected" : "Checking connection..."}</p></div>
        <div className={styles.actions}>
          <button type="button" title="Refresh calendar" aria-label="Refresh calendar" disabled={busy} onClick={() => action(load)}><RefreshCw size={18} /></button>
          {connection?.connected ? <>
            <button type="button" disabled={busy} onClick={() => action(async () => { await request("/auth/microsoft/logout", connection.csrfToken, "POST"); await load(); })}><LogOut size={17} /> Sign out</button>
            <button type="button" disabled={busy} onClick={() => { if (window.confirm("Disconnect Outlook? Existing invitations will remain in Outlook.")) action(async () => { await request("/auth/microsoft/disconnect", connection.csrfToken, "POST"); await load(); }); }}><Unlink size={17} /> Disconnect</button>
          </> : connection?.configured && <a className={styles.primary} href={`${api}/auth/microsoft/connect`}><Link2 size={18} /> Connect Microsoft</a>}
        </div>
      </section>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {connection && !connection.connected && <section className={styles.bookingPreview} aria-label="Coffee meetup dashboard">
        <article className={styles.previewCard}>
          <h2>Book a coffee meetup</h2>
          <p>Connect Outlook to find a time that works for both of you.</p>
          <div className={styles.previewDurations} aria-hidden="true">
            <span>30 min</span><span>45 min</span><span>1 hour</span><span>Custom</span>
          </div>
          <div className={styles.previewDate}>
            <span>Choose a day</span>
            <span><CalendarDays size={16} aria-hidden="true" /> Available times appear here</span>
          </div>
          <button type="button" disabled>{connection.configured ? "Connect Outlook to continue" : "Outlook setup pending"}</button>
        </article>
        <article className={styles.previewCard}>
          <h2>Your Coffee Match</h2>
          <div className={styles.previewAvatar} aria-hidden="true">?</div>
          <p>Your colleague match will appear here when Outlook is connected.</p>
        </article>
      </section>}
      {connection?.connected && <>
        <details className={styles.preferences}>
          <summary>Calendar preferences</summary>
          <form className={styles.form} onSubmit={(event) => { event.preventDefault(); action(async () => {
            await request("/calendar/preferences", connection.csrfToken, "PATCH", { timeZone, workStart: minuteValue(workStart), workEnd: minuteValue(workEnd) });
            clearSlots(); await load(); setNotice("Calendar preferences saved.");
          }); }}>
            <label>Time zone<input value={timeZone} required list="coffee-timezones" onChange={(event) => { setTimeZone(event.target.value); clearSlots(); }} /></label>
            <datalist id="coffee-timezones">{["Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "UTC"].map((zone) => <option key={zone} value={zone} />)}</datalist>
            <label>Weekdays from<input type="time" value={workStart} required onChange={(event) => { setWorkStart(event.target.value); clearSlots(); }} /></label>
            <label>Until<input type="time" value={workEnd} required onChange={(event) => { setWorkEnd(event.target.value); clearSlots(); }} /></label>
            <button disabled={busy} type="submit"><Check size={17} /> Save preferences</button>
          </form>
        </details>
        <section className={styles.booking} aria-labelledby="coffee-booking-title">
          <div className={styles.wheel}>
            <h2>Your next conversation</h2>
            {people.length > 1 ? <SpinWheel currentUserId={String(connection.employeeId)} people={people}
              currentUserInterests={people.find((person) => person.id === String(connection.employeeId))?.interests || []}
              currentUserCategories={people.find((person) => person.id === String(connection.employeeId))?.categories || []}
              resolveWinner={async () => {
                const match = await request<{ matchId: number; colleagueId: string }>("/calendar/matches", connection.csrfToken, "POST");
                await load(); setMatchId(String(match.matchId)); setEditing(null); clearSlots(); return match.colleagueId;
              }} /> : <p>No connected colleagues yet.</p>}
          </div>
          <div id="coffee-booking-form">
            <h2 id="coffee-booking-title">{editing ? "Reschedule coffee" : "Arrange a coffee"}</h2>
            {matches.length ? <form onSubmit={(event) => { event.preventDefault(); action(async () => {
              clearSlots();
              const earliest = Date.now() + 10 * 60_000;
              const from = new Date(Math.max(earliest, fromDay ? Date.parse(`${fromDay}T00:00:00Z`) : earliest));
              const result = await request<Slot[]>(`/calendar/availability?${new URLSearchParams({ matchId, from: from.toISOString(), to: new Date(from.getTime() + 7 * 86_400_000).toISOString() })}`);
              setSlots(result); if (!result.length) setNotice("No shared 30-minute slots found in the next seven days.");
            }); }}>
              <div className={styles.fields}>
                <label>Colleague<select value={matchId} required disabled={busy || editing !== null} onChange={(event) => { setMatchId(event.target.value); clearSlots(); }}>
                  <option value="">Select a match</option>{matches.map((match) => <option key={match.matchId} value={match.matchId}>{match.colleague.firstName} {match.colleague.lastName}</option>)}
                </select></label>
                <label>Search from<input type="date" value={fromDay} min={new Date().toISOString().slice(0, 10)} onChange={(event) => { setFromDay(event.target.value); clearSlots(); }} /></label>
                <label>Location<input value={location} maxLength={255} onChange={(event) => setLocation(event.target.value)} placeholder="Office cafe" /></label>
              </div>
              <div className={styles.actions}>
                <button type="submit" disabled={busy || !matchId}><CalendarDays size={17} /> {busy ? "Checking..." : "Find available times"}</button>
                {editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); clearSlots(); }}><X size={17} /> Stop rescheduling</button>}
              </div>
            </form> : <p>No saved matches yet.</p>}
            {slots.length > 0 && <fieldset className={styles.slots} disabled={busy}>
              <legend>Available times - {connection.timeZone}</legend>
              {slots.map((slot) => <label key={slot.start} className={selected === slot.start ? styles.selected : ""}>
                <input type="radio" name="coffee-slot" value={slot.start} checked={selected === slot.start} onChange={() => setSelected(slot.start)} />{displayTime(slot.start)}
              </label>)}
            </fieldset>}
            {selected && <button className={styles.primary} type="button" disabled={busy || !location.trim()} onClick={() => action(async () => {
              const slot = slots.find((candidate) => candidate.start === selected)!;
              const signature = JSON.stringify([matchId, slot.start, slot.end, location]);
              if (bookingRequest.current?.signature !== signature) bookingRequest.current = { signature, requestId: crypto.randomUUID() };
              await request(editing ? `/calendar/meetings/${editing}` : "/calendar/meetings", connection.csrfToken, editing ? "PATCH" : "POST", {
                matchId: Number(matchId), ...slot, location, requestId: bookingRequest.current.requestId,
              });
              clearSlots(); setEditing(null); await load(); setNotice("Outlook invitation sent.");
            })}><Check size={18} /> {editing ? "Confirm new time" : "Confirm and send invitation"}</button>}
          </div>
        </section>
        <section className={styles.meetings} aria-labelledby="saved-meetings-title">
          <h2 id="saved-meetings-title">Your coffee meetings</h2>
          {!meetings.length && <p>No coffee meetings booked yet.</p>}
          {meetings.map((meeting) => {
            const match = matches.find((candidate) => candidate.matchId === meeting.matchId);
            const organiser = meeting.organiserId === connection.employeeId;
            const outlookUrl = safeOutlookUrl(meeting.outlookUrl);
            return <article key={meeting.meetingId} className={styles.meeting}>
              <div><h3>{match ? `${match.colleague.firstName} ${match.colleague.lastName}` : "Coffee Connect"}</h3>
                <p>{displayTime(meeting.startsAt)} - {connection.timeZone}</p><p>{meeting.location}</p>
                <span className={styles.status}>{meeting.status === "scheduled" ? "Invitation sent" : meeting.status === "cancelled" ? "Cancelled" : `Outlook update ${meeting.status === "calendar_failed" ? "needs retry" : "pending"}`}</span>
              </div>
              <div className={styles.actions}>
                {outlookUrl && <a href={outlookUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Outlook</a>}
                {organiser && meeting.status === "scheduled" && <button type="button" disabled={busy} onClick={() => action(async () => { await request(`/calendar/meetings/${meeting.meetingId}/sync`, connection.csrfToken, "POST"); await load(); setNotice("Meeting checked against Outlook."); })}><RefreshCw size={17} /> Check Outlook</button>}
                {organiser && meeting.syncOperation && <button type="button" disabled={busy} onClick={() => action(async () => { await request(`/calendar/meetings/${meeting.meetingId}/retry`, connection.csrfToken, "POST"); await load(); setNotice("Outlook update completed."); })}><RefreshCw size={17} /> Retry update</button>}
                {organiser && meeting.status === "calendar_failed" && <button type="button" disabled={busy} onClick={() => { if (window.confirm("Cancel this saved booking, including any Outlook invitation already created?")) action(async () => { await request(`/calendar/meetings/${meeting.meetingId}/cancel`, connection.csrfToken, "POST"); await load(); setNotice("Booking cancelled."); }); }}><X size={17} /> Cancel booking</button>}
                {organiser && meeting.status === "scheduled" && <>
                  <button type="button" disabled={busy} onClick={() => { setEditing(meeting.meetingId); setMatchId(String(meeting.matchId)); setLocation(meeting.location); clearSlots(); document.getElementById("coffee-booking-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><CalendarDays size={17} /> Reschedule</button>
                  <button type="button" disabled={busy} onClick={() => { if (window.confirm("Cancel this coffee meeting and notify your colleague?")) action(async () => { await request(`/calendar/meetings/${meeting.meetingId}/cancel`, connection.csrfToken, "POST"); await load(); setNotice("Meeting cancelled."); }); }}><X size={17} /> Cancel</button>
                </>}
              </div>
            </article>;
          })}
        </section>
      </>}
    </div>
  );
}