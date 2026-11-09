// Pure scoring engine. Season data in, per-player per-week scores out.
// Every point carries a reason so the site can show a breakdown.
// Scores are never stored: they are recomputed from the entered events.

export type Departure = "vote" | "quit" | "medevac";

export interface Tribal {
  /** votes cast against each castaway (castawayId -> count) */
  votes: Record<string, number>;
  /** castaways wearing immunity at this tribal (votes against them don't count for picks) */
  immune: string[];
  /** castaway who went home at this tribal, if any */
  wentHome: string | null;
  departure: Departure;
  /** number of advantages/idols the departing castaway left holding */
  advantagesHeld: number;
}

export interface ImmunityResult {
  castawayId: string;
  /** 1 = winner (+10), 2 = runner-up (+5) */
  place: 1 | 2;
}

export interface AdvantageEvent {
  castawayId: string;
  note?: string;
  /** for plays: false when the play was disallowed or forced */
  counts?: boolean;
}

export interface WeekResults {
  immunity: ImmunityResult[];
  advantagesFound: AdvantageEvent[];
  advantagesPlayed: AdvantageEvent[];
  tribals: Tribal[];
  /** finale only */
  fireWinner?: string | null;
}

export interface Week {
  number: number;
  isFinale: boolean;
  /** null until the admin enters results */
  results: WeekResults | null;
}

export interface Castaway {
  id: string;
  name: string;
  /** final placement: 1 = sole survivor, 2 = runner-up, 3 = third */
  placement: number | null;
}

export interface Player {
  id: string;
  name: string;
  /** ordered team, favorite first (order is the tiebreaker) */
  team: string[];
  swap: { drop: string; add: string } | null;
}

export interface WeeklyPick {
  playerId: string;
  week: number;
  castawayId: string;
}

export interface SeasonData {
  castaways: Castaway[];
  players: Player[];
  weeks: Week[];
  picks: WeeklyPick[];
  /** week from which a swap takes effect */
  swapWeek?: number;
}

export interface ScoreLine {
  points: number;
  reason: string;
  /** anchor on the rules page */
  rule: string;
}

export interface PlayerWeekScore {
  week: number;
  total: number;
  lines: ScoreLine[];
}

export interface PlayerScore {
  playerId: string;
  name: string;
  total: number;
  weeks: PlayerWeekScore[];
  rank: number;
}

export const SWAP_WEEK = 5;

/** Team for a given week, after applying the swap (in the dropped castaway's slot). */
export function teamForWeek(player: Player, week: number, swapWeek = SWAP_WEEK): string[] {
  if (!player.swap || week < swapWeek) return player.team;
  return player.team.map((c) => (c === player.swap!.drop ? player.swap!.add : c));
}

/** castawayId -> week number they left the game */
export function eliminations(weeks: Week[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const w of weeks) {
    for (const t of w.results?.tribals ?? []) {
      if (t.wentHome && !out.has(t.wentHome)) out.set(t.wentHome, w.number);
    }
  }
  return out;
}

/** Castaways (other than the boot) with the most counted votes, excluding immune castaways. */
export function secondMostVoted(t: Tribal): string[] {
  const counted = Object.entries(t.votes).filter(
    ([id, n]) => n > 0 && !t.immune.includes(id) && id !== t.wentHome,
  );
  if (counted.length === 0) return [];
  const max = Math.max(...counted.map(([, n]) => n));
  return counted.filter(([, n]) => n === max).map(([id]) => id);
}

