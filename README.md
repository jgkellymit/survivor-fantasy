# Survivor Fantasy

League site for our Survivor fantasy game: players pick 3 castaways and a weekly "who goes home" pick; the admin enters each week's results and scores are computed automatically, with a line-by-line breakdown.

- Next.js (App Router) on Vercel, Postgres (Neon via Vercel Storage, or any Postgres).
- Scoring engine: `lib/scoring.ts` (pure, unit-tested in `lib/scoring.test.ts`). Scores are never stored; they're recomputed from the entered events.
- Tables are created automatically on first request (`lib/db.ts`).

## Environment
- `DATABASE_URL` (or `POSTGRES_URL`, set automatically by the Neon integration)
- `ADMIN_PASSWORD`: password for `/admin`

## Develop
```
npm install
npm test
DATABASE_URL=postgres://... ADMIN_PASSWORD=... npm run dev
```

## Running a season
1. `/admin` → Cast: add the merge castaways.
2. Weeks: add Week 1 (its deadline is when teams lock; default midnight Wednesday PT).
3. Send the invite link from `/admin` to the group.
4. After each episode: Weeks → Enter results. Add the next week.
