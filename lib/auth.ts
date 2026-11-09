import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, type PlayerRow } from "./db";

export const PLAYER_COOKIE = "sf_player";
export const ADMIN_COOKIE = "sf_admin";
const YEAR = 60 * 60 * 24 * 365;

function adminSecret(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}
export function adminCookieValue(): string | null {
  const p = adminSecret();
  return p ? createHmac("sha256", p).update("survivor-admin-v1").digest("hex") : null;
}
export function checkAdminPassword(input: string): boolean {
  const p = adminSecret();
  if (!p) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(p);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  const want = adminCookieValue();
  return !!v && !!want && v === want;
}
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function currentPlayer(): Promise<PlayerRow | null> {
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  if (!token) return null;
  const s = await db();
  const r = await s<PlayerRow[]>`select * from players where token = ${token}`;
  return r[0] ?? null;
}

export async function setPlayerCookie(token: string) {
  (await cookies()).set(PLAYER_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
}
export async function setAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, adminCookieValue()!, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
}
