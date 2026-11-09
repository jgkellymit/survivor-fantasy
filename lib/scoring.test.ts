import { describe, expect, it } from "vitest";
import { scoreSeason, secondMostVoted, type SeasonData, type Tribal, type Week, type WeekResults } from "./scoring";

const cast = ["A", "B", "C", "D", "E", "F", "G", "H"].map((id) => ({ id, name: id, placement: null as number | null }));

function results(partial: Partial<WeekResults>): WeekResults {
  return { immunity: [], advantagesFound: [], advantagesPlayed: [], tribals: [], ...partial };
}
function tribal(partial: Partial<Tribal>): Tribal {
  return { votes: {}, immune: [], wentHome: null, departure: "vote", advantagesHeld: 0, ...partial };
}
function season(weeks: Week[], extra: Partial<SeasonData> = {}): SeasonData {
  return {
    castaways: cast.map((c) => ({ ...c })),
    players: [{ id: "p1", name: "Pat", team: ["A", "B", "C"], swap: null }],
    weeks,
    picks: [],
    ...extra,
  };
}
const week = (number: number, r: Partial<WeekResults>, isFinale = false): Week => ({ number, isFinale, results: results(r) });
const lines = (d: SeasonData, w = 1) => scoreSeason(d)[0].weeks.find((x) => x.week === w)!.lines;
const total = (d: SeasonData, w = 1) => scoreSeason(d)[0].weeks.find((x) => x.week === w)!.total;

describe("survival", () => {
  it("pays week number times castaways still in after the vote", () => {
    const d = season([week(1, { tribals: [tribal({ wentHome: "D", votes: { D: 5 } })] }), week(2, { tribals: [tribal({ wentHome: "A", votes: { A: 5 } })] })]);
    expect(total(d, 1)).toBe(3);
    expect(total(d, 2)).toBe(4); // 2 × 2
  });
  it("is not paid in the finale week", () => {
    const d = season([week(9, { tribals: [] }, true)]);
    expect(lines(d, 9)).toEqual([]);
  });
});

describe("immunity", () => {
  it("+10 winner, +5 runner-up", () => {
    const d = season([week(1, { immunity: [{ castawayId: "A", place: 1 }, { castawayId: "B", place: 2 }, { castawayId: "E", place: 1 }] })]);
    expect(total(d)).toBe(3 + 10 + 5);
  });
});

describe("advantages", () => {
  it("+5 found, +5 played, nothing for a play that doesn't count", () => {
    const d = season([
      week(1, {
        advantagesFound: [{ castawayId: "A" }],
        advantagesPlayed: [{ castawayId: "B" }, { castawayId: "C", counts: false }],
      }),
    ]);
    expect(total(d)).toBe(3 + 5 + 5);
  });
  it("-5 per advantage held when voted out", () => {
    const d = season([week(1, { tribals: [tribal({ wentHome: "A", votes: { A: 4 }, advantagesHeld: 2 })] })]);
    expect(total(d)).toBe(2 - 10);
  });
  it("quit: -5 per advantage plus -5 for quitting", () => {
    const d = season([week(1, { tribals: [tribal({ wentHome: "A", departure: "quit", advantagesHeld: 1 })] })]);
    expect(total(d)).toBe(2 - 5 - 5);
  });
  it("medevac: no penalties", () => {
    const d = season([week(1, { tribals: [tribal({ wentHome: "A", departure: "medevac", advantagesHeld: 1 })] })]);
    expect(total(d)).toBe(2);
  });
});

describe("got votes but stayed", () => {
  it("+5 per castaway on the team who got votes and stayed", () => {
    const d = season([week(1, { tribals: [tribal({ wentHome: "D", votes: { D: 4, A: 2, B: 1 } })] })]);
    expect(total(d)).toBe(3 + 5 + 5);
  });
});

