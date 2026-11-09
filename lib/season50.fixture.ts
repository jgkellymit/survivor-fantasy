// Season 50, replayed from last season's spreadsheet (see JAC-30).
// Only vote *order* is known from the sheet, so vote counts are 2 (boot) and 1 (second).
import type { SeasonData, Tribal, WeekResults } from "./scoring";

const C = {
  AU: "Aubry", RD: "Rick", RZ: "Rizo", JY: "Jonathan", JH: "Joe", TE: "Tiffany", CF: "Cirie",
  OL: "Ozzy", CH: "Chrissy", CU: "Christian", SL: "Stephenie", DV: "Dee", CW: "Coach", EF: "Emily",
} as const;
type K = keyof typeof C;

const t = (home: K, second?: K, extra: Partial<Tribal> = {}): Tribal => ({
  votes: { [home]: 2, ...(second ? { [second]: 1 } : {}) }, immune: [], wentHome: home, departure: "vote", advantagesHeld: 0, ...extra,
});
const r = (p: Partial<WeekResults>): WeekResults => ({ immunity: [], advantagesFound: [], advantagesPlayed: [], tribals: [], ...p });
const imm = (win: K, second?: K) => [{ castawayId: win, place: 1 as const }, ...(second ? [{ castawayId: second, place: 2 as const }] : [])];

const players: [string, K[], K | null, K | null][] = [
  // name, team, swap drop, swap add
  ["Jack", ["RZ", "CF", "JH"], null, null],
  ["Michelle", ["DV", "SL", "CF"], "DV", "TE"],
  ["Cowboy", ["OL", "DV", "SL"], "DV", "RZ"],
  ["Salome", ["RZ", "CU", "OL"], "CU", "CF"],
  ["Rio", ["RD", "CF", "AU"], "RD", "JY"],
  ["Fran", ["CF", "CU", "DV"], "DV", "OL"],
  ["Cole", ["SL", "RZ", "CU"], "SL", "TE"],
  ["Syd", ["DV", "CU", "OL"], "DV", "RZ"],
  ["Liv", ["DV", "OL", "CF"], "DV", "TE"],
  ["Nick", ["OL", "DV", "CU"], "DV", "TE"],
  ["Calder", ["DV", "CU", "SL"], "DV", "RZ"],
  ["Mel", ["DV", "CF", "CU"], "CU", "OL"],
  ["Pat", ["CF", "OL", "JH"], "OL", "AU"],
  ["Anna", ["DV", "SL", "CU"], "DV", "CF"],
];

// weekly picks, in the same player order. Week 7 wasn't recorded: filled in from the
// scores (the six players who scored +10 must have picked Cirie).
const picks: Record<number, (K | K[] | null)[]> = {
  1: ["CW", "CW", "CU", "JY", "RZ", "EF", "CH", "JH", "JH", "JH", "JH", "JH", "EF", "CW"],
  2: ["CW", "CW", "CW", "CW", "CW", "CW", "CW", "TE", "CW", "CW", "CH", "CW", "EF", "CW"],
  3: ["RD", "EF", "RD", "RD", "EF", "CU", "EF", "JH", "JH", "JH", "RD", "RD", "RD", "EF"],
  4: ["EF", "EF", "EF", "RD", "SL", "JY", "EF", "RD", "EF", "RD", "RD", "RD", "SL", "EF"],
  5: [["EF", "AU"], ["JY", "EF"], null, null, ["EF", "RD"], ["OL", "RD"], ["JY", "AU"], ["EF", "JY"], ["EF", "AU"], ["EF", "RD"], ["TE", "EF"], ["JY"], ["EF", "JY"], ["EF", "JY"]],
  6: ["RD", "RD", "JY", "JY", "CF", "CF", "CF", "CF", "CF", "CF", null, null, "RD", "JY"],
  7: [null, null, null, null, "CF", "CF", "CF", "CF", "CF", "CF", null, null, null, null],
  8: ["TE", "AU", "TE", "TE", "TE", "TE", "JY", "TE", "TE", "RZ", null, null, "TE", "AU"],
};

export const season50: SeasonData = {
  gotVotesBonus: false,
  castaways: (Object.keys(C) as K[]).map((id) => ({
    id, name: C[id], placement: id === "AU" ? 1 : id === "JY" ? 2 : id === "JH" ? 3 : null,
  })),
  players: players.map(([name, team, drop, add]) => ({ id: name, name, team, swap: drop && add ? { drop, add } : null })),
  weeks: [
    { number: 1, isFinale: false, results: r({ immunity: imm("OL", "JH"), advantagesPlayed: [{ castawayId: "AU" }], tribals: [t("DV", "TE")] }) },
    { number: 2, isFinale: false, results: r({ immunity: imm("JH", "TE"), tribals: [t("CW"), t("CH")] }) },
    { number: 3, isFinale: false, results: r({ immunity: imm("JH", "OL"), tribals: [t("CU", "RD")] }) },
    { number: 4, isFinale: false, results: r({ immunity: imm("TE", "OL"), advantagesFound: [{ castawayId: "RD" }], advantagesPlayed: [{ castawayId: "SL" }], tribals: [t("SL", "AU")] }) },
    {
      number: 5, isFinale: false,
      results: r({
        immunity: [{ castawayId: "JY", place: 1 }, { castawayId: "EF", place: 1 }],
        advantagesPlayed: [{ castawayId: "RD" }, { castawayId: "CF" }],
        tribals: [t("EF", "CF"), t("OL", "AU", { advantagesHeld: 1 })],
      }),
    },
    { number: 6, isFinale: false, results: r({ immunity: imm("JH"), tribals: [t("RD")] }) },
    { number: 7, isFinale: false, results: r({ immunity: imm("TE"), tribals: [t("CF")] }) },
    { number: 8, isFinale: false, results: r({ immunity: imm("JY"), advantagesPlayed: [{ castawayId: "RZ" }], tribals: [t("TE", "AU")] }) },
    { number: 9, isFinale: true, results: r({ immunity: imm("AU", "JH"), tribals: [t("RZ")], fireWinner: "JY" }) },
  ],
  picks: Object.entries(picks).flatMap(([w, row]) =>
    row.flatMap((pk, i) => (pk === null ? [] : (Array.isArray(pk) ? pk : [pk]).map((c) => ({ playerId: players[i][0], week: Number(w), castawayId: c })))),
  ),
};

/** Weekly scores from the sheet, weeks 1–8, in player order. */
export const sheetScores: Record<number, number[]> = {
  1: [8, 2, 12, 13, 8, 2, 3, 12, 12, 12, 2, 2, 18, 2],
  2: [26, 14, 14, 16, 16, 14, 14, 4, 14, 14, 14, 14, 16, 14],
  3: [24, 6, 16, 16, 9, 13, 6, 8, 11, 8, 8, 8, 29, 3],
  4: [12, 9, 14, 13, 32, 4, 9, 9, 13, 9, 5, 4, 27, 5],
  5: [35, 25, 0, 10, 40, 15, 15, 10, 25, 10, 15, 5, 30, 20],
  6: [38, 22, 6, 12, 18, 6, 12, 6, 12, 6, 6, 6, 38, 6],
  7: [14, 17, 7, 7, 24, 10, 34, 17, 27, 27, 7, 0, 14, 0],
  8: [31, 5, 23, 23, 36, 10, 13, 23, 10, 0, 13, 0, 26, 5],
};
export const playerOrder = players.map((p) => p[0]);
