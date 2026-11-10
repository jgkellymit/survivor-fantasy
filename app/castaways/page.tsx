import Link from "next/link";
import { loadAll, toSeasonData } from "@/lib/db";
import { gameState } from "@/lib/game";
import { scoreCastaways, teamForWeek } from "@/lib/scoring";
import { currentPlayer } from "@/lib/auth";
import { visibility } from "@/lib/visibility";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Castaways · Survivor Fantasy" };

/** Cumulative points as a tiny line chart; flat once the castaway is out. */
function Spark({ values, max, out }: { values: number[]; max: number; out: boolean }) {
  const W = 90, H = 26;
  if (values.length < 2) return null;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - 2 - (Math.max(0, v) / Math.max(1, max)) * (H - 4)}`).join(" ");
  return (
    <svg className="spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={out ? "var(--muted)" : "var(--flame-3)"} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default async function Castaways() {
  const a = await loadAll();
  const me = await currentPlayer();
  const g = gameState(a);
  const vis = await visibility(a, me?.id ?? null);
  const data = toSeasonData(a);
  const scores = scoreCastaways(data);
  const scored = a.weeks.filter((w) => w.results);
  const lastWeek = Math.max(1, ...scored.map((w) => w.number), g.pickWeek?.number ?? 1);
  const cumulative = (c: (typeof scores)[number]) => {
    let s = 0;
    return scored.map((w) => (s += c.weeks.find((x) => x.week === w.number)?.total ?? 0));
  };
  const maxTotal = Math.max(1, ...scores.map((c) => Math.max(...cumulative(c), 0)));
  // How many (visible) tribes each castaway is on
  const allVisible = vis.teamVisible(""); // true once teams lock, or when the admin shows picks early
  const owners = (cid: string) =>
    allVisible ? data.players.filter((p) => teamForWeek(p, lastWeek).includes(cid)).map((p) => p.name) : [];

  return (
    <>
      <h1>Castaways</h1>
      <p className="muted">Points each castaway has earned for the tribes that have them (everything except weekly go-home picks). Their line goes flat once they're out.</p>
      <div className="card scroll" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Castaway</th>
              {scored.map((w) => <th key={w.number} className="num"><Link href={`/week/${w.number}`}>{w.is_finale ? "Fin" : `W${w.number}`}</Link></th>)}
              <th className="num">Total</th>
              {scored.length > 1 && <th>Trend</th>}
              <th>On tribes</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((c) => {
              const info = a.castaways.find((x) => x.id === c.castawayId)!;
              const out = g.isOut(c.castawayId);
              const own = owners(c.castawayId);
              return (
                <tr key={c.castawayId} className={out ? "castrow out" : "castrow"}>
                  <td>
                    <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                      <Avatar name={info.name} photo={info.photo_url} size="lg" />
                      <div>
                        <div className="cname"><strong>{info.name}</strong></div>
                        <div className="small muted">{out ? `Out week ${g.elim.get(c.castawayId)}` : info.placement ? `Finished #${info.placement}` : "Still in"}</div>
                      </div>
                    </div>
                  </td>
                  {scored.map((w) => {
                    const cw = c.weeks.find((x) => x.week === w.number);
                    return <td key={w.number} className="num" title={cw?.lines.map((l) => `${l.points > 0 ? "+" : ""}${l.points} ${l.reason}`).join("\n")}>{cw && (cw.total !== 0 || !out) ? cw.total : "–"}</td>;
                  })}
                  <td className="num total"><strong>{c.total}</strong></td>
                  {scored.length > 1 && <td><Spark values={cumulative(c)} max={maxTotal} out={out} /></td>}
                  <td className="small" style={{ whiteSpace: "normal", minWidth: 120 }}>{own.length ? `${own.length}: ${own.join(", ")}` : <span className="muted">{allVisible ? "nobody" : "revealed when teams lock"}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {scored.length === 0 && <p className="small muted">Points appear here after the first week is scored.</p>}
    </>
  );
}
