import { adminLogin } from "../actions";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h1>Admin sign-in</h1>
      {err === "bad" && <div className="notice err">Wrong password.</div>}
      {err === "unset" && <div className="notice err">ADMIN_PASSWORD isn't set in the hosting environment yet.</div>}
      <form action={adminLogin}>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" name="password" type="password" required autoComplete="current-password" /></div>
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
