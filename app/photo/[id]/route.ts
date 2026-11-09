import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db();
  const r = await s<{ mime: string; data: Buffer }[]>`select mime, data from castaway_photos where castaway_id = ${id}`;
  if (!r.length) return new Response("Not found", { status: 404 });
  // URLs carry ?v=<timestamp>, so a new upload gets a new URL and this can cache for long
  return new Response(new Uint8Array(r[0].data), {
    headers: { "Content-Type": r[0].mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
