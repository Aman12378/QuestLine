// server.js — Life RPG backend
// Single-file API: auth, tasks (quests), RPG progression engine, streaks, shop/economy.
// Keeping everything co-located on purpose (routes + logic + db access) instead of
// splitting into many tiny files — easier to trace one request end-to-end.

import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ---------------------------------------------------------------------------
// DB setup
// ---------------------------------------------------------------------------
const db = new Database(path.join(__dirname, "liferpg.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    gold INTEGER NOT NULL DEFAULT 50,
    streak_count INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,
    intellect INTEGER NOT NULL DEFAULT 0,
    strength INTEGER NOT NULL DEFAULT 0,
    wisdom INTEGER NOT NULL DEFAULT 0,
    discipline INTEGER NOT NULL DEFAULT 0,
    creativity INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''");
} catch {
  // Column already exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    attribute TEXT NOT NULL DEFAULT 'discipline',
    difficulty TEXT NOT NULL DEFAULT 'easy',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cost INTEGER NOT NULL,
    icon TEXT DEFAULT '🏆'
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES shop_items(id),
    purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed shop items once
const shopCount = db.prepare("SELECT COUNT(*) c FROM shop_items").get().c;
if (shopCount === 0) {
  const seed = db.prepare(
    "INSERT INTO shop_items (name, description, cost, icon) VALUES (?, ?, ?, ?)"
  );
  const items = [
    ["Bronze Badge", "A humble token of consistency.", 40, "🥉"],
    ["Silver Badge", "You're building real momentum.", 120, "🥈"],
    ["Golden Badge", "Elite discipline, elite rewards.", 300, "🥇"],
    ["Dark Mode Theme", "Unlock the shadow-realm palette.", 80, "🌙"],
    ["Sunrise Theme", "Unlock a warm, energizing palette.", 80, "🌅"],
    ["XP Booster (24h)", "Cosmetic flex — you earned it.", 150, "⚡"],
    ["Phoenix Avatar Frame", "For those who rise after a broken streak.", 200, "🔥"],
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => seed.run(...r)));
  insertMany(items);
}

// ---------------------------------------------------------------------------
// RPG engine helpers
// ---------------------------------------------------------------------------
const DIFFICULTY = {
  easy: { xp: 20, gold: 5, attr: 1 },
  medium: { xp: 45, gold: 12, attr: 2 },
  hard: { xp: 90, gold: 25, attr: 4 },
};

// Non-linear XP curve: each level needs more XP than the last.
function xpNeededForLevel(level) {
  return Math.round(100 * Math.pow(level, 1.5));
}

function applyXpAndLevelUp(user, xpGained) {
  user.xp += xpGained;
  let leveledUp = false;
  while (user.xp >= xpNeededForLevel(user.level)) {
    user.xp -= xpNeededForLevel(user.level);
    user.level += 1;
    user.gold += 20 + user.level * 5; // level-up bonus gold
    leveledUp = true;
  }
  return leveledUp;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak(user) {
  const today = todayStr();
  if (user.last_active_date === today) {
    // already counted today, no change
    return;
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (user.last_active_date === yesterday) {
    user.streak_count += 1;
  } else {
    user.streak_count = 1; // streak broken or first ever activity
  }
  user.last_active_date = today;
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatar_url: u.avatar_url || "",
    xp: u.xp,
    level: u.level,
    gold: u.gold,
    streak_count: u.streak_count,
    last_active_date: u.last_active_date,
    xp_to_next: xpNeededForLevel(u.level),
    attributes: {
      intellect: u.intellect,
      strength: u.strength,
      wisdom: u.wisdom,
      discipline: u.discipline,
      creativity: u.creativity,
    },
  };
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function getUser(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------
app.post("/api/auth/signup", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (existing) return res.status(409).json({ error: "Username or email already taken" });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
    )
    .run(username, email, hash);

  const user = getUser(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "30d" });
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { emailOrUsername, password } = req.body || {};
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: "emailOrUsername and password are required" });
  }
  const user = db
    .prepare("SELECT * FROM users WHERE username = ? OR email = ?")
    .get(emailOrUsername, emailOrUsername);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: publicUser(user) });
});

