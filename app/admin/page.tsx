import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getSetting, loadAll, setSetting, newId } from "@/lib/db";
import { gameState, teamOf, weekLabel } from "@/lib/game";
import { formatDeadline, formatPT } from "@/lib/time";
import { addPlayer, newJoinCode, setRevealEarly } from "./actions";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  let code = await getSetting("join_code");
  if (!code) { code = newId(8); await setSetting("join_code", code); }
  const a = await loadAll();
  const g = gameState(a);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const w = g.pickWeek;
  const isLate = (p: { submitted_at: Date; entered_by_admin: boolean }) => !!w && !p.entered_by_admin && p.submitted_at > w.deadline;

  return (
    <>
      <h1>Admin</h1>
      <AdminNav ok={sp.ok} err={sp.err} />

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Invite link</h2>
        <p className="small muted">Send this to the group, or just send the site's address: anyone can tap their name on <strong>My team</strong> to sign in, or join there if they're new. Each player's personal link is in the list below.</p>
        <p><code className="link">{origin}/join/{code}</code></p>
        <form action={newJoinCode}><button className="secondary" type="submit">Make a new link (old one stops working)</button></form>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Can players see each other's picks before the deadline?</h2>
        <p className="small muted">
          {(await getSetting("reveal_early")) === "1"
            ? "Yes: everyone's teams and weekly picks are visible right away."
            : "No: other players' teams are blurred until teams lock, and weekly picks until each week's deadline. Everyone always sees their own."}
        </p>
        <form action={setRevealEarly}>
          <input type="hidden" name="on" value={(await getSetting("reveal_early")) === "1" ? "0" : "1"} />
          <button className="secondary" type="submit">{(await getSetting("reveal_early")) === "1" ? "Hide them until the deadlines" : "Show them right away"}</button>
        </form>
      </section>

      {w && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>{weekLabel(w)} picks</h2>
          <p className="small muted">Deadline {formatDeadline(w.deadline)}. {a.picks.filter((p) => p.week === w.number && p.slot === 1).length} of {a.players.length} picked.</p>
        </section>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Players ({a.players.length})</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>Name</th><th>Team</th>{w && <th>Week {w.number} pick</th>}<th>Personal link</th><th></th></tr></thead>
            <tbody>
              {a.players.map((p) => {
                const team = teamOf(a, p.id);
                const picks = w ? a.picks.filter((x) => x.player_id === p.id && x.week === w.number) : [];
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{team.length === 3 ? team.map(g.castawayName).join(", ") : <span className="tag late">no team</span>}</td>
                    {w && (
                      <td>
                        {picks.length ? picks.map((x) => (
                          <span key={x.slot}>{g.castawayName(x.castaway_id)} {isLate(x) && <span className="tag late" title={formatPT(x.submitted_at)}>late</span>}{x.entered_by_admin && <span className="tag">by admin</span>} </span>
                        )) : <span className="tag late">missing</span>}
                      </td>
                    )}
                    <td><code className="link small">{origin}/login/{p.token}</code></td>
                    <td><Link href={`/admin/players/${p.id}`}>Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <form action={addPlayer} className="row" style={{ marginTop: 12 }}>
          <input name="name" placeholder="Add a player by name" required />
          <button className="secondary" type="submit">Add player</button>
        </form>
      </section>
    </>
  );
}
