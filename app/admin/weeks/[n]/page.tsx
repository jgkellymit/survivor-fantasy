import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState } from "@/lib/game";
import { scoreSeason } from "@/lib/scoring";
import { toPTInput } from "@/lib/time";
import { clearResults, deleteWeek, saveResults, saveWeek } from "../../actions";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function WeekAdmin({ params, searchParams }: { params: Promise<{ n: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const n = Number((await params).n);
  const sp = await searchParams;
  const a = await loadAll();
  const w = a.weeks.find((x) => x.number === n);
  if (!w) notFound();
  const g = gameState(a);
  const r = w.results;
  // castaways in the game at the start of this week
  const active = a.castaways.filter((c) => g.inForWeek(c.id, n));
  const cnt = (list: { castawayId: string; counts?: boolean }[] | undefined, id: string, counts?: boolean) =>
    (list ?? []).filter((x) => x.castawayId === id && (counts === undefined || (x.counts !== false) === counts)).length || "";
  const tribals = Array.from({ length: w.tribal_count }, (_, t) => r?.tribals[t]);
  const scores = scoreSeason(toSeasonData(a));
  const back = `/admin/weeks/${n}`;

  return (
    <>
      <h1>{w.is_finale ? `Week ${n}: finale` : `Week ${n}`} results</h1>
      <AdminNav ok={sp.ok} err={sp.err} />

      <form action={saveResults} className="card">
        <input type="hidden" name="week" value={n} />
        <p className="small muted">Fill in what happened. Leave anything that didn't happen blank. You can come back and fix it any time; scores recalculate.</p>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Castaway</th>
                <th>Immunity</th>
                <th className="num" title="Advantages found (post-merge only)">Found</th>
                <th className="num" title="Advantages/idols played that count">Played</th>
                <th className="num" title="Plays that were disallowed or forced">Played, no pts</th>
                {tribals.map((_, t) => (
                  <th key={t} className="num">{w.tribal_count > 1 ? `T${t + 1} ` : ""}Votes</th>
                ))}
                {tribals.map((_, t) => (
                  <th key={`i${t}`}>{w.tribal_count > 1 ? `T${t + 1} ` : ""}Immune</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.map((c) => {
                const imm = r?.immunity.find((x) => x.castawayId === c.id)?.place ?? "";
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>
                      <select name={`imm_${c.id}`} defaultValue={String(imm)} aria-label={`${c.name} immunity`}>
                        <option value="">–</option><option value="1">Won</option><option value="2">2nd</option>
                      </select>
                    </td>
                    <td className="num"><input type="number" min={0} name={`found_${c.id}`} defaultValue={cnt(r?.advantagesFound, c.id)} aria-label={`${c.name} found`} /></td>
                    <td className="num"><input type="number" min={0} name={`played_${c.id}`} defaultValue={cnt(r?.advantagesPlayed, c.id, true)} aria-label={`${c.name} played`} /></td>
                    <td className="num"><input type="number" min={0} name={`nocount_${c.id}`} defaultValue={cnt(r?.advantagesPlayed, c.id, false)} aria-label={`${c.name} played no points`} /></td>
                    {tribals.map((t, i) => (
                      <td key={i} className="num"><input type="number" min={0} name={`votes_${i}_${c.id}`} defaultValue={t?.votes[c.id] ?? ""} aria-label={`${c.name} votes tribal ${i + 1}`} /></td>
                    ))}
                    {tribals.map((t, i) => (
                      <td key={`i${i}`}><input type="checkbox" name={`immune_${i}_${c.id}`} defaultChecked={t ? t.immune.includes(c.id) : false} aria-label={`${c.name} immune tribal ${i + 1}`} /></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small muted">“Immune” means wearing immunity at tribal (usually the winner). Votes against them don't count for second-most.</p>

        {tribals.map((t, i) => (
          <div key={i} className="row" style={{ marginTop: 12 }}>
            <strong>{w.tribal_count > 1 ? `Tribal ${i + 1}:` : "Tribal:"}</strong>
            <label>Went home{" "}
              <select name={`home_${i}`} defaultValue={t?.wentHome ?? ""}>
                <option value="">No one</option>
                {active.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>How{" "}
              <select name={`dep_${i}`} defaultValue={t?.departure ?? "vote"}>
                <option value="vote">Voted out</option><option value="quit">Quit</option><option value="medevac">Medevac</option>
              </select>
            </label>
            <label>Advantages they left holding <input type="number" min={0} name={`held_${i}`} defaultValue={t?.advantagesHeld || ""} /></label>
          </div>
        ))}

        {w.is_finale && (
          <div className="row" style={{ marginTop: 16 }}>
            <label>Fire-making winner{" "}
              <select name="fire" defaultValue={r?.fireWinner ?? ""}>
                <option value="">–</option>
                {active.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {[1, 2, 3].map((p) => (
              <label key={p}>{p === 1 ? "Winner" : p === 2 ? "2nd" : "3rd"}{" "}
                <select name={`place_${p}`} defaultValue={a.castaways.find((c) => c.placement === p)?.id ?? ""}>
                  <option value="">–</option>
                  {active.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16 }}><button type="submit">Save results</button></div>
      </form>

      {r && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Week {n} scores (check these)</h2>
          <table>
            <tbody>
              {scores.map((s) => {
                const pw = s.weeks.find((x) => x.week === n);
                return (
                  <tr key={s.playerId}>
                    <td>{s.name}</td>
                    <td className="num"><strong>{pw?.total ?? 0}</strong></td>
                    <td className="small muted" style={{ whiteSpace: "normal" }}>{pw?.lines.map((l) => `${l.points > 0 ? "+" : ""}${l.points} ${l.reason}`).join(" · ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Week settings</h2>
        <form action={saveWeek} className="row">
          <input type="hidden" name="number" value={n} />
          <input type="hidden" name="back" value={back} />
          <label>Deadline (Pacific) <input type="datetime-local" name="deadline" defaultValue={toPTInput(w.deadline)} required /></label>
          <label>Tribals <select name="tribal_count" defaultValue={String(w.tribal_count)}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>
          <label><input type="checkbox" name="is_finale" defaultChecked={w.is_finale} /> Finale</label>
          <button className="secondary" type="submit">Save settings</button>
        </form>
        <div className="row" style={{ marginTop: 12 }}>
          {r && <form action={clearResults}><input type="hidden" name="week" value={n} /><button className="secondary" type="submit">Clear results</button></form>}
          <form action={deleteWeek}><input type="hidden" name="number" value={n} /><button className="danger" type="submit">Delete week</button></form>
          <Link href={`/week/${n}`}>Public page →</Link>
        </div>
      </section>
    </>
  );
}
