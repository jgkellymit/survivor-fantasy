import { expect, it } from "vitest";
import { nextWednesdayMidnight, formatDeadline, fromPTInput, toPTInput } from "./time";

it("deadline is Thursday 00:00 PT (= 08:00 UTC in PST)", () => {
  const d = nextWednesdayMidnight(new Date("2026-11-09T22:00:00Z"));
  expect(d.toISOString()).toBe("2026-11-12T08:00:00.000Z");
  expect(formatDeadline(d)).toBe("midnight Wednesday, Nov 11 PT");
});
it("handles daylight time", () => {
  expect(nextWednesdayMidnight(new Date("2026-09-01T00:00:00Z")).toISOString()).toBe("2026-09-03T07:00:00.000Z");
});
it("round-trips datetime-local", () => {
  const d = new Date("2026-11-12T08:00:00Z");
  expect(toPTInput(d)).toBe("2026-11-12T00:00");
  expect(fromPTInput("2026-11-12T00:00").toISOString()).toBe(d.toISOString());
});
