const TZ = "America/Los_Angeles";

/** Offset in minutes of Pacific time from UTC at the given instant (e.g. -480 for PST). */
function ptOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The instant of a Pacific wall-clock time. */
export function ptToDate(y: number, m: number, d: number, hh = 0, mm = 0): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const off = ptOffsetMinutes(guess);
  const first = new Date(guess.getTime() - off * 60000);
  const off2 = ptOffsetMinutes(first);
  return off2 === off ? first : new Date(guess.getTime() - off2 * 60000);
}

/** Pacific calendar date parts of an instant. */
export function ptParts(at: Date) {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(at);
  const g = (t: string) => s.find((p) => p.type === t)!.value;
  return { y: Number(g("year")), m: Number(g("month")), d: Number(g("day")), weekday: g("weekday") };
}

/** "Midnight Wednesday PT": the first Thursday 00:00 Pacific strictly after `after`. */
export function nextWednesdayMidnight(after: Date = new Date()): Date {
  const { y, m, d } = ptParts(after);
  for (let i = 0; i < 9; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i));
    if (day.getUTCDay() !== 4) continue; // Thursday
    const t = ptToDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), 0, 0);
    if (t > after) return t;
  }
  throw new Error("unreachable");
}

export function formatPT(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d);
}

export function formatDeadline(d: Date): string {
  // Thursday 00:00 reads better as "midnight Wednesday"
  const inst = new Date(d.getTime() - 60000);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "short", day: "numeric" }).format(inst);
  const hm = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hourCycle: "h23" }).format(d);
  return hm === "00:00" ? `midnight ${day} PT` : formatPT(d);
}

/** value for <input type="datetime-local"> in Pacific time */
export function toPTInput(d: Date): string {
  const s = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return s.replace(" ", "T");
}
export function fromPTInput(v: string): Date {
  const [date, time] = v.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time ?? "00:00").split(":").map(Number);
  return ptToDate(y, m, d, hh, mm);
}
