import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        flash: {
          "0%": { transform: "scale(1.08)", color: "#6ee7b7" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: { flash: "flash 0.6s ease-out" },
      colors: {
        brand: {
          50: "#eef2ff", 100: "#e0e7ff", 500: "#6366f1",
          600: "#4f46e5", 700: "#4338ca", 900: "#312e81",
        },
      },
    },
  },
  plugins: [],
};
export default config;
