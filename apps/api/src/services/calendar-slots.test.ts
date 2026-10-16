import { strict as assert } from "node:assert";
import { test } from "node:test";
import { findCoffeeSlots, type CalendarPerson } from "./calendar-slots";

const person: CalendarPerson = { timeZone: "Europe/London", workStart: 540, workEnd: 1020, busy: [] };

test("finds shared gaps and excludes tentative, busy and out-of-office periods", () => {
  const colleague = { ...person, busy: [
    { start: "2026-10-19T08:00:00Z", end: "2026-10-19T08:30:00Z", status: "tentative" },
    { start: "2026-10-19T09:00:00Z", end: "2026-10-19T09:30:00Z", status: "busy" },
    { start: "2026-10-19T09:30:00Z", end: "2026-10-19T10:00:00Z", status: "oof" },
  ] };
  assert.deepEqual(findCoffeeSlots(new Date("2026-10-19T08:00:00Z"), new Date("2026-10-19T10:00:00Z"), [person, colleague]),
    [{ start: "2026-10-19T08:30:00.000Z", end: "2026-10-19T09:00:00.000Z" }]);
});

test("respects daylight saving and both employees' preferred hours", () => {
  for (const [date, hour] of [["2026-10-19", "08"], ["2026-10-26", "09"]]) {
    const slots = findCoffeeSlots(new Date(`${date}T07:00:00Z`), new Date(`${date}T11:00:00Z`), [person, person]);
    assert.equal(slots[0].start, `${date}T${hour}:00:00.000Z`);
  }
  assert.equal(findCoffeeSlots(new Date("2026-10-19T08:00:00Z"), new Date("2026-10-19T10:00:00Z"),
    [person, { ...person, workStart: 660 }]).length, 0);
});

test("rejects missing calendars, invalid data and weekends", () => {
  const from = new Date("2026-10-17T09:00:00Z");
  const to = new Date("2026-10-17T11:00:00Z");
  assert.equal(findCoffeeSlots(from, to, [person, person]).length, 0);
  assert.throws(() => findCoffeeSlots(from, to, [person]));
  assert.throws(() => findCoffeeSlots(from, to, [person, { ...person, busy: [{ start: "bad", end: "bad", status: "busy" }] }]));
});