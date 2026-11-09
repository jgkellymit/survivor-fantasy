import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState, teamOf } from "@/lib/game";
import { scoreSeason } from "@/lib/scoring";
import { CastawayChip } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await loadAll();
  const p = a.players.find((x) => x.id === id);
  if (!p) notFound();
  const g = gameState(a);
  const s = scoreSeason(toSeasonData(a)).find((x) => x.playerId === id)!;
  const team = teamOf(a, id);
  const sw = a.swaps.find((x) => x.player_id === id);
  const photo = (cid: string) => a.castaways.find((c) => c.id === cid)?.photo_url;

  return (
    <>
      <p className="small"><Link href="/">← Standings</Link></p>
      <h1>{p.name}</h1>
      <p className="muted">Rank {s.rank} · {s.total} points</p>
      {g.teamsLocked && (
        <div className="card">
          <div className="chips">{team.map((c) => <CastawayChip key={c} name={g.castawayName(c)} photo={photo(c)} out={g.isOut(c)} />)}</div>
          {sw && <p className="small muted" style={{ marginBottom: 0 }}>Swap: {g.castawayName(sw.drop_id)} → {g.castawayName(sw.add_id)} (from Week 5)</p>}
        </div>
      )}
      {s.weeks.length === 0 && <p className="muted">No weeks scored yet.</p>}
      {[...s.weeks].reverse().map((w) => {
        const wk = a.weeks.find((x) => x.number === w.week)!;
        const picks = a.picks.filter((x) => x.player_id === id && x.week === w.week);
        return (
          <section className="card" id={`week-${w.week}`} key={w.week} style={{ scrollMarginTop: 80 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>{wk.is_finale ? "Finale" : `Week ${w.week}`}</h2>
              <strong style={{ fontSize: "1.3rem" }}>{w.total}</strong>
            </div>
            <p className="small muted">Go-home pick: {picks.length ? picks.map((x) => g.castawayName(x.castaway_id)).join(", ") : "none"}</p>
            {w.lines.length === 0 ? <p className="muted">No points this week.</p> : (
              <ul className="lines">
                {w.lines.map((l, i) => (
                  <li key={i}>
                    <span className={`pts ${l.points < 0 ? "neg" : "pos"}`}>{l.points > 0 ? "+" : ""}{l.points}</span>
                    <span style={{ flex: 1 }}>{l.reason}</span>
                    <Link className="small" href={`/rules#${l.rule}`}>rule</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
