import { useEffect, useState } from "react";
import { api, setToken } from "./api";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

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
    return <Auth onAuthed={setUser} />;
  }

  return <Dashboard user={user} setUser={setUser} />;
}
