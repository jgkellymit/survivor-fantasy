import { requireAdmin } from "@/lib/auth";
import { loadAll } from "@/lib/db";
import { gameState } from "@/lib/game";
import { addCastaways, deleteCastaway, updateCastaway } from "../actions";
import { AdminNav } from "@/components/AdminNav";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function Cast({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const a = await loadAll();
  const g = gameState(a);
  return (
    <>
      <h1>Cast</h1>
      <AdminNav ok={sp.ok} err={sp.err} />
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add castaways</h2>
        <p className="small muted">The castaways who made the merge. One name per line.</p>
        <form action={addCastaways}>
          <textarea name="names" rows={6} style={{ width: "100%" }} placeholder={"Name one\nName two"} required />
          <div style={{ marginTop: 8 }}><button type="submit">Add</button></div>
        </form>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Castaways ({a.castaways.length})</h2>
        <p className="small muted">Photo is optional: paste an image URL. Final place is set from the finale form.</p>
        {a.castaways.map((c) => (
          <div key={c.id} className="row" style={{ borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
            <Avatar name={c.name} photo={c.photo_url} />
            <form action={updateCastaway} className="row" style={{ flex: 1 }}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="placement" value={c.placement ?? ""} />
              <input name="name" defaultValue={c.name} required aria-label="Name" />
              <input name="photo_url" defaultValue={c.photo_url ?? ""} placeholder="Photo URL" aria-label="Photo URL" />
              {g.isOut(c.id) && <span className="tag">out week {g.elim.get(c.id)}</span>}
              {c.placement && <span className="tag">#{c.placement}</span>}
              <button className="secondary" type="submit">Save</button>
            </form>
            <form action={deleteCastaway}><input type="hidden" name="id" value={c.id} /><button className="secondary" type="submit" title="Delete">✕</button></form>
          </div>
        ))}
      </section>
    </>
  );
}