app.get("/api/me", auth, (req, res) => {
  const user = getUser(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

app.put("/api/user/avatar", auth, (req, res) => {
  const { avatar_url } = req.body || {};
  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatar_url || "", req.userId);
  const updatedUser = getUser(req.userId);
  res.json({ user: publicUser(updatedUser) });
});

// ---------------------------------------------------------------------------
// Task (quest) routes — all scoped to req.userId, never trust client-sent user id
// ---------------------------------------------------------------------------
app.get("/api/tasks", auth, (req, res) => {
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY completed ASC, created_at DESC")
    .all(req.userId);
  res.json({ tasks });
});

app.post("/api/tasks", auth, (req, res) => {
  const { title, description, attribute, difficulty } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required" });
  const attr = ["intellect", "strength", "wisdom", "discipline", "creativity"].includes(attribute)
    ? attribute
    : "discipline";
  const diff = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy";

  const info = db
    .prepare(
      "INSERT INTO tasks (user_id, title, description, attribute, difficulty) VALUES (?, ?, ?, ?, ?)"
    )
    .run(req.userId, title.trim(), (description || "").trim(), attr, diff);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ task });
});

app.put("/api/tasks/:id", auth, (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: "Quest not found" });
  if (task.completed) return res.status(400).json({ error: "Cannot edit a completed quest" });

  const { title, description, attribute, difficulty } = req.body || {};
  const attr = ["intellect", "strength", "wisdom", "discipline", "creativity"].includes(attribute)
    ? attribute
    : task.attribute;
  const diff = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : task.difficulty;

  db.prepare(
    "UPDATE tasks SET title = ?, description = ?, attribute = ?, difficulty = ? WHERE id = ?"
  ).run(title?.trim() || task.title, description ?? task.description, attr, diff, task.id);

  res.json({ task: db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id) });
});

app.delete("/api/tasks/:id", auth, (req, res) => {
  const info = db
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: "Quest not found" });
  res.json({ ok: true });
});

// The core "progression" endpoint: completing a quest awards XP/gold/attribute,
// possibly levels the user up, and updates their streak. All server-side so
// the client can never fake its own rewards.
app.post("/api/tasks/:id/complete", auth, (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: "Quest not found" });
  if (task.completed) return res.status(400).json({ error: "Quest already completed" });

  const user = getUser(req.userId);
  const reward = DIFFICULTY[task.difficulty] || DIFFICULTY.easy;

  const leveledUp = applyXpAndLevelUp(user, reward.xp);
  user.gold += reward.gold;
  user[task.attribute] += reward.attr;
  updateStreak(user);

  db.prepare(
    `UPDATE users SET xp=?, level=?, gold=?, streak_count=?, last_active_date=?,
     intellect=?, strength=?, wisdom=?, discipline=?, creativity=? WHERE id=?`
  ).run(
    user.xp,
    user.level,
    user.gold,
    user.streak_count,
    user.last_active_date,
    user.intellect,
    user.strength,
    user.wisdom,
    user.discipline,
    user.creativity,
    user.id
  );

  db.prepare(
    "UPDATE tasks SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(task.id);

  res.json({
    task: db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id),
    user: publicUser(user),
    reward: { xp: reward.xp, gold: reward.gold, attribute: task.attribute, amount: reward.attr },
    leveledUp,
  });
});

// ---------------------------------------------------------------------------
// Shop / economy
// ---------------------------------------------------------------------------
app.get("/api/shop", auth, (req, res) => {
  const items = db.prepare("SELECT * FROM shop_items ORDER BY cost ASC").all();
  const owned = db
    .prepare("SELECT item_id FROM purchases WHERE user_id = ?")
    .all(req.userId)
    .map((r) => r.item_id);
  res.json({ items, owned });
});

app.post("/api/shop/:itemId/buy", auth, (req, res) => {
  const item = db.prepare("SELECT * FROM shop_items WHERE id = ?").get(req.params.itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });

  const already = db
    .prepare("SELECT id FROM purchases WHERE user_id = ? AND item_id = ?")
    .get(req.userId, item.id);
  if (already) return res.status(400).json({ error: "Already owned" });

  const user = getUser(req.userId);
  if (user.gold < item.cost) return res.status(400).json({ error: "Not enough gold" });

  const buy = db.transaction(() => {
    db.prepare("UPDATE users SET gold = gold - ? WHERE id = ?").run(item.cost, user.id);
    db.prepare("INSERT INTO purchases (user_id, item_id) VALUES (?, ?)").run(user.id, item.id);
  });
  buy();

  res.json({ user: publicUser(getUser(user.id)) });
});

// ---------------------------------------------------------------------------
// Public platform stats
app.get("/api/stats", (req, res) => {
  const userCount = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const completedQuestsCount = db.prepare("SELECT COUNT(*) c FROM tasks WHERE completed = 1").get().c;
  res.json({
    totalUsers: userCount,
    questsCompleted: completedQuestsCount,
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Something went wrong on our end" });
});

app.listen(PORT, () => console.log(`Life RPG API running on :${PORT}`));
