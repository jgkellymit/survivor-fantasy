import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PLAYER_COOKIE } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await db();
  const r = await s`select id from players where token = ${token}`;
  const res = NextResponse.redirect(new URL(r.length ? "/me" : "/me?err=" + encodeURIComponent("That sign-in link isn't valid. Ask Jack for yours."), req.url));
  if (r.length) res.cookies.set(PLAYER_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return res;
}
