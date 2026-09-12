# Questline — a Life RPG

Turn real-life tasks into quests. Complete them to earn XP, gold, and level up
a character whose attributes (Intellect, Strength, Wisdom, Discipline,
Creativity) grow based on what kind of task you finish. Includes streaks and
a small gold-based shop.

## Stack

- **Frontend:** React 18 (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`) — file-based, zero external setup
- **Auth:** JWT + bcrypt password hashing

## Project structure

```
liferpg/
  backend/     Express API, SQLite db, RPG engine (all in server.js)
  frontend/    React app (Vite)
```

## Running locally

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET to something random
npm install
npm start                 # runs on http://localhost:4000
```

The SQLite database file (`liferpg.db`) is created automatically on first
run, along with a seeded shop inventory.

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # points at the backend URL
npm install
npm run dev                # runs on http://localhost:5173
```

Open `http://localhost:5173`, create a hero, and start adding quests.

## How the RPG systems work

- **XP & leveling:** each level needs `round(100 * level^1.5)` XP — a
  non-linear curve, so later levels take meaningfully longer.
- **Difficulty tiers:** Easy / Medium / Hard quests award different amounts
  of XP, gold, and attribute points (see `DIFFICULTY` in `backend/server.js`).
- **Attributes:** every quest is tagged with one of five attributes; completing
  it grows that stat.
- **Streaks:** tracked server-side off `last_active_date` — completing at
  least one quest on consecutive calendar days increments the streak; missing
  a day resets it.
- **Economy:** gold earned from quests and level-ups can be spent in the shop
  on cosmetic badges/themes. All reward math happens on the server so the
  client can't fake XP or gold.

## Security notes

- Passwords are hashed with bcrypt, never stored in plaintext.
- All task/shop routes are behind JWT auth middleware and scoped to
  `req.userId` pulled from the verified token — a user can only ever read or
  modify their own data.
- Reward calculations (XP/gold/attributes) happen entirely server-side.

## Deployment

- **Backend:** deploy `backend/` to Render/Railway/Fly.io etc. Set
  `JWT_SECRET` and `PORT` as environment variables. SQLite works fine on a
  single persistent instance; for multi-instance deployments swap in
  Postgres (the schema translates directly).
- **Frontend:** deploy `frontend/` to Vercel/Netlify. Set `VITE_API_URL` to
  your deployed backend URL.
