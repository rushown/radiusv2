/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        choc: {
          950: "#0f0806",
          900: "#1c0f0a",
          850: "#231410",
          800: "#2e1a14",
          750: "#3a211a",
          700: "#4a2c23",
          600: "#5e3a2e",
          500: "#7a4e3f",
          400: "#9a6a58",
          300: "#b88a76",
          200: "#d4aa98",
          100: "#ecddd6",
          50:  "#f8f2ef",
        },
        gold: {
          700: "#b07d00",
          600: "#d49800",
          500: "#f0aa00",
          400: "#f5c030",
          300: "#f9d468",
          200: "#fce8a8",
        },
        ember: {
          600: "#c0392b",
          500: "#e74c3c",
          400: "#ff6b5b",
        },
        jade: {
          600: "#1a6b4a",
          500: "#27ae60",
          400: "#4cd98a",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body:    ["'Outfit'", "system-ui", "sans-serif"],
        mono:    ["'Fira Code'", "monospace"],
      },
      animation: {
        "shimmer":      "shimmer 1.8s linear infinite",
        "fade-up":      "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":      "fadeIn 0.35s ease forwards",
        "scale-in":     "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-up":     "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-gold":   "pulseGold 2.4s ease-in-out infinite",
        "spin-slow":    "spin 2.5s linear infinite",
        "glow-pulse":   "glowPulse 3s ease-in-out infinite",
        "float":        "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(240,170,0,0.25)" },
          "50%":     { boxShadow: "0 0 0 10px rgba(240,170,0,0)" },
        },
        glowPulse: {
          "0%,100%": { opacity: "0.4" },
          "50%":     { opacity: "0.9" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-12px)" },
        },
      },
      boxShadow: {
        "gold-sm":  "0 0 16px rgba(240,170,0,0.12), 0 1px 3px rgba(0,0,0,0.4)",
        "gold-md":  "0 0 32px rgba(240,170,0,0.2),  0 2px 8px rgba(0,0,0,0.5)",
        "gold-lg":  "0 0 60px rgba(240,170,0,0.28), 0 4px 24px rgba(0,0,0,0.6)",
        "card":     "0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover":"0 1px 3px rgba(0,0,0,0.5), 0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        "nav":      "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.4)",
        "modal":    "0 8px 60px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "shimmer-dark": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.035) 40%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.035) 60%, transparent 100%)",
        "grain":        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
        "hero-glow":    "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90,55,40,0.5) 0%, transparent 70%)",
        "card-gradient":"linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
        "gold-gradient":"linear-gradient(135deg, #f0aa00 0%, #d49800 100%)",
        "page-bg":      "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(74,44,35,0.6) 0%, transparent 60%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.75rem",
      },
    },
  },
  plugins: [],
};
