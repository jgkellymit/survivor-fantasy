import type { All, WeekRow } from "./db";
import { getSetting } from "./db";
import { gameState } from "./game";

export const REVEAL_SETTING = "reveal_early";

/**
 * Who can see whose choices. You always see your own. Others' teams show once
 * teams lock (the Week 1 deadline) and others' weekly picks once that week's
 * deadline passes, unless the admin has turned on "show picks early".
 */
export async function visibility(a: All, viewerId: string | null) {
  const revealEarly = (await getSetting(REVEAL_SETTING)) === "1";
  const g = gameState(a);
  return {
    revealEarly,
    teamVisible: (playerId: string) => revealEarly || g.teamsLocked || playerId === viewerId,
    pickVisible: (playerId: string, w: WeekRow) => revealEarly || g.now >= w.deadline || playerId === viewerId,
    // A swap can change until the Week 5 deadline, so others see it only after that.
    swapVisible: (playerId: string) => revealEarly || !g.swapOpen || playerId === viewerId,
  };
}
