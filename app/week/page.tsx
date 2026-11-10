import { redirect } from "next/navigation";
import { loadAll } from "@/lib/db";
import { gameState } from "@/lib/game";

export const dynamic = "force-dynamic";

/** /week → the week that's in play now (or the last one). */
export default async function CurrentWeek() {
  const a = await loadAll();
  const g = gameState(a);
  const w = g.pickWeek ?? a.weeks[a.weeks.length - 1];
  if (!w) redirect("/");
  redirect(`/week/${w.number}`);
}
