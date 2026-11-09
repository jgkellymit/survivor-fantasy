import Link from "next/link";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState, teamOf } from "@/lib/game";
import { scoreSeason, teamForWeek } from "@/lib/scoring";
import { formatDeadline } from "@/lib/time";
import { timeLeft } from "@/lib/countdown";
import { CastawayTile } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const a = await loadAll();
  const g = gameState(a);
  const data = toSeasonData(a);
  const scores = scoreSeason(data);
  const scored = a.weeks.filter((w) => w.results);
  const photo = (id: string) => a.castaways.find((c) => c.id === id)?.photo_url;
  const lastWeek = scored.length ? scored[scored.length - 1].number : 1;
  const w = g.pickWeek;
  const left = w ? timeLeft(w.deadline, g.now) : null;
  const top3 = scored.length ? scores.slice(0, 3) : [];
  const stillIn = a.castaways.filter((c) => !g.isOut(c.id)).length;

  return (
    <>
      {w ? (
        <section className="hero">
          <div className="kicker">{w.is_finale ? "THE FINALE" : `WEEK ${w.number}`}</div>
          {left ? (
            <>
              <div className="big">{!g.teamsLocked ? "Pick your tribe" : "Who's going home?"}</div>
              <p>
                {!g.teamsLocked ? "Choose your 3 castaways and your first vote-off pick. " : "Make your vote-off pick. "}
                Due {formatDeadline(w.deadline)} <span className="countdown">{left}</span>
              </p>
              <Link className="btn" href="/me">Make your picks →</Link>
            </>
          ) : (
            <>
              <div className="big">The tribe has spoken…</div>
              <p>Picks are locked. Results are coming after the episode.</p>
              <Link className="btn" href={`/week/${w.number}`}>See everyone's picks →</Link>
            </>
          )}
        </section>
      ) : a.weeks.length === 0 ? (
        <section className="hero">
          <div className="kicker">COMING SOON</div>
          <div className="big">The game starts at the merge</div>
          <p>Check back soon to pick your tribe.</p>
        </section>
      ) : null}

      {top3.length === 3 && (
        <div className="podium" aria-label="Top three">
          {[1, 0, 2].map((i) => (
            <Link key={i} href={`/player/${top3[i].playerId}`} className={`spot p${i + 1}`}>
              <div className="medal">{["🥇", "🥈", "🥉"][i]}</div>
              <div className="who">{top3[i].name}</div>
              <div className="score">{top3[i].total}</div>
              <div className="block">{top3[i].rank}</div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="section-title">🏆 Standings</h2>
      {a.players.length === 0 ? (
        <div className="card muted">No one has joined yet.</div>
      ) : (
        <div className="card scroll" style={{ padding: 0 }}>
          <table className="grid">
            <thead>
              <tr>
                <th className="sticky-col">Player</th>
                {scored.map((wk) => <th key={wk.number} className="num"><Link href={`/week/${wk.number}`}>{wk.is_finale ? "Fin" : `W${wk.number}`}</Link></th>)}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.playerId}>
                  <td className="sticky-col"><span className="rank">{s.rank}</span> <Link href={`/player/${s.playerId}`}><strong>{s.name}</strong></Link></td>
                  {scored.map((wk) => {
                    const pw = s.weeks.find((x) => x.week === wk.number);
                    return <td key={wk.number} className="num"><Link href={`/player/${s.playerId}#week-${wk.number}`} title="See breakdown">{pw?.total ?? 0}</Link></td>;
                  })}
                  <td className="num total">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {scored.length > 0 && <p className="small muted">Tap any weekly score to see how it was calculated.</p>}

      <h2 className="section-title">🌴 Tribes {a.castaways.length > 0 && <span className="tag">{stillIn} of {a.castaways.length} castaways still in</span>}</h2>
      {!g.teamsLocked && <p className="muted small">Teams are revealed when they lock{g.week1 ? ` at ${formatDeadline(g.week1.deadline)}` : ""}.</p>}
      <div className="grid2">
        {scores.map((s) => {
          const p = data.players.find((x) => x.id === s.playerId)!;
          const team = teamForWeek(p, Math.max(lastWeek, g.pickWeek?.number ?? 0));
          const picked = teamOf(a, s.playerId).length === 3;
          return (
            <div className="card teamcard" key={s.playerId}>
              <div className="head">
                <Link href={`/player/${s.playerId}`}>{s.name}</Link>
                {g.teamsLocked ? <span className="pts">{s.total}</span> : <span className="muted small">{picked ? "✓ tribe picked" : "no picks yet"}</span>}
              </div>
              {g.teamsLocked && team.length > 0 && (
                <div className="tiles">
                  {team.map((c, i) => <CastawayTile key={c} name={g.castawayName(c)} photo={photo(c)} out={g.isOut(c)} rank={i + 1} />)}
                </div>
              )}
              {g.teamsLocked && p.swap && <span className="small muted">Swapped {g.castawayName(p.swap.drop)} → {g.castawayName(p.swap.add)} (from Week 5)</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
