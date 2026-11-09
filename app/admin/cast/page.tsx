import { requireAdmin } from "@/lib/auth";
import { loadAll } from "@/lib/db";
import { gameState } from "@/lib/game";
import { addCastaways, deleteCastaway, updateCastaway, uploadPhoto } from "../actions";
import { PhotoUpload } from "@/components/PhotoUpload";
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
        <p className="small muted">Upload a headshot for each castaway: it's cropped to a square automatically. Or paste an image URL. Final place is set from the finale form.</p>
        <div className="castgrid">
          {a.castaways.map((c) => (
            <div key={c.id} className={g.isOut(c.id) ? "castcard out" : "castcard"}>
              <Avatar name={c.name} photo={c.photo_url} size="xl" />
              <form action={updateCastaway} className="castcard-form">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="placement" value={c.placement ?? ""} />
                <input name="name" defaultValue={c.name} required aria-label="Name" />
                {c.photo_url?.startsWith("/photo/") ? (
                  <input type="hidden" name="photo_url" value={c.photo_url} />
                ) : (
                  <input name="photo_url" defaultValue={c.photo_url ?? ""} placeholder="or paste a photo URL" aria-label="Photo URL" />
                )}
                <div className="row" style={{ gap: 6 }}>
                  {g.isOut(c.id) && <span className="tag">out week {g.elim.get(c.id)}</span>}
                  {c.placement && <span className="tag">#{c.placement}</span>}
                  <button className="secondary" type="submit">Save</button>
                </div>
              </form>
              <PhotoUpload castawayId={c.id} action={uploadPhoto} />
              <form action={deleteCastaway} className="castcard-del"><input type="hidden" name="id" value={c.id} /><button className="secondary" type="submit" title={`Delete ${c.name}`} aria-label={`Delete ${c.name}`}>✕</button></form>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
