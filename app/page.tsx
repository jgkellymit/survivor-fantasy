import Link from "next/link";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState, teamOf } from "@/lib/game";
import { scoreSeason } from "@/lib/scoring";
import { formatDeadline } from "@/lib/time";
import { CastawayChip } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const a = await loadAll();
  const g = gameState(a);
  const scores = scoreSeason(toSeasonData(a));
  const scored = a.weeks.filter((w) => w.results);
  const photo = (id: string) => a.castaways.find((c) => c.id === id)?.photo_url;
  const swapOf = (pid: string) => a.swaps.find((s) => s.player_id === pid);

  return (
    <>
      {g.pickWeek && (
        <div className="notice">
          <strong>Week {g.pickWeek.number}</strong>: {g.now < g.pickWeek.deadline ? <>picks due {formatDeadline(g.pickWeek.deadline)}.</> : <>deadline passed, waiting for results.</>}{" "}
          {!g.teamsLocked && <>Teams can still be changed until then. </>}
          <Link href="/me">Make your picks →</Link>
        </div>
      )}
      <h1>Standings</h1>
      {a.players.length === 0 ? (
        <div className="card">No one has joined yet.</div>
      ) : (
        <div className="card scroll" style={{ padding: 0 }}>
          <table className="grid">
            <thead>
              <tr>
                <th className="sticky-col">Player</th>
                {scored.map((w) => <th key={w.number} className="num"><Link href={`/week/${w.number}`}>{w.is_finale ? "Fin" : `W${w.number}`}</Link></th>)}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.playerId}>
                  <td className="sticky-col"><span className="rank">{s.rank}</span> <Link href={`/player/${s.playerId}`}>{s.name}</Link></td>
                  {scored.map((w) => {
                    const pw = s.weeks.find((x) => x.week === w.number);
                    return <td key={w.number} className="num"><Link href={`/player/${s.playerId}#week-${w.number}`} title="See breakdown">{pw?.total ?? 0}</Link></td>;
                  })}
                  <td className="num total">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {scored.length > 0 && <p className="small muted">Tap any weekly score to see how it was calculated.</p>}

      <h2>Teams</h2>
      {!g.teamsLocked && <p className="muted small">Teams are revealed when they lock{g.week1 ? ` at ${formatDeadline(g.week1.deadline)}` : ""}.</p>}
      <div className="grid2">
        {scores.map((s) => {
          const team = teamOf(a, s.playerId);
          const sw = swapOf(s.playerId);
          return (
            <div className="card" key={s.playerId} style={{ marginBottom: 0 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Link href={`/player/${s.playerId}`}><strong>{s.name}</strong></Link>
                <span className="muted small">{team.length === 3 ? "✓ team picked" : "no team yet"}</span>
              </div>
              {g.teamsLocked && (
                <div className="chips">
                  {team.map((c) => <CastawayChip key={c} name={g.castawayName(c)} photo={photo(c)} out={g.isOut(c)} />)}
                </div>
              )}
              {g.teamsLocked && sw && <p className="small muted" style={{ margin: "8px 0 0" }}>Swap: {g.castawayName(sw.drop_id)} → {g.castawayName(sw.add_id)} (from Week 5)</p>}
            </div>
          );
        })}
      </div>
    </>
  );
}