describe("weekly pick", () => {
  const t = tribal({ wentHome: "D", votes: { D: 5, E: 3, F: 1, A: 2 }, immune: [] });
  it("+10 when the pick is voted out", () => {
    const d = season([week(1, { tribals: [t] })], { picks: [{ playerId: "p1", week: 1, castawayId: "D" }] });
    expect(lines(d).find((l) => l.rule === "weekly-pick")?.points).toBe(10);
  });
  it("+5 when the pick got the second-most votes", () => {
    const d = season([week(1, { tribals: [t] })], { picks: [{ playerId: "p1", week: 1, castawayId: "E" }] });
    expect(lines(d).find((l) => l.rule === "weekly-pick")?.points).toBe(5);
  });
  it("votes against an immune castaway don't count for second-most", () => {
    const ti = tribal({ wentHome: "D", votes: { D: 5, E: 3, F: 2 }, immune: ["E"] });
    expect(secondMostVoted(ti)).toEqual(["F"]);
  });
  it("no pick points when the castaway quit or was medevaced", () => {
    const d = season([week(1, { tribals: [tribal({ wentHome: "D", departure: "medevac" })] })], {
      picks: [{ playerId: "p1", week: 1, castawayId: "D" }],
    });
    expect(lines(d).find((l) => l.rule === "weekly-pick")).toBeUndefined();
  });
  it("double tribal: two picks, each scored", () => {
    const d = season(
      [week(1, { tribals: [tribal({ wentHome: "D", votes: { D: 5 } }), tribal({ wentHome: "E", votes: { E: 4, F: 2 } })] })],
      { picks: [{ playerId: "p1", week: 1, castawayId: "D" }, { playerId: "p1", week: 1, castawayId: "F" }] },
    );
    expect(lines(d).filter((l) => l.rule === "weekly-pick").map((l) => l.points)).toEqual([10, 5]);
  });
});

describe("swap", () => {
  it("new castaway scores from week 5, in the dropped slot", () => {
    const d = season(
      [week(4, { immunity: [{ castawayId: "E", place: 1 }] }), week(5, { immunity: [{ castawayId: "E", place: 1 }] })],
      { players: [{ id: "p1", name: "Pat", team: ["A", "B", "C"], swap: { drop: "B", add: "E" } }] },
    );
    expect(total(d, 4)).toBe(12);
    expect(total(d, 5)).toBe(15 + 10);
  });
});

describe("finale", () => {
  it("placements 30/20/10 and fire-making +10 (Rio's Season 50 finale = 70)", () => {
    const d = season([week(9, { immunity: [{ castawayId: "A", place: 1 }], fireWinner: "B" }, true)]);
    d.castaways.find((c) => c.id === "A")!.placement = 1;
    d.castaways.find((c) => c.id === "B")!.placement = 2;
    expect(total(d, 9)).toBe(30 + 20 + 10 + 10);
  });
});

describe("Rio, Season 50 week 4", () => {
  it("scores 27 under last season's rules (sheet said 32)", () => {
    // Rio: Rick, Cirie, Aubry. Rick found an advantage, Stephenie played one and went home.
    const d = season([
      week(4, {
        advantagesFound: [{ castawayId: "A" }],
        advantagesPlayed: [{ castawayId: "D" }],
        tribals: [tribal({ wentHome: "D", votes: { D: 5 } })],
      }),
    ], { picks: [{ playerId: "p1", week: 4, castawayId: "D" }] });
    expect(total(d, 4)).toBe(12 + 5 + 10);
  });
});

describe("tiebreaker", () => {
  it("ties broken by who ranked the winner higher", () => {
    const d = season([week(9, {}, true)], {
      players: [
        { id: "p1", name: "Pat", team: ["B", "A", "C"], swap: null },
        { id: "p2", name: "Rio", team: ["A", "B", "C"], swap: null },
      ],
    });
    d.castaways.find((c) => c.id === "A")!.placement = 1;
    d.castaways.find((c) => c.id === "B")!.placement = 2;
    const s = scoreSeason(d);
    expect(s[0].total).toBe(s[1].total);
    expect(s.map((x) => [x.name, x.rank])).toEqual([["Rio", 1], ["Pat", 2]]);
  });
  it("identical order stays a tie", () => {
    const d = season([week(9, {}, true)], {
      players: [
        { id: "p1", name: "Pat", team: ["A", "B", "C"], swap: null },
        { id: "p2", name: "Rio", team: ["A", "B", "C"], swap: null },
      ],
    });
    d.castaways.find((c) => c.id === "A")!.placement = 1;
    expect(scoreSeason(d).map((x) => x.rank)).toEqual([1, 1]);
  });
});
