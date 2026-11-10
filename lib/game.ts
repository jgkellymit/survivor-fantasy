import type { All, WeekRow } from "./db";
import { eliminations, SWAP_WEEK } from "./scoring";

export function gameState(a: All, now = new Date()) {
  const week1 = a.weeks.find((w) => w.number === 1);
  const swapW = a.weeks.find((w) => w.number === SWAP_WEEK);
  const teamsLocked = !!week1 && now >= week1.deadline;
  const swapClosed = !!swapW && now >= swapW.deadline;
  const pickWeek: WeekRow | null = a.weeks.find((w) => !w.results) ?? null;
  const elim = eliminations(a.weeks.map((w) => ({ number: w.number, isFinale: w.is_finale, results: w.results })));
  /** still in the game as of the start of week n */
  const inForWeek = (castawayId: string, n: number) => {
    const e = elim.get(castawayId);
    return e === undefined || e >= n;
  };
  const isOut = (castawayId: string) => elim.has(castawayId);
  const castawayName = (id: string) => a.castaways.find((c) => c.id === id)?.name ?? "?";
  const picksVisible = (w: WeekRow) => now >= w.deadline;
  return { week1, teamsLocked, swapClosed, swapOpen: teamsLocked && !swapClosed, pickWeek, elim, inForWeek, isOut, castawayName, picksVisible, now };
}

export function teamOf(a: All, playerId: string): string[] {
  return a.teams.filter((t) => t.player_id === playerId).sort((x, y) => x.slot - y.slot).map((t) => t.castaway_id);
}

/** "Week 1 (Episode 8)", or "Finale (Episode 14)" */
export function weekLabel(w: { number: number; is_finale: boolean; episode: number | null }): string {
  const base = w.is_finale ? "Finale" : `Week ${w.number}`;
  return w.episode ? `${base} (Episode ${w.episode})` : base;
}
