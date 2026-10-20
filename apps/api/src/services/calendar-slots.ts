export type BusyPeriod = { start: string; end: string; status: string };
export type CalendarPerson = {
  timeZone: string;
  workStart: number;
  workEnd: number;
  busy: BusyPeriod[];
};
export type CoffeeSlot = { start: string; end: string };

export function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function withinWorkingHours(start: Date, end: Date, person: CalendarPerson): boolean {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: person.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const parts = formatter.formatToParts(start);
  const endParts = formatter.formatToParts(end);
  const value = (items: Intl.DateTimeFormatPart[], type: string) => items.find((part) => part.type === type)?.value;
  const minute = Number(value(parts, "hour")) * 60 + Number(value(parts, "minute"));
  const endMinute = Number(value(endParts, "hour")) * 60 + Number(value(endParts, "minute"));
  return !["Sat", "Sun"].includes(value(parts, "weekday") ?? "") &&
    value(parts, "weekday") === value(endParts, "weekday") &&
    minute >= person.workStart && endMinute <= person.workEnd && endMinute > minute;
}

export function findCoffeeSlots(from: Date, to: Date, people: CalendarPerson[], duration = 30): CoffeeSlot[] {
  if (people.length !== 2 || !Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) ||
      to <= from || duration !== 30) {
    throw new Error("A valid range and two calendars are required for a 30-minute coffee.");
  }
  for (const person of people) {
    if (!validTimeZone(person.timeZone) || person.workStart < 0 || person.workEnd > 1440 || person.workStart >= person.workEnd ||
        person.busy.some((period) => !Number.isFinite(Date.parse(period.start)) ||
          !Number.isFinite(Date.parse(period.end)) || Date.parse(period.end) <= Date.parse(period.start))) {
      throw new Error("Calendar information is invalid.");
    }
  }
  const slots: CoffeeSlot[] = [];
  const step = 15 * 60_000;
  for (let cursor = Math.ceil(from.getTime() / step) * step; cursor + duration * 60_000 <= to.getTime(); cursor += step) {
    const start = new Date(cursor);
    const end = new Date(cursor + duration * 60_000);
    if (people.every((person) => withinWorkingHours(start, end, person) &&
      !person.busy.some((period) => period.status !== "free" &&
        Date.parse(period.start) < end.getTime() && Date.parse(period.end) > start.getTime()))) {
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }
  return slots;
}