export function scoreSeason(data: SeasonData): PlayerScore[] {
  const swapWeek = data.swapWeek ?? SWAP_WEEK;
  const name = (id: string) => data.castaways.find((c) => c.id === id)?.name ?? "Unknown";
  const weeks = [...data.weeks].sort((a, b) => a.number - b.number);
  const elim = eliminations(weeks);

  const scores: PlayerScore[] = data.players.map((p) => {
    const pw: PlayerWeekScore[] = [];
    for (const w of weeks) {
      const r = w.results;
      if (!r) continue;
      const team = teamForWeek(p, w.number, swapWeek);
      const onTeam = (id: string) => team.includes(id);
      const lines: ScoreLine[] = [];

      // Survival
      if (!w.isFinale) {
        const alive = team.filter((c) => {
          const e = elim.get(c);
          return e === undefined || e > w.number;
        });
        if (alive.length > 0) {
          lines.push({
            points: w.number * alive.length,
            reason: `Survival (week ${w.number} × ${alive.length} castaway${alive.length === 1 ? "" : "s"} still in)`,
            rule: "survival",
          });
        }
      }

      // Immunity
      for (const im of r.immunity) {
        if (!onTeam(im.castawayId)) continue;
        lines.push(
          im.place === 1
            ? { points: 10, reason: `${name(im.castawayId)} won immunity`, rule: "immunity" }
            : { points: 5, reason: `${name(im.castawayId)} came second in the immunity challenge`, rule: "immunity" },
        );
      }

      // Advantages
      for (const a of r.advantagesFound) {
        if (!onTeam(a.castawayId)) continue;
        lines.push({ points: 5, reason: `${name(a.castawayId)} found an advantage${a.note ? ` (${a.note})` : ""}`, rule: "advantages" });
      }
      for (const a of r.advantagesPlayed) {
        if (!onTeam(a.castawayId) || a.counts === false) continue;
        lines.push({ points: 5, reason: `${name(a.castawayId)} played an advantage${a.note ? ` (${a.note})` : ""}`, rule: "advantages" });
      }

      for (const t of r.tribals) {
        // Got votes but stayed
        for (const [cid, n] of Object.entries(t.votes)) {
          if (n > 0 && cid !== t.wentHome && onTeam(cid)) {
            lines.push({ points: 5, reason: `${name(cid)} got votes but stayed`, rule: "got-votes" });
          }
        }
        // Departure penalties
        if (t.wentHome && onTeam(t.wentHome)) {
          const held = t.departure === "medevac" ? 0 : t.advantagesHeld;
          if (held > 0) {
            lines.push({
              points: -5 * held,
              reason: `${name(t.wentHome)} went home holding ${held} advantage${held === 1 ? "" : "s"}`,
              rule: "advantages",
            });
          }
          if (t.departure === "quit") {
            lines.push({ points: -5, reason: `${name(t.wentHome)} quit`, rule: "quit-medevac" });
          }
        }
      }

      // Finale
      if (w.isFinale) {
        for (const c of team) {
          const pl = data.castaways.find((x) => x.id === c)?.placement;
          const pts = pl === 1 ? 30 : pl === 2 ? 20 : pl === 3 ? 10 : 0;
          if (pts) {
            const label = pl === 1 ? "won the season" : pl === 2 ? "finished second" : "finished third";
            lines.push({ points: pts, reason: `${name(c)} ${label}`, rule: "finale" });
          }
        }
        if (r.fireWinner && onTeam(r.fireWinner)) {
          lines.push({ points: 10, reason: `${name(r.fireWinner)} won fire-making`, rule: "finale" });
        }
      }

      // Weekly go-home picks
      const myPicks = data.picks.filter((pk) => pk.playerId === p.id && pk.week === w.number);
      for (const pk of myPicks) {
        const votedOut = r.tribals.some((t) => t.wentHome === pk.castawayId && t.departure === "vote");
        if (votedOut) {
          lines.push({ points: 10, reason: `Picked ${name(pk.castawayId)} to go home, and they did`, rule: "weekly-pick" });
        } else if (r.tribals.some((t) => t.departure === "vote" && secondMostVoted(t).includes(pk.castawayId))) {
          lines.push({ points: 5, reason: `Picked ${name(pk.castawayId)}, who got the second-most votes`, rule: "weekly-pick" });
        }
      }

      pw.push({ week: w.number, total: lines.reduce((s, l) => s + l.points, 0), lines });
    }
    return { playerId: p.id, name: p.name, total: pw.reduce((s, x) => s + x.total, 0), weeks: pw, rank: 0 };
  });

  return rankPlayers(scores, data);
}

/**
 * Order of castaways for the tiebreaker: placement 1, 2, 3, then everyone
 * else by how late they went home.
 */
function finishOrder(data: SeasonData): string[] {
  const elim = eliminations(data.weeks);
  return [...data.castaways]
    .sort((a, b) => {
      const pa = a.placement ?? 99;
      const pb = b.placement ?? 99;
      if (pa !== pb) return pa - pb;
      return (elim.get(b.id) ?? 999) - (elim.get(a.id) ?? 999);
    })
    .map((c) => c.id);
}

/** Negative if a wins the tiebreak, positive if b does, 0 if still tied. */
export function tiebreak(a: Player, b: Player, data: SeasonData): number {
  const lastWeek = Math.max(0, ...data.weeks.map((w) => w.number));
  const ta = teamForWeek(a, lastWeek, data.swapWeek);
  const tb = teamForWeek(b, lastWeek, data.swapWeek);
  for (const c of finishOrder(data)) {
    const ia = ta.indexOf(c);
    const ib = tb.indexOf(c);
    if (ia === -1 && ib === -1) continue;
    if (ia === ib) continue;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  }
  return 0;
}

function rankPlayers(scores: PlayerScore[], data: SeasonData): PlayerScore[] {
  const byId = new Map(data.players.map((p) => [p.id, p]));
  const seasonOver = data.castaways.some((c) => c.placement === 1);
  const cmp = (a: PlayerScore, b: PlayerScore) => {
    if (b.total !== a.total) return b.total - a.total;
    return seasonOver ? tiebreak(byId.get(a.playerId)!, byId.get(b.playerId)!, data) : 0;
  };
  const sorted = [...scores].sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name));
  sorted.forEach((s, i) => {
    s.rank = i > 0 && cmp(sorted[i - 1], s) === 0 ? sorted[i - 1].rank : i + 1;
  });
  return sorted;
}
