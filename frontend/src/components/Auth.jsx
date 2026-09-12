import { useState } from "react";
import { api, setToken } from "../api";

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ username: "", email: "", password: "", emailOrUsername: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "signup"
          ? await api.signup({ username: form.username, email: form.email, password: form.password })
          : await api.login({ emailOrUsername: form.emailOrUsername, password: form.password });
      setToken(result.token);
      onAuthed(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="font-display text-3xl text-gold tracking-wide">Questline</h1>
          <p className="text-parchment/60 mt-2 text-sm">
            Every task is a quest. Every habit levels you up.
          </p>
        </div>

        <div className="rune-panel p-6 sm:p-8 shadow-glow">
          <div className="flex mb-6 rounded-md overflow-hidden border border-mystic/30" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "login" ? "bg-mystic text-white" : "bg-dungeon-700 text-parchment/70 hover:text-parchment"
              }`}
              onClick={() => setMode("login")}
            >
              Enter Realm
            </button>
            <button
              role="tab"
              aria-selected={mode === "signup"}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-mystic text-white" : "bg-dungeon-700 text-parchment/70 hover:text-parchment"
              }`}
              onClick={() => setMode("signup")}
            >
              Create Hero
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="username" className="block text-sm text-parchment/70 mb-1">
                  Hero name
                </label>
                <input
                  id="username"
                  required
                  minLength={2}
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 text-parchment placeholder:text-parchment/30 focus:border-mystic outline-none"
                  placeholder="Ashborn the Diligent"
                />
              </div>
            )}

            {mode === "signup" ? (
              <div>
                <label htmlFor="email" className="block text-sm text-parchment/70 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 text-parchment placeholder:text-parchment/30 focus:border-mystic outline-none"
                  placeholder="you@example.com"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm text-parchment/70 mb-1">
                  Email or hero name
                </label>
                <input
                  id="emailOrUsername"
                  required
                  value={form.emailOrUsername}
                  onChange={(e) => update("emailOrUsername", e.target.value)}
                  className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 text-parchment placeholder:text-parchment/30 focus:border-mystic outline-none"
                  placeholder="you@example.com"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm text-parchment/70 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-md bg-dungeon-700 border border-white/10 px-3 py-2 text-parchment placeholder:text-parchment/30 focus:border-mystic outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-hp bg-hp/10 border border-hp/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-gradient-to-r from-mystic to-ember text-white font-medium tracking-wide hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? "Summoning…" : mode === "signup" ? "Begin Your Legend" : "Enter Realm"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
