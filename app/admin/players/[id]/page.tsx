import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { loadAll } from "@/lib/db";
import { gameState, teamOf } from "@/lib/game";
import { formatPT } from "@/lib/time";
import { adminSetPick, adminSetSwap, adminSetTeam, deletePlayer, renamePlayer, resetPlayerLink } from "../../actions";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function PlayerAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const a = await loadAll();
  const p = a.players.find((x) => x.id === id);
  if (!p) notFound();
  const g = gameState(a);
  const team = teamOf(a, id);
  const sw = a.swaps.find((x) => x.player_id === id);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const opts = a.castaways.map((c) => <option key={c.id} value={c.id}>{c.name}</option>);

  return (
    <>
      <h1>{p.name}</h1>
      <AdminNav ok={sp.ok} err={sp.err} />
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Sign-in link</h2>
        <p className="small muted">Text this to {p.name} if they need to sign in on a new device.</p>
        <p><code className="link">{origin}/login/{p.token}</code></p>
        <div className="row">
          <form action={resetPlayerLink}><input type="hidden" name="id" value={id} /><button className="secondary" type="submit">Make a new link</button></form>
          <form action={renamePlayer} className="row"><input type="hidden" name="id" value={id} /><input name="name" defaultValue={p.name} aria-label="Name" /><button className="secondary" type="submit">Rename</button></form>
        </div>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Team</h2>
        <form action={adminSetTeam}>
          <input type="hidden" name="id" value={id} />
          {[1, 2, 3].map((n) => (
            <div className="slot" key={n}><span className="n">{n}</span>
              <select name={`c${n}`} defaultValue={team[n - 1] ?? ""}><option value="">–</option>{opts}</select>
            </div>
          ))}
          <button type="submit">Save team</button>
        </form>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Swap</h2>
        <form action={adminSetSwap} className="row">
          <input type="hidden" name="id" value={id} />
          <label>Drop <select name="drop" defaultValue={sw?.drop_id ?? ""}><option value="">–</option>{opts}</select></label>
          <label>Add <select name="add" defaultValue={sw?.add_id ?? ""}><option value="">–</option>{opts}</select></label>
          <button className="secondary" type="submit">Save swap</button>
        </form>
        <p className="small muted">Set both to “–” to remove the swap.</p>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Weekly picks</h2>
        {a.weeks.length === 0 && <p className="muted">No weeks yet.</p>}
        {a.weeks.map((w) =>
          Array.from({ length: w.tribal_count }, (_, i) => i + 1).map((slot) => {
            const pk = a.picks.find((x) => x.player_id === id && x.week === w.number && x.slot === slot);
            const late = pk && !pk.entered_by_admin && pk.submitted_at > w.deadline;
            return (
              <form key={`${w.number}-${slot}`} action={adminSetPick} className="row" style={{ marginBottom: 8 }}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="week" value={w.number} />
                <input type="hidden" name="slot" value={slot} />
                <strong style={{ width: 110 }}>Week {w.number}{w.tribal_count > 1 ? ` #${slot}` : ""}</strong>
                <select name="castaway" defaultValue={pk?.castaway_id ?? ""}><option value="">no pick</option>{a.castaways.filter((c) => g.inForWeek(c.id, w.number)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <button className="secondary" type="submit">Save</button>
                {pk && <span className="small muted">{pk.entered_by_admin ? "entered by admin" : `submitted ${formatPT(pk.submitted_at)}`}</span>}
                {late && <span className="tag late">late</span>}
              </form>
            );
          }),
        )}
      </section>
      <section className="card">
        <form action={deletePlayer}><input type="hidden" name="id" value={id} /><button className="danger" type="submit">Remove {p.name} from the league</button></form>
      </section>
    </>
  );
}
