import { useEffect, useState } from "react";
import { api, setToken } from "./api";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [view, setView] = useState("landing"); // "landing" | "auth"
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"

  useEffect(() => {
    const token = localStorage.getItem("questline_token");
    if (!token) {
      setCheckingSession(false);
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-parchment/50 text-sm animate-pulse">Loading your realm…</div>
      </div>
    );
  }

  if (!user) {
    if (view === "auth") {
      return (
        <Auth
          onAuthed={setUser}
          initialMode={authMode}
          onBack={() => setView("landing")}
        />
      );
    }

    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode("signup");
          setView("auth");
        }}
        onLogin={() => {
          setAuthMode("login");
          setView("auth");
        }}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      setUser={setUser}
      onLogout={() => {
        setToken(null);
        setUser(null);
        setView("landing");
      }}
    />
  );
}

