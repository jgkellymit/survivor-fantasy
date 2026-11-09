import Link from "next/link";
import { adminLogout } from "@/app/admin/actions";

export function AdminNav({ ok, err }: { ok?: string; err?: string }) {
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <Link className="btn secondary" href="/admin">Players &amp; picks</Link>
        <Link className="btn secondary" href="/admin/cast">Cast</Link>
        <Link className="btn secondary" href="/admin/weeks">Weeks &amp; results</Link>
        <form action={adminLogout} style={{ marginLeft: "auto" }}><button className="secondary" type="submit">Sign out</button></form>
      </div>
      {ok && <div className="notice">{ok}</div>}
      {err && <div className="notice err">{err}</div>}
    </>
  );
}
