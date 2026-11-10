"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkAdminPassword, requireAdmin, setAdminCookie } from "@/lib/auth";
import { db, loadAll, newId, setSetting } from "@/lib/db";
import { fromPTInput } from "@/lib/time";
import type { Departure, WeekResults } from "@/lib/scoring";

function done(path: string, msg?: string): never {
  revalidatePath("/", "layout");
  redirect(msg ? `${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(msg)}` : path);
}

export async function adminLogin(form: FormData) {
  if (!process.env.ADMIN_PASSWORD) redirect("/admin/login?err=unset");
  if (!checkAdminPassword(String(form.get("password") ?? ""))) redirect("/admin/login?err=bad");
  await setAdminCookie();
  redirect("/admin");
}
export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/");
}

export async function newJoinCode() {
  await requireAdmin();
  await setSetting("join_code", newId(8));
  done("/admin", "New invite link made. The old one no longer works.");
}

// ---------- castaways ----------
export async function addCastaways(form: FormData) {
  await requireAdmin();
  const names = String(form.get("names") ?? "").split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  const s = await db();
  const max = (await s`select coalesce(max(sort), 0) as m from castaways`)[0].m as number;
  let i = max;
  for (const n of names) {
    const exists = await s`select 1 from castaways where lower(name) = lower(${n})`;
    if (exists.length) continue;
    await s`insert into castaways (id, name, sort) values (${newId(6)}, ${n}, ${++i})`;
  }
  done("/admin/cast", `Added ${names.length} castaway(s).`);
}
export async function updateCastaway(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const name = String(form.get("name") ?? "").trim();
  const photo = String(form.get("photo_url") ?? "").trim() || null;
  const placement = form.get("placement") ? Number(form.get("placement")) : null;
  const s = await db();
  await s`update castaways set name = ${name}, photo_url = ${photo}, placement = ${placement} where id = ${id}`;
  done("/admin/cast", `Saved ${name}.`);
}
export async function deleteCastaway(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const s = await db();
  const used = await s`select 1 from team_picks where castaway_id = ${id} union all select 1 from weekly_picks where castaway_id = ${id} union all select 1 from swaps where drop_id = ${id} or add_id = ${id}`;
  if (used.length) redirect("/admin/cast?err=" + encodeURIComponent("That castaway is on someone's team or in a pick, so it can't be deleted."));
  await s`delete from castaways where id = ${id}`;
  done("/admin/cast", "Deleted.");
}

// ---------- weeks ----------
export async function saveWeek(form: FormData) {
  await requireAdmin();
  const number = Number(form.get("number"));
  const deadline = fromPTInput(String(form.get("deadline")));
  const tribals = Math.max(1, Math.min(3, Number(form.get("tribal_count") ?? 1)));
  const finale = form.get("is_finale") === "on";
  const episode = form.get("episode") ? Number(form.get("episode")) || null : null;
  if (!Number.isInteger(number) || number < 1) redirect("/admin/weeks?err=" + encodeURIComponent("Week number must be 1 or more."));
  const s = await db();
  await s`insert into weeks (number, deadline, tribal_count, is_finale, episode) values (${number}, ${deadline}, ${tribals}, ${finale}, ${episode})
          on conflict (number) do update set deadline = excluded.deadline, tribal_count = excluded.tribal_count, is_finale = excluded.is_finale, episode = excluded.episode`;
  done(form.get("back") ? String(form.get("back")) : "/admin/weeks", `Week ${number} saved.`);
}
export async function deleteWeek(form: FormData) {
  await requireAdmin();
  const s = await db();
  await s`delete from weeks where number = ${Number(form.get("number"))}`;
  done("/admin/weeks", "Week deleted.");
}

export async function saveResults(form: FormData) {
  await requireAdmin();
  const number = Number(form.get("week"));
  const a = await loadAll();
  const w = a.weeks.find((x) => x.number === number);
  if (!w) redirect("/admin/weeks");
  const ids = a.castaways.map((c) => c.id);
  const num = (k: string) => Math.max(0, Math.floor(Number(form.get(k) ?? 0) || 0));
  const r: WeekResults = { immunity: [], advantagesFound: [], advantagesPlayed: [], tribals: [] };
  for (const id of ids) {
    const imm = String(form.get(`imm_${id}`) ?? "");
    if (imm === "1" || imm === "2") r.immunity.push({ castawayId: id, place: Number(imm) as 1 | 2 });
    for (let i = 0; i < num(`found_${id}`); i++) r.advantagesFound.push({ castawayId: id });
    for (let i = 0; i < num(`played_${id}`); i++) r.advantagesPlayed.push({ castawayId: id, counts: true });
    for (let i = 0; i < num(`nocount_${id}`); i++) r.advantagesPlayed.push({ castawayId: id, counts: false });
  }
  for (let t = 0; t < w.tribal_count; t++) {
    const votes: Record<string, number> = {};
    const immune: string[] = [];
    for (const id of ids) {
      const v = num(`votes_${t}_${id}`);
      if (v > 0) votes[id] = v;
      if (form.get(`immune_${t}_${id}`) === "on") immune.push(id);
    }
    const wentHome = String(form.get(`home_${t}`) ?? "") || null;
    const dep = String(form.get(`dep_${t}`) ?? "vote") as Departure;
    r.tribals.push({ votes, immune, wentHome, departure: ["vote", "quit", "medevac"].includes(dep) ? dep : "vote", advantagesHeld: num(`held_${t}`) });
  }
  if (w.is_finale) {
    r.fireWinner = String(form.get("fire") ?? "") || null;
    const s0 = await db();
    await s0`update castaways set placement = null where placement is not null`;
    for (const p of [1, 2, 3]) {
      const c = String(form.get(`place_${p}`) ?? "");
      if (c) await s0`update castaways set placement = ${p} where id = ${c}`;
    }
  }
  const s = await db();
  await s`update weeks set results = ${s.json(r as never)} where number = ${number}`;
  done(`/admin/weeks/${number}`, "Results saved. Scores are updated.");
}
export async function clearResults(form: FormData) {
  await requireAdmin();
  const s = await db();
  await s`update weeks set results = null where number = ${Number(form.get("week"))}`;
  done(`/admin/weeks/${form.get("week")}`, "Results cleared.");
}

