import { useEffect, useState } from "react";
import { api } from "../api";

export default function LandingPage({ onGetStarted, onLogin }) {
  const [demoXp, setDemoXp] = useState(120);
  const [demoLevel, setDemoLevel] = useState(3);
  const [demoGold, setDemoGold] = useState(85);
  const [questDone, setQuestDone] = useState(false);
  const [liveStats, setLiveStats] = useState({ totalUsers: 0, questsCompleted: 0 });

  useEffect(() => {
    api
      .getStats()
      .then((res) => {
        if (res) {
          setLiveStats({
            totalUsers: res.totalUsers || 0,
            questsCompleted: res.questsCompleted || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  function handleCompleteDemoQuest() {
    if (questDone) return;
    setQuestDone(true);
    setDemoXp((prev) => {
      const next = prev + 80;
      if (next >= 200) {
        setDemoLevel((l) => l + 1);
        return next - 200;
      }
      return next;
    });
    setDemoGold((g) => g + 40);
  }

  return (
    <div className="min-h-screen bg-dungeon-900 text-parchment overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dungeon-900/90 backdrop-blur-md border-b border-mystic/20 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl animate-bounce">⚔️</span>
            <span className="font-display text-xl sm:text-2xl font-bold text-gold tracking-wide">
              QUESTLINE
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-parchment/80">
            <a href="#features" className="hover:text-gold transition">Features</a>
            <a href="#how-it-works" className="hover:text-gold transition">How It Works</a>
            <a href="#demo" className="hover:text-gold transition">Try Demo</a>
            <a href="#stats" className="hover:text-gold transition">RPG Stats</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLogin("login")}
              className="px-4 py-2 text-sm font-medium text-parchment/90 hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onGetStarted("signup")}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-mystic to-ember text-white shadow-glow hover:brightness-110 active:scale-95 transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mystic/15 border border-mystic/30 text-mystic text-xs sm:text-sm font-medium mb-8 animate-pulse">
          <span>✨</span> Turn Your Daily Tasks Into An Epic RPG Adventure
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
          Gamify Your Life. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-gold via-ember to-mystic bg-clip-text text-transparent">
            Level Up Every Habit.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-parchment/70 max-w-2xl mx-auto leading-relaxed">
          Transform boring to-do lists into heroic quests. Gain XP, earn gold, boost your Strength & Intellect, and redeem rewards in real life!
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onGetStarted("signup")}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-mystic via-ember to-gold text-dungeon-900 shadow-goldglow hover:scale-105 active:scale-95 transition"
          >
            🔥 Begin Your Quest Now
          </button>
          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-xl rune-panel text-parchment hover:border-gold/50 transition flex items-center justify-center gap-2"
          >
            <span>⚔️</span> Try Interactive Demo
          </a>
        </div>

        {/* Live Hero Card Preview */}
        <div className="mt-16 max-w-4xl mx-auto rune-panel p-6 sm:p-8 shadow-glow border-mystic/40 text-left relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-mystic/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-ember flex items-center justify-center text-2xl shadow-goldglow">
                🛡️
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-gold">Valeros the Diligent</h2>
                <p className="text-xs text-parchment/60">Class: Productivity Knight • Level {demoLevel}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm font-semibold">
              <div className="bg-dungeon-700 px-3 py-1.5 rounded-lg border border-gold/30 text-gold flex items-center gap-1.5">
                <span>🪙</span> {demoGold} Gold
              </div>
              <div className="bg-dungeon-700 px-3 py-1.5 rounded-lg border border-ember/30 text-ember flex items-center gap-1.5">
                <span>🔥</span> 7 Day Streak
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-xpbar">XP Progress</span>
                <span className="text-parchment/70">{demoXp} / 200 XP</span>
              </div>
              <div className="bar-track">
                <div
                  className="h-full bg-gradient-to-r from-xpbar to-mystic transition-all duration-500 rounded-full"
                  style={{ width: `${(demoXp / 200) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-dungeon-700/60 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-parchment/60">🧠 Intellect</div>
                <div className="text-lg font-bold text-purple-400">Lvl 14</div>
              </div>
              <div className="bg-dungeon-700/60 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-parchment/60">⚔️ Strength</div>
                <div className="text-lg font-bold text-red-400">Lvl 10</div>
              </div>
              <div className="bg-dungeon-700/60 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-parchment/60">📜 Wisdom</div>
                <div className="text-lg font-bold text-blue-400">Lvl 12</div>
              </div>
              <div className="bg-dungeon-700/60 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-parchment/60">🛡️ Discipline</div>
                <div className="text-lg font-bold text-gold">Lvl 18</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Banner */}
      <section id="stats" className="py-12 bg-dungeon-800/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-gold">
              {liveStats.questsCompleted.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-parchment/60 mt-1">Quests Conquered</div>
          </div>
          <div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-mystic">
              {liveStats.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-parchment/60 mt-1">Active Adventurers</div>
          </div>
          <div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-ember">100%</div>
            <div className="text-xs sm:text-sm text-parchment/60 mt-1">Real-Time Sync</div>
          </div>
          <div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-xpbar">5.0 ★</div>
            <div className="text-xs sm:text-sm text-parchment/60 mt-1">Verified RPG Engine</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white">
            Built for Heroes Who Want to Achieve More
          </h2>
          <p className="mt-4 text-parchment/70 text-base sm:text-lg">
            Stop relying on willpower alone. Turn productivity into a game you actually look forward to playing every day.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="rune-panel p-8 hover:border-gold/40 transition">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl mb-6">
              ⚔️
            </div>
            <h3 className="font-display text-xl font-bold text-gold mb-3">Quest Management</h3>
            <p className="text-parchment/70 text-sm leading-relaxed">
              Categorize daily tasks into Easy, Medium, Hard, or Boss Level quests. Earn XP and Gold based on difficulty.
            </p>
          </div>

          <div className="rune-panel p-8 hover:border-mystic/40 transition">
            <div className="w-12 h-12 rounded-xl bg-mystic/10 border border-mystic/30 flex items-center justify-center text-2xl mb-6">
              🧙‍♂️
            </div>
            <h3 className="font-display text-xl font-bold text-mystic mb-3">RPG Stat Progression</h3>
            <p className="text-parchment/70 text-sm leading-relaxed">
              Study for exams to level up Intellect. Hit the gym to level up Strength. Every real-life habit builds real stats.
            </p>
          </div>

          <div className="rune-panel p-8 hover:border-ember/40 transition">
            <div className="w-12 h-12 rounded-xl bg-ember/10 border border-ember/30 flex items-center justify-center text-2xl mb-6">
              🪙
            </div>
            <h3 className="font-display text-xl font-bold text-ember mb-3">Real-Life Rewards Shop</h3>
            <p className="text-parchment/70 text-sm leading-relaxed">
              Use gold earned from tasks to buy custom real-world rewards—guilt-free gaming hours, cheat meals, or shopping sprees.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-dungeon-800/40 border-t border-white/5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto rune-panel p-8 sm:p-12 text-center border-gold/30 relative">
          <div className="inline-block px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold uppercase tracking-wider mb-4">
            Interactive Preview
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white mb-4">
            Try Completing a Quest Right Now!
          </h2>
          <p className="text-parchment/70 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Click the quest below to experience how Questline rewards your productivity instantly.
          </p>

          <div className="bg-dungeon-700/80 p-5 rounded-xl border border-white/10 max-w-lg mx-auto flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl">📚</span>
              <div>
                <div className="font-bold text-parchment text-sm sm:text-base">
                  Complete 45-min Deep Focus Session
                </div>
                <div className="text-xs text-parchment/60">Difficulty: Medium • +80 XP, +40 Gold</div>
              </div>
            </div>

            <button
              onClick={handleCompleteDemoQuest}
              disabled={questDone}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                questDone
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default"
                  : "bg-gradient-to-r from-mystic to-ember text-white hover:brightness-110 active:scale-95"
              }`}
            >
              {questDone ? "✓ Completed!" : "Complete Quest"}
            </button>
          </div>

          {questDone && (
            <div className="p-4 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-semibold animate-celebrate">
              🎉 Level Progress Updated! +80 XP & +40 Gold added to Valeros's Hero Stats above!
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white">
            4 Simple Steps to Master Your Habits
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rune-panel relative">
            <div className="text-4xl font-extrabold text-mystic/40 font-display mb-4">01</div>
            <h4 className="font-bold text-lg text-parchment mb-2">Create Your Hero</h4>
            <p className="text-xs text-parchment/70">Pick a hero name and start with base stats.</p>
          </div>
          <div className="p-6 rune-panel relative">
            <div className="text-4xl font-extrabold text-gold/40 font-display mb-4">02</div>
            <h4 className="font-bold text-lg text-parchment mb-2">Add Daily Quests</h4>
            <p className="text-xs text-parchment/70">Set up tasks, habits, and deadlines.</p>
          </div>
          <div className="p-6 rune-panel relative">
            <div className="text-4xl font-extrabold text-ember/40 font-display mb-4">03</div>
            <h4 className="font-bold text-lg text-parchment mb-2">Gain XP & Level Up</h4>
            <p className="text-xs text-parchment/70">Check off tasks to gain XP and level stats.</p>
          </div>
          <div className="p-6 rune-panel relative">
            <div className="text-4xl font-extrabold text-xpbar/40 font-display mb-4">04</div>
            <h4 className="font-bold text-lg text-parchment mb-2">Claim Real Rewards</h4>
            <p className="text-xs text-parchment/70">Spend gold on guilt-free personal rewards.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <footer className="py-20 bg-dungeon-800 border-t border-mystic/30 px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white mb-6">
            Your Legend Starts Today.
          </h2>
          <p className="text-parchment/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Join thousands of adventurers turning their daily routine into an exciting RPG adventure.
          </p>
          <button
            onClick={() => onGetStarted("signup")}
            className="px-10 py-4 text-lg font-extrabold rounded-xl bg-gradient-to-r from-gold via-ember to-mystic text-dungeon-900 shadow-goldglow hover:scale-105 transition"
          >
            ⚔️ Enter Questline Now - It's Free!
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-xs text-parchment/40">
          © {new Date().getFullYear()} Questline LifeRPG. Turn your life into an epic quest.
        </div>
      </footer>
    </div>
  );
}
