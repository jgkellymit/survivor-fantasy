import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState, teamOf, weekLabel } from "@/lib/game";
import { scoreSeason } from "@/lib/scoring";
import { CastawayTile, HiddenTiles, PickBadge } from "@/components/Avatar";
import { currentPlayer } from "@/lib/auth";
import { visibility } from "@/lib/visibility";

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
  const me = await currentPlayer();
  const vis = await visibility(a, me?.id ?? null);
  const pw = g.pickWeek;
  const curPicks = pw ? a.picks.filter((x) => x.player_id === id && x.week === pw.number).sort((x, y) => x.slot - y.slot) : [];

  return (
    <>
      <p className="small"><Link href="/">← Standings</Link></p>
      <h1>{p.name}</h1>
      <p className="muted">Rank <strong>#{s.rank}</strong> of {a.players.length} · <strong>{s.total}</strong> points</p>
      <div className="card teamcard">
        {team.length < 3 ? (
          <span className="muted">No tribe picked yet.</span>
        ) : vis.teamVisible(id) ? (
          <div className="tiles">{team.map((c, i) => <CastawayTile key={c} name={g.castawayName(c)} photo={photo(c)} out={g.isOut(c)} rank={i + 1} />)}</div>
        ) : (
          <HiddenTiles />
        )}
        {sw && vis.teamVisible(id) && <p className="small muted" style={{ margin: 0 }}>Swap: {g.castawayName(sw.drop_id)} → {g.castawayName(sw.add_id)} (from Week 5)</p>}
        {pw && (
          <div className="pickline">
            <span>{weekLabel(pw)} pick:</span>
            {!vis.pickVisible(id, pw) ? (curPicks.length ? <PickBadge hidden /> : <PickBadge none />) : curPicks.length ? curPicks.map((x) => <PickBadge key={x.slot} name={g.castawayName(x.castaway_id)} photo={photo(x.castaway_id)} />) : <PickBadge none />}
          </div>
        )}
      </div>
      {s.weeks.length === 0 && <p className="muted">No weeks scored yet.</p>}
      {[...s.weeks].reverse().map((w) => {
        const wk = a.weeks.find((x) => x.number === w.week)!;
        const picks = a.picks.filter((x) => x.player_id === id && x.week === w.week);
        return (
          <section className="card" id={`week-${w.week}`} key={w.week} style={{ scrollMarginTop: 80 }}>
            <div className="weekhead">
              <span className="wk">{weekLabel(wk)}</span>
              <span className="score">{w.total > 0 ? "+" : ""}{w.total}</span>
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