// ---------- players ----------
export async function addPlayer(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (!name) redirect("/admin");
  const s = await db();
  await s`insert into players (id, name, token) values (${newId()}, ${name}, ${newId(24)})`;
  done("/admin", `Added ${name}.`);
}
export async function renamePlayer(form: FormData) {
  await requireAdmin();
  const s = await db();
  await s`update players set name = ${String(form.get("name")).trim()} where id = ${String(form.get("id"))}`;
  done(`/admin/players/${form.get("id")}`, "Renamed.");
}
export async function deletePlayer(form: FormData) {
  await requireAdmin();
  const s = await db();
  await s`delete from players where id = ${String(form.get("id"))}`;
  done("/admin", "Player removed.");
}
export async function resetPlayerLink(form: FormData) {
  await requireAdmin();
  const s = await db();
  await s`update players set token = ${newId(24)} where id = ${String(form.get("id"))}`;
  done(`/admin/players/${form.get("id")}`, "New sign-in link made. The old one stops working.");
}
export async function adminSetTeam(form: FormData) {
  await requireAdmin();
  const pid = String(form.get("id"));
  const picks = [1, 2, 3].map((n) => String(form.get(`c${n}`) ?? "")).filter(Boolean);
  if (picks.length !== 3 || new Set(picks).size !== 3) redirect(`/admin/players/${pid}?err=` + encodeURIComponent("Pick three different castaways."));
  const s = await db();
  await s.begin(async (tx) => {
    await tx`delete from team_picks where player_id = ${pid}`;
    for (let i = 0; i < 3; i++) await tx`insert into team_picks (player_id, slot, castaway_id) values (${pid}, ${i + 1}, ${picks[i]})`;
  });
  done(`/admin/players/${pid}`, "Team saved.");
}
export async function adminSetSwap(form: FormData) {
  await requireAdmin();
  const pid = String(form.get("id"));
  const drop = String(form.get("drop") ?? "");
  const add = String(form.get("add") ?? "");
  const s = await db();
  if (!drop || !add) await s`delete from swaps where player_id = ${pid}`;
  else await s`insert into swaps (player_id, drop_id, add_id) values (${pid}, ${drop}, ${add}) on conflict (player_id) do update set drop_id = excluded.drop_id, add_id = excluded.add_id`;
  done(`/admin/players/${pid}`, "Swap saved.");
}
export async function adminSetPick(form: FormData) {
  await requireAdmin();
  const pid = String(form.get("id"));
  const week = Number(form.get("week"));
  const slot = Number(form.get("slot") ?? 1);
  const c = String(form.get("castaway") ?? "");
  const s = await db();
  if (!c) await s`delete from weekly_picks where player_id = ${pid} and week = ${week} and slot = ${slot}`;
  else
    await s`insert into weekly_picks (player_id, week, slot, castaway_id, submitted_at, entered_by_admin) values (${pid}, ${week}, ${slot}, ${c}, now(), true)
            on conflict (player_id, week, slot) do update set castaway_id = excluded.castaway_id, entered_by_admin = true`;
  done(String(form.get("back") ?? `/admin/players/${pid}`), "Pick saved.");
}

export async function uploadPhoto(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const dataUrl = String(form.get("data") ?? "");
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) redirect("/admin/cast?err=" + encodeURIComponent("Choose an image first."));
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > 900_000) redirect("/admin/cast?err=" + encodeURIComponent("That image is too large."));
  const s = await db();
  await s`insert into castaway_photos (castaway_id, mime, data) values (${id}, ${m[1]}, ${bytes})
          on conflict (castaway_id) do update set mime = excluded.mime, data = excluded.data, updated_at = now()`;
  await s`update castaways set photo_url = ${`/photo/${id}?v=${Date.now()}`} where id = ${id}`;
  done("/admin/cast", "Photo saved.");
}
