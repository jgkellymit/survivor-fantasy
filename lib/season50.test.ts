import { describe, expect, it } from "vitest";
import { scoreSeason } from "./scoring";
import { playerOrder, season50, sheetScores } from "./season50.fixture";

// Places where the sheet itself is off, so the engine is expected to differ.
const KNOWN: Record<string, { engine: number; why: string }> = {
  "2:Cole": { engine: 16, why: "Cole picked Coach (voted out): 6 survival + 10. The sheet has 14." },
  "4:Rio": { engine: 27, why: "Sheet included +5 for Stephenie's advantage play, but Rio didn't have Stephenie." },
};

describe("Season 50 replay (weeks 1–8)", () => {
  const scores = scoreSeason(season50);
  for (const w of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`week ${w} matches the sheet`, () => {
      playerOrder.forEach((p, i) => {
        const got = scores.find((x) => x.playerId === p)!.weeks.find((x) => x.week === w)!.total;
        const known = KNOWN[`${w}:${p}`];
        expect(got, `${p} week ${w}`).toBe(known ? known.engine : sheetScores[w][i]);
      });
    });
  }
});

it("finale: Rio 70 and Pat 55, as Jack scored them", () => {
  const scores = scoreSeason(season50);
  const fin = (p: string) => scores.find((x) => x.playerId === p)!.weeks.find((x) => x.week === 9)!.total;
  expect(fin("Rio")).toBe(70);
  expect(fin("Pat")).toBe(55);
});
