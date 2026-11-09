"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentPlayer, setPlayerCookie } from "@/lib/auth";
import { db, getSetting, loadAll, newId } from "@/lib/db";
import { gameState, teamOf } from "@/lib/game";

function back(msg: string, kind: "ok" | "err" = "err"): never {
  redirect(`/me?${kind}=${encodeURIComponent(msg)}`);
}

export async function joinLeague(form: FormData) {
  const code = String(form.get("code") ?? "");
  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ");
  const want = await getSetting("join_code");
  if (!want || code !== want) redirect(`/join/${encodeURIComponent(code)}?err=bad`);
  if (name.length < 1 || name.length > 40) redirect(`/join/${code}?err=name`);
  const s = await db();
  const existing = await s`select id from players where lower(name) = lower(${name})`;
  if (existing.length) redirect(`/join/${code}?err=taken&name=${encodeURIComponent(name)}`);
  const token = newId(24);
  await s`insert into players (id, name, token) values (${newId()}, ${name}, ${token})`;
  await setPlayerCookie(token);
  redirect("/me?welcome=1");
}

export async function saveTeam(form: FormData) {
  const me = await currentPlayer();
  if (!me) redirect("/me");
  const a = await loadAll();
  const g = gameState(a);
  if (g.teamsLocked) back("Teams are locked. Ask Jack if something needs fixing.");
  const picks = [form.get("c1"), form.get("c2"), form.get("c3")].map((x) => String(x ?? ""));
  if (picks.some((p) => !a.castaways.find((c) => c.id === p))) back("Pick three castaways.");
  if (new Set(picks).size !== 3) back("Pick three different castaways.");
  const s = await db();
  await s.begin(async (tx) => {
    await tx`delete from team_picks where player_id = ${me.id}`;
    for (let i = 0; i < 3; i++) await tx`insert into team_picks (player_id, slot, castaway_id) values (${me.id}, ${i + 1}, ${picks[i]})`;
  });
  revalidatePath("/");
  back("Team saved.", "ok");
}

export async function saveSwap(form: FormData) {
  const me = await currentPlayer();
  if (!me) redirect("/me");
  const a = await loadAll();
  const g = gameState(a);
  if (!g.swapOpen) back("The swap window is closed.");
  const s = await db();
  if (form.get("undo")) {
    await s`delete from swaps where player_id = ${me.id}`;
    revalidatePath("/");
    back("Swap removed.", "ok");
  }
  const drop = String(form.get("drop") ?? "");
  const add = String(form.get("add") ?? "");
  const team = teamOf(a, me.id);
  if (!team.includes(drop)) back("Choose someone from your team to drop.");
  if (team.includes(add) || !a.castaways.find((c) => c.id === add) || g.isOut(add)) back("Choose someone still in the game who isn't on your team.");
  await s`insert into swaps (player_id, drop_id, add_id) values (${me.id}, ${drop}, ${add})
          on conflict (player_id) do update set drop_id = excluded.drop_id, add_id = excluded.add_id, created_at = now()`;
  revalidatePath("/");
  back("Swap saved. Your new castaway scores from Week 5.", "ok");
}

export async function saveWeeklyPick(form: FormData) {
  const me = await currentPlayer();
  if (!me) redirect("/me");
  const a = await loadAll();
  const g = gameState(a);
  const w = g.pickWeek;
  if (!w || Number(form.get("week")) !== w.number) back("That week is already scored.");
  const s = await db();
  for (let slot = 1; slot <= w.tribal_count; slot++) {
    const c = String(form.get(`pick${slot}`) ?? "");
    if (!c) continue;
    if (!a.castaways.find((x) => x.id === c) || !g.inForWeek(c, w.number)) back("Pick someone still in the game.");
    await s`insert into weekly_picks (player_id, week, slot, castaway_id, submitted_at, entered_by_admin)
            values (${me.id}, ${w.number}, ${slot}, ${c}, now(), false)
            on conflict (player_id, week, slot) do update set castaway_id = excluded.castaway_id, submitted_at = now(), entered_by_admin = false`;
  }
  revalidatePath("/");
  back(g.now >= w.deadline ? "Pick saved, after the deadline, so it's marked late." : "Pick saved.", "ok");
}
