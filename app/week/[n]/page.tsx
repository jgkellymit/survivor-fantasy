import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState, teamOf, weekLabel } from "@/lib/game";
import { scoreSeason, teamForWeek } from "@/lib/scoring";
import { formatDeadline } from "@/lib/time";
import { currentPlayer } from "@/lib/auth";
import { visibility } from "@/lib/visibility";
import { Avatar, PickBadge } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const a = await loadAll();
  const w = a.weeks.find((x) => x.number === n);
  if (!w) notFound();
  const me = await currentPlayer();
  const g = gameState(a);
  const vis = await visibility(a, me?.id ?? null);
  const data = toSeasonData(a);
  const scores = scoreSeason(data);
  const cast = (id: string) => a.castaways.find((c) => c.id === id);
  const r = w.results;
  const idx = a.weeks.findIndex((x) => x.number === n);
  const prev = a.weeks[idx - 1];
  const next = a.weeks[idx + 1];
  const face = (id: string, extra?: string) => (
    <div className="event"><Avatar name={cast(id)?.name ?? "?"} photo={cast(id)?.photo_url} size="lg" /><span><strong>{cast(id)?.name ?? "?"}</strong> {extra}</span></div>
  );
  const rows = [...scores].sort((x, y) => (y.weeks.find((q) => q.week === n)?.total ?? 0) - (x.weeks.find((q) => q.week === n)?.total ?? 0));

  return (
    <>
      <nav className="weeknav" aria-label="Weeks">
        {prev ? <Link className="btn secondary" href={`/week/${prev.number}`}>← Week {prev.number}</Link> : <span className="disabled">←</span>}
        <span className="small muted">{r ? "Scored" : g.now < w.deadline ? `Picks due ${formatDeadline(w.deadline)}` : "Waiting for results"}</span>
        {next ? <Link className="btn secondary" href={`/week/${next.number}`}>Week {next.number} →</Link> : <span className="disabled">→</span>}
      </nav>
      <h1>{weekLabel(w)}</h1>

      {r && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>What happened</h2>
          {r.immunity.map((i, k) => <div key={`i${k}`}>{face(i.castawayId, i.place === 1 ? "won immunity 🏆" : "came second in immunity")}</div>)}
          {r.advantagesFound.map((x, k) => <div key={`f${k}`}>{face(x.castawayId, "found an advantage 🔎")}</div>)}
          {r.advantagesPlayed.map((x, k) => <div key={`p${k}`}>{face(x.castawayId, `played an advantage${x.counts === false ? " (no points)" : " 🗿"}`)}</div>)}
          {r.tribals.map((t, k) => {
            const votes = Object.entries(t.votes).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
            return (
              <div key={`t${k}`}>
                {t.wentHome ? face(t.wentHome, `${t.departure === "vote" ? "was voted out" : t.departure === "quit" ? "quit" : "was medically evacuated"}${r.tribals.length > 1 ? ` at tribal ${k + 1}` : ""} 🕯️`) : <p>No one went home{r.tribals.length > 1 ? ` at tribal ${k + 1}` : ""}.</p>}
                {votes.length > 0 && <p className="small muted" style={{ margin: "0 0 8px 66px" }}>Votes: {votes.map(([c, v]) => `${cast(c)?.name ?? "?"} ${v}`).join(", ")}</p>}
              </div>
            );
          })}
          {r.fireWinner && face(r.fireWinner, "won fire-making 🔥")}
        </section>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Everyone's week</h2>
        {!r && !vis.revealEarly && g.now < w.deadline && <p className="small muted">Other players' picks show after the deadline. {a.picks.filter((p) => p.week === n && p.slot === 1).length} of {a.players.length} have picked.</p>}
        <div className="scroll">
          <table>
            <thead><tr><th>Player</th><th>Tribe</th><th>Go-home pick</th>{r && <th className="num">Points</th>}</tr></thead>
            <tbody>
              {rows.map((s) => {
                const p = data.players.find((x) => x.id === s.playerId)!;
                const ps = a.picks.filter((x) => x.player_id === s.playerId && x.week === n).sort((x, y) => x.slot - y.slot);
                const pickHidden = !vis.pickVisible(s.playerId, w);
                const team = teamForWeek(p, n);
                return (
                  <tr key={s.playerId}>
                    <td><Link href={`/player/${s.playerId}#week-${n}`}><strong>{s.name}</strong></Link></td>
                    <td>
                      {teamOf(a, s.playerId).length < 3 ? <span className="muted small">none</span> : vis.teamVisible(s.playerId) ? (
                        <div className="chips">{team.map((c) => <Avatar key={c} name={cast(c)?.name ?? "?"} photo={cast(c)?.photo_url} />)}</div>
                      ) : <span className="muted small">hidden</span>}
                    </td>
                    <td>{pickHidden ? (ps.length ? <PickBadge hidden /> : <PickBadge none />) : ps.length ? ps.map((x) => <PickBadge key={x.slot} name={cast(x.castaway_id)?.name} photo={cast(x.castaway_id)?.photo_url} />) : <PickBadge none />}</td>
                    {r && <td className="num"><strong>{s.weeks.find((q) => q.week === n)?.total ?? 0}</strong></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
