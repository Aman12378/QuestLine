import { useEffect, useState } from "react";
import { api, setToken } from "../api";
import Shop from "./Shop";

const ATTRS = [
  { key: "intellect", label: "Intellect", icon: "🧠", color: "bg-blue-400" },
  { key: "strength", label: "Strength", icon: "💪", color: "bg-red-400" },
  { key: "wisdom", label: "Wisdom", icon: "📜", color: "bg-amber-400" },
  { key: "discipline", label: "Discipline", icon: "🛡️", color: "bg-emerald-400" },
  { key: "creativity", label: "Creativity", icon: "🎨", color: "bg-fuchsia-400" },
];

const DIFF_META = {
  easy: { label: "Easy", xp: 20, gold: 5, color: "text-emerald-300 border-emerald-400/40" },
  medium: { label: "Medium", xp: 45, gold: 12, color: "text-amber-300 border-amber-400/40" },
  hard: { label: "Hard", xp: 90, gold: 25, color: "text-red-300 border-red-400/40" },
};

export default function Dashboard({ user, setUser }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", attribute: "discipline", difficulty: "easy" });
  const [toast, setToast] = useState(null); // { text, kind }
  const [celebrateLevel, setCelebrateLevel] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshTasks();
  }, []);

  async function refreshTasks() {
    setLoadingTasks(true);
    try {
      const { tasks } = await api.listTasks();
      setTasks(tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTasks(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    // optimistic: show a temp task immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = { id: tempId, ...newTask, completed: 0, created_at: new Date().toISOString() };
    setTasks((t) => [optimisticTask, ...t]);
    setNewTask({ title: "", attribute: "discipline", difficulty: "easy" });
    setShowForm(false);

    try {
      const { task } = await api.createTask(optimisticTask);
      setTasks((t) => t.map((x) => (x.id === tempId ? task : x)));
    } catch (err) {
      setTasks((t) => t.filter((x) => x.id !== tempId));
      setError(err.message);
    }
  }

  async function completeTask(task) {
    // optimistic UI: mark complete instantly, roll back if server disagrees
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: 1 } : x)));
    try {
      const res = await api.completeTask(task.id);
      setUser(res.user);
      setToast({
        text: `+${res.reward.xp} XP  ·  +${res.reward.gold} gold  ·  ${ATTRS.find((a) => a.key === res.reward.attribute)?.icon} +${res.reward.amount}`,
      });
      if (res.leveledUp) {
        setCelebrateLevel(true);
        setTimeout(() => setCelebrateLevel(false), 900);
      }
      setTimeout(() => setToast(null), 2200);
    } catch (err) {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: 0 } : x)));
      setError(err.message);
    }
  }

  async function removeTask(id) {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== id));
    try {
      await api.deleteTask(id);
    } catch (err) {
      setTasks(prev);
      setError(err.message);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        try {
          const res = await api.updateAvatar(dataUrl);
          setUser(res.user);
          setError("");
          setToast({ text: "Profile photo updated! ✨" });
          setTimeout(() => setToast(null), 2200);
        } catch (err) {
          setError(err.message);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const xpPct = Math.min(100, Math.round((user.xp / user.xp_to_next) * 100));

  return (
    <div className="min-h-screen pb-20">
      {/* Header / character panel */}
      <header className="rune-panel m-4 sm:m-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar container with photo upload */}
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gold/60 bg-dungeon-700 flex items-center justify-center text-3xl shadow-goldglow">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span>🛡️</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-mystic hover:bg-mystic/90 text-white p-1.5 rounded-full text-xs shadow-md cursor-pointer hover:scale-110 transition border border-dungeon-900"
                title="Upload Profile Photo"
              >
                📷
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div>
              <p className="text-parchment/50 text-xs uppercase tracking-wider">Welcome back</p>
              <h1 className="font-display text-2xl sm:text-3xl text-gold">{user.username}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-parchment/70">
                <span className={`inline-flex items-center gap-1 ${celebrateLevel ? "animate-celebrate" : ""}`}>
                  🏵️ Level {user.level}
                </span>
                <span className="inline-flex items-center gap-1">🔥 {user.streak_count}-day streak</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rune-panel px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🪙</span>
              <span className="font-semibold text-gold">{user.gold}</span>
            </div>
            <button
              onClick={() => setShowShop(true)}
              className="px-4 py-2 rounded-md bg-dungeon-700 border border-mystic/30 text-sm hover:border-mystic transition"
            >
              Shop
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-md text-sm text-parchment/50 hover:text-parchment transition"
            >
              Log out
            </button>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-parchment/60 mb-1">
            <span>XP</span>
            <span>
              {user.xp} / {user.xp_to_next}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="h-full bg-gradient-to-r from-mystic to-xpbar transition-all duration-700 ease-out shimmer-bg"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {ATTRS.map((a) => (
            <div key={a.key} className="rune-panel px-3 py-2">
              <div className="flex items-center justify-between text-xs text-parchment/60">
                <span>
                  {a.icon} {a.label}
                </span>
                <span className="font-semibold text-parchment">{user.attributes[a.key]}</span>
              </div>
              <div className="bar-track h-1.5 mt-1.5">
                <div
                  className={`h-full ${a.color} transition-all duration-500`}
                  style={{ width: `${Math.min(100, user.attributes[a.key] * 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Quests */}
      <main className="mx-4 sm:mx-6 space-y-4">
        {error && (
          <p role="alert" className="text-sm text-hp bg-hp/10 border border-hp/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-parchment">Active Quests</h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-mystic to-ember text-white text-sm font-medium hover:brightness-110 active:scale-[0.98] transition"
          >
            {showForm ? "Cancel" : "+ New Quest"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={addTask} className="rune-panel p-4 space-y-3">
            <div>
              <label htmlFor="qtitle" className="block text-sm text-parchment/70 mb-1">
                Quest title
              </label>
              <input
                id="qtitle"
                required
                autoFocus
                value={newTask.title}
                onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 focus:border-mystic outline-none"
                placeholder="Read 20 pages of a book"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qattr" className="block text-sm text-parchment/70 mb-1">
                  Attribute
                </label>
                <select
                  id="qattr"
                  value={newTask.attribute}
                  onChange={(e) => setNewTask((t) => ({ ...t, attribute: e.target.value }))}
                  className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 focus:border-mystic outline-none"
                >
                  {ATTRS.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.icon} {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="qdiff" className="block text-sm text-parchment/70 mb-1">
                  Difficulty
                </label>
                <select
                  id="qdiff"
                  value={newTask.difficulty}
                  onChange={(e) => setNewTask((t) => ({ ...t, difficulty: e.target.value }))}
                  className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 focus:border-mystic outline-none"
                >
                  {Object.entries(DIFF_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label} (+{meta.xp} XP, +{meta.gold}g)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-md bg-mystic text-white font-medium hover:brightness-110 transition"
            >
              Add to Questlog
            </button>
          </form>
        )}

        {loadingTasks ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rune-panel h-16 animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 && done.length === 0 ? (
          <div className="rune-panel p-8 text-center text-parchment/60">
            <p className="text-3xl mb-2">🗺️</p>
            <p>No quests yet. Add your first one to start earning XP.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pending.map((task) => (
              <TaskRow key={task.id} task={task} onComplete={completeTask} onDelete={removeTask} />
            ))}
          </ul>
        )}

        {done.length > 0 && (
          <details className="rune-panel p-4">
            <summary className="cursor-pointer text-parchment/60 text-sm select-none">
              Completed ({done.length})
            </summary>
            <ul className="space-y-2 mt-3">
              {done.map((task) => (
                <TaskRow key={task.id} task={task} onComplete={completeTask} onDelete={removeTask} />
              ))}
            </ul>
          </details>
        )}
      </main>

      {/* Reward toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rune-panel px-5 py-3 shadow-goldglow border-gold/40 text-gold font-medium animate-celebrate"
        >
          {toast.text}
        </div>
      )}

      {showShop && <Shop user={user} setUser={setUser} onClose={() => setShowShop(false)} />}
    </div>
  );
}

function TaskRow({ task, onComplete, onDelete }) {
  const attr = ATTRS.find((a) => a.key === task.attribute) || ATTRS[3];
  const diff = DIFF_META[task.difficulty] || DIFF_META.easy;

  return (
    <li className="rune-panel p-3 sm:p-4 flex items-center gap-3">
      <button
        onClick={() => !task.completed && onComplete(task)}
        disabled={!!task.completed}
        aria-label={task.completed ? `${task.title} completed` : `Mark ${task.title} complete`}
        className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition
          ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-mystic/50 hover:border-mystic hover:bg-mystic/10"}`}
      >
        {task.completed ? "✓" : ""}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`truncate ${task.completed ? "line-through text-parchment/40" : "text-parchment"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs">
          <span className="text-parchment/50">
            {attr.icon} {attr.label}
          </span>
          <span className={`px-1.5 py-0.5 rounded border ${diff.color}`}>{diff.label}</span>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        aria-label={`Delete quest ${task.title}`}
        className="shrink-0 text-parchment/30 hover:text-hp transition px-2"
      >
        ✕
      </button>
    </li>
  );
}
