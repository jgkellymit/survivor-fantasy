import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAll } from "@/lib/db";
import { gameState, weekLabel } from "@/lib/game";
import { formatDeadline } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const a = await loadAll();
  const w = a.weeks.find((x) => x.number === n);
  if (!w) notFound();
  const g = gameState(a);
  const name = g.castawayName;
  const r = w.results;
  return (
    <>
      <p className="small"><Link href="/">← Standings</Link></p>
      <h1>{weekLabel(w)}</h1>
      {r && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>What happened</h2>
          <ul>
            {r.immunity.map((i, k) => <li key={k}>{name(i.castawayId)} {i.place === 1 ? "won immunity" : "came second in immunity"}</li>)}
            {r.advantagesFound.map((x, k) => <li key={`f${k}`}>{name(x.castawayId)} found an advantage</li>)}
            {r.advantagesPlayed.map((x, k) => <li key={`p${k}`}>{name(x.castawayId)} played an advantage{x.counts === false ? " (doesn't count)" : ""}</li>)}
            {r.tribals.map((t, k) => {
              const votes = Object.entries(t.votes).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
              return (
                <li key={`t${k}`}>
                  Tribal{r.tribals.length > 1 ? ` ${k + 1}` : ""}: {t.wentHome ? `${name(t.wentHome)} went home${t.departure !== "vote" ? ` (${t.departure})` : ""}` : "no one went home"}
                  {votes.length > 0 && <> · votes: {votes.map(([c, v]) => `${name(c)} ${v}`).join(", ")}</>}
                </li>
              );
            })}
            {r.fireWinner && <li>{name(r.fireWinner)} won fire-making</li>}
          </ul>
        </div>
      )}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Go-home picks</h2>
        {!g.picksVisible(w) ? (
          <p className="muted">Picks are hidden until the deadline, {formatDeadline(w.deadline)}. {a.picks.filter((p) => p.week === n && p.slot === 1).length} of {a.players.length} players have picked.</p>
        ) : (
          <table>
            <tbody>
              {a.players.map((p) => {
                const ps = a.picks.filter((x) => x.player_id === p.id && x.week === n);
                return <tr key={p.id}><td>{p.name}</td><td>{ps.length ? ps.map((x) => name(x.castaway_id)).join(", ") : <span className="muted">no pick</span>}</td></tr>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
