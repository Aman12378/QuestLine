/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#f3e6cf",
        ink: "#2a1e14",
        ember: "#e0862f",
        gold: "#d4af37",
        dungeon: {
          900: "#0e0a12",
          800: "#171019",
          700: "#231827",
          600: "#33223a",
        },
        mystic: "#8b5cf6",
        hp: "#e0453a",
        xpbar: "#4fd1c5",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.5)",
        goldglow: "0 0 16px rgba(212, 175, 55, 0.55)",
      },
      keyframes: {
        popcelebrate: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        floatup: {
          "0%": { transform: "translateY(0)", opacity: 1 },
          "100%": { transform: "translateY(-40px)", opacity: 0 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        celebrate: "popcelebrate 0.4s ease-out",
        floatup: "floatup 1s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
