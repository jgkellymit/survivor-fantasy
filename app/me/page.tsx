import Link from "next/link";
import { headers } from "next/headers";
import { currentPlayer } from "@/lib/auth";
import { loadAll } from "@/lib/db";
import { gameState, teamOf } from "@/lib/game";
import { formatDeadline } from "@/lib/time";
import { saveSwap, saveTeam, saveWeeklyPick } from "@/app/actions";
import { Avatar, CastawayChip } from "@/components/Avatar";
import { SWAP_WEEK } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function Me({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; welcome?: string }> }) {
  const sp = await searchParams;
  const me = await currentPlayer();
  if (!me) {
    return (
      <div className="card">
        <h1>You're not signed in</h1>
        {sp.err && <div className="notice err">{sp.err}</div>}
        <p>Use the invite link Jack sent to the group to join, or your personal sign-in link if you've already joined on another device.</p>
      </div>
    );
  }
  const a = await loadAll();
  const g = gameState(a);
  const team = teamOf(a, me.id);
  const swap = a.swaps.find((s) => s.player_id === me.id);
  const cast = a.castaways;
  const photo = (id: string) => cast.find((c) => c.id === id)?.photo_url;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const w = g.pickWeek;
  const myPicks = w ? a.picks.filter((p) => p.player_id === me.id && p.week === w.number) : [];
  const stillIn = w ? cast.filter((c) => g.inForWeek(c.id, w.number)) : [];

  return (
    <>
      <h1>Hi, {me.name}</h1>
      {sp.ok && <div className="notice">{sp.ok}</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}
      {sp.welcome && (
        <div className="notice">
          <strong>You're in.</strong> This device stays signed in. To sign in on another phone or computer, save your personal link:
          <br /><code className="link">{origin}/login/{me.token}</code>
        </div>
      )}

      {/* Weekly pick */}
      {w && g.teamsLocked !== undefined && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Week {w.number}: who goes home?</h2>
          <p className="muted small">
            Due {formatDeadline(w.deadline)}. You can change it until then. Everyone's picks show after the deadline.
            {g.now >= w.deadline && <> <strong>The deadline has passed</strong>, so a pick now is marked late.</>}
          </p>
          {cast.length === 0 ? (
            <p>The cast hasn't been added yet.</p>
          ) : (
            <form action={saveWeeklyPick}>
              <input type="hidden" name="week" value={w.number} />
              {Array.from({ length: w.tribal_count }, (_, i) => i + 1).map((slot) => {
                const cur = myPicks.find((p) => p.slot === slot)?.castaway_id;
                return (
                  <fieldset key={slot} style={{ border: 0, padding: 0, margin: "0 0 12px" }}>
                    {w.tribal_count > 1 && <legend><strong>Double tribal: pick {slot}</strong></legend>}
                    <div className="pickgrid">
                      {stillIn.map((c) => (
                        <label key={c.id} className="pickopt">
                          <input type="radio" name={`pick${slot}`} value={c.id} defaultChecked={cur === c.id} required={slot === 1} />
                          <Avatar name={c.name} photo={c.photo_url} /> {c.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
              <button type="submit">{myPicks.length ? "Update pick" : "Save pick"}</button>
            </form>
          )}
        </section>
      )}

      {/* Team */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Your team</h2>
        {!g.teamsLocked ? (
          <>
            <p className="muted small">
              Pick 3 castaways in order, favourite first. Others can pick the same people. Your order is the tiebreaker at the end of the season.
              {g.week1 && <> Teams lock at {formatDeadline(g.week1.deadline)}.</>}
            </p>
            {cast.length < 3 ? (
              <p>The cast hasn't been added yet. Check back soon.</p>
            ) : (
              <form action={saveTeam}>
                {[1, 2, 3].map((n) => (
                  <div className="slot" key={n}>
                    <span className="n">{n}</span>
                    <select name={`c${n}`} defaultValue={team[n - 1] ?? ""} required aria-label={`Pick ${n}`}>
                      <option value="" disabled>Choose a castaway…</option>
                      {cast.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ))}
                <button type="submit">{team.length ? "Update team" : "Save team"}</button>
              </form>
            )}
          </>
        ) : team.length ? (
          <>
            <ol>
              {team.map((c) => (
                <li key={c} style={{ marginBottom: 6 }}>
                  <CastawayChip name={g.castawayName(c)} photo={photo(c)} out={g.isOut(c)} />
                  {swap?.drop_id === c && <span className="small muted"> → swapped for {g.castawayName(swap.add_id)} from Week {SWAP_WEEK}</span>}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>Teams are locked and you don't have one. Ask Jack to set it for you.</p>
        )}
      </section>

      {/* Swap */}
      {g.teamsLocked && team.length === 3 && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Your one swap</h2>
          {g.swapOpen ? (
            <>
              <p className="muted small">Drop anyone on your team (in or out) and add anyone still in the game. The new castaway scores from Week {SWAP_WEEK} on. You can change it until the Week {SWAP_WEEK} deadline.</p>
              <form action={saveSwap} className="row">
                <select name="drop" defaultValue={swap?.drop_id ?? ""} required aria-label="Drop">
                  <option value="" disabled>Drop…</option>
                  {team.map((c) => <option key={c} value={c}>{g.castawayName(c)}</option>)}
                </select>
                <select name="add" defaultValue={swap?.add_id ?? ""} required aria-label="Add">
                  <option value="" disabled>Add…</option>
                  {cast.filter((c) => !team.includes(c.id) && !g.isOut(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="submit">{swap ? "Change swap" : "Make swap"}</button>
              </form>
              {swap && (
                <form action={saveSwap} style={{ marginTop: 8 }}>
                  <input type="hidden" name="undo" value="1" />
                  <button className="secondary" type="submit">Undo swap</button>
                </form>
              )}
            </>
          ) : swap ? (
            <p>You swapped {g.castawayName(swap.drop_id)} for {g.castawayName(swap.add_id)}.</p>
          ) : (
            <p className="muted">The swap window has closed.</p>
          )}
        </section>
      )}

      <p className="small"><Link href={`/player/${me.id}`}>See your score breakdown →</Link></p>
    </>
  );
}
