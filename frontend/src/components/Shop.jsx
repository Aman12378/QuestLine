import { useEffect, useState } from "react";
import { api } from "../api";

export default function Shop({ user, setUser, onClose }) {
  const [items, setItems] = useState([]);
  const [owned, setOwned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    api
      .shop()
      .then((res) => {
        setItems(res.items);
        setOwned(res.owned);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function buy(item) {
    setError("");
    setBuyingId(item.id);
    try {
      const res = await api.buyItem(item.id);
      setUser(res.user);
      setOwned((o) => [...o, item.id]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Shop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rune-panel w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-gold">The Shop</h2>
          <button
            onClick={onClose}
            aria-label="Close shop"
            className="text-parchment/50 hover:text-parchment px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-parchment/70">
          <span className="text-lg">🪙</span>
          <span className="font-semibold text-gold">{user.gold}</span>
          <span>gold available</span>
        </div>

        {error && (
          <p role="alert" className="text-sm text-hp bg-hp/10 border border-hp/30 rounded-md px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-dungeon-700 animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const isOwned = owned.includes(item.id);
              const canAfford = user.gold >= item.cost;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-dungeon-700/60 p-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-parchment font-medium">{item.name}</p>
                    <p className="text-parchment/50 text-xs">{item.description}</p>
                  </div>
                  <button
                    onClick={() => buy(item)}
                    disabled={isOwned || !canAfford || buyingId === item.id}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition
                      ${
                        isOwned
                          ? "bg-emerald-500/20 text-emerald-300 cursor-default"
                          : canAfford
                          ? "bg-gold text-dungeon-900 hover:brightness-110 active:scale-[0.97]"
                          : "bg-dungeon-600 text-parchment/30 cursor-not-allowed"
                      }`}
                  >
                    {isOwned ? "Owned" : buyingId === item.id ? "…" : `${item.cost}g`}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
