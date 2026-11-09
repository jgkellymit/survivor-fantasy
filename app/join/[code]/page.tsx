import { joinLeague } from "@/app/actions";
import { getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Join({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ err?: string; name?: string }> }) {
  const { code } = await params;
  const { err, name } = await searchParams;
  const valid = code === (await getSetting("join_code"));
  if (!valid) return <div className="card"><h1>Link not valid</h1><p>This invite link doesn't work any more. Ask Jack for the current one.</p></div>;
  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h1>Join the league</h1>
      <p className="muted">Enter your name as you want it on the leaderboard. No password needed: this phone stays signed in.</p>
      {err === "taken" && <div className="notice err">Someone named “{name}” already joined. If that's you, ask Jack for your personal sign-in link. Otherwise add a last initial.</div>}
      {err === "name" && <div className="notice err">Enter a name (up to 40 characters).</div>}
      <form action={joinLeague}>
        <input type="hidden" name="code" value={code} />
        <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required maxLength={40} autoComplete="given-name" defaultValue={name} /></div>
        <button type="submit">Join</button>
      </form>
    </div>
  );
}
