import postgres from "postgres";
import type { SeasonData, WeekResults } from "./scoring";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

function url() {
  const u = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL;
  if (!u) throw new Error("DATABASE_URL is not set. Add a Postgres database to the Vercel project.");
  return u;
}

export function sql() {
  if (!global.__sql) {
    const u = url();
    const local = /localhost|127\.0\.0\.1/.test(u);
    global.__sql = postgres(u, { ssl: local ? false : "require", max: 5, prepare: false, onnotice: () => {} });
  }
  return global.__sql;
}

const SCHEMA = `
create table if not exists settings (key text primary key, value text not null);
create table if not exists castaways (
  id text primary key,
  name text not null,
  photo_url text,
  placement int,
  sort int not null default 0
);
create table if not exists players (
  id text primary key,
  name text not null,
  token text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists team_picks (
  player_id text not null references players(id) on delete cascade,
  slot int not null,
  castaway_id text not null references castaways(id),
  primary key (player_id, slot)
);
create table if not exists swaps (
  player_id text primary key references players(id) on delete cascade,
  drop_id text not null references castaways(id),
  add_id text not null references castaways(id),
  created_at timestamptz not null default now()
);
create table if not exists weeks (
  number int primary key,
  deadline timestamptz not null,
  tribal_count int not null default 1,
  is_finale boolean not null default false,
  results jsonb
);
alter table weeks add column if not exists episode int;
create table if not exists castaway_photos (
  castaway_id text primary key references castaways(id) on delete cascade,
  mime text not null,
  data bytea not null,
  updated_at timestamptz not null default now()
);
create table if not exists weekly_picks (
  player_id text not null references players(id) on delete cascade,
  week int not null references weeks(number) on delete cascade,
  slot int not null,
  castaway_id text not null references castaways(id),
  submitted_at timestamptz not null default now(),
  entered_by_admin boolean not null default false,
  primary key (player_id, week, slot)
);
`;

export async function db() {
  const s = sql();
  if (!global.__schemaReady) {
    global.__schemaReady = s.unsafe(SCHEMA).then(() => undefined);
    global.__schemaReady.catch(() => (global.__schemaReady = undefined));
  }
  await global.__schemaReady;
  return s;
}

export function newId(len = 10) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// ---------- typed rows ----------
export interface CastawayRow { id: string; name: string; photo_url: string | null; placement: number | null; sort: number }
export interface PlayerRow { id: string; name: string; token: string; created_at: Date }
export interface WeekRow { number: number; deadline: Date; tribal_count: number; is_finale: boolean; results: WeekResults | null; episode: number | null }
export interface PickRow { player_id: string; week: number; slot: number; castaway_id: string; submitted_at: Date; entered_by_admin: boolean }

export async function getSetting(key: string): Promise<string | null> {
  const s = await db();
  const r = await s`select value from settings where key = ${key}`;
  return r[0]?.value ?? null;
}
export async function setSetting(key: string, value: string) {
  const s = await db();
  await s`insert into settings (key, value) values (${key}, ${value}) on conflict (key) do update set value = excluded.value`;
}

export async function loadAll() {
  const s = await db();
  const [castaways, players, teams, swaps, weeks, picks] = await Promise.all([
    s<CastawayRow[]>`select * from castaways order by sort, name`,
    s<PlayerRow[]>`select * from players order by lower(name)`,
    s<{ player_id: string; slot: number; castaway_id: string }[]>`select * from team_picks order by player_id, slot`,
    s<{ player_id: string; drop_id: string; add_id: string; created_at: Date }[]>`select * from swaps`,
    s<WeekRow[]>`select * from weeks order by number`,
    s<PickRow[]>`select * from weekly_picks order by week, player_id, slot`,
  ]);
  return { castaways, players, teams, swaps, weeks, picks };
}

export type All = Awaited<ReturnType<typeof loadAll>>;

export function toSeasonData(a: All): SeasonData {
  return {
    castaways: a.castaways.map((c) => ({ id: c.id, name: c.name, placement: c.placement })),
    players: a.players.map((p) => {
      const sw = a.swaps.find((x) => x.player_id === p.id);
      return {
        id: p.id,
        name: p.name,
        team: a.teams.filter((t) => t.player_id === p.id).sort((x, y) => x.slot - y.slot).map((t) => t.castaway_id),
        swap: sw ? { drop: sw.drop_id, add: sw.add_id } : null,
      };
    }),
    weeks: a.weeks.map((w) => ({ number: w.number, isFinale: w.is_finale, results: w.results })),
    picks: a.picks.map((p) => ({ playerId: p.player_id, week: p.week, castawayId: p.castaway_id })),
  };
}
