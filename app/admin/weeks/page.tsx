import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadAll } from "@/lib/db";
import { formatDeadline, nextWednesdayMidnight, toPTInput } from "@/lib/time";
import { saveWeek } from "../actions";
import { weekLabel } from "@/lib/game";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function Weeks({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const a = await loadAll();
  const last = a.weeks[a.weeks.length - 1];
  const nextNum = (last?.number ?? 0) + 1;
  const nextDeadline = nextWednesdayMidnight(last ? last.deadline : new Date());
  const nextEpisode = last?.episode ? last.episode + 1 : undefined;
  return (
    <>
      <h1>Weeks &amp; results</h1>
      <AdminNav ok={sp.ok} err={sp.err} />
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Weeks</h2>
        {a.weeks.length === 0 && <p className="muted">No weeks yet. Add Week 1 below: its deadline is also when teams lock.</p>}
        <table>
          <tbody>
            {a.weeks.map((w) => (
              <tr key={w.number}>
                <td><strong>{weekLabel(w)}</strong>{w.tribal_count > 1 && <span className="tag"> {w.tribal_count} tribals</span>}</td>
                <td className="small">{formatDeadline(w.deadline)}</td>
                <td>{w.results ? <span className="tag">scored</span> : <span className="tag late">needs results</span>}</td>
                <td><Link href={`/admin/weeks/${w.number}`}>{w.results ? "Edit results" : "Enter results"}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add a week</h2>
        <form action={saveWeek}>
          <div className="row">
            <div className="field"><label>Week #</label><input type="number" name="number" defaultValue={nextNum} min={1} required /></div>
            <div className="field"><label>Episode #</label><input type="number" name="episode" defaultValue={nextEpisode} min={1} placeholder="e.g. 8" /></div>
            <div className="field"><label>Pick deadline (Pacific)</label><input type="datetime-local" name="deadline" defaultValue={toPTInput(nextDeadline)} required /></div>
            <div className="field"><label>Tribals</label><select name="tribal_count" defaultValue="1"><option value="1">1</option><option value="2">2 (double)</option><option value="3">3</option></select></div>
            <div className="field"><label><input type="checkbox" name="is_finale" /> Finale</label></div>
          </div>
          <button type="submit">Add week</button>
        </form>
        <p className="small muted">Default deadline is midnight Wednesday PT (00:00 Thursday). A double tribal adds a second pick for players.</p>
      </section>
    </>
  );
}
