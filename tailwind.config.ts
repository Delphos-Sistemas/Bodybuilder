import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        iron: "#0B0A09",
        graphite: "#171513",
        steel: "#221F1B",
        line: "#34302A",
        bronze: "#B07D45",
        "bronze-light": "#D3A46B",
        sand: "#CDBFA9",
        parchment: "#F3EEE6",
        muted: "#9C9284",
        danger: "#E06A5B",
        ok: "#7FB77E"
      },
      fontFamily: {
        display: ["\"Arial Narrow\"", "\"Roboto Condensed\"", "Impact", "system-ui", "sans-serif"],
        sans: ["system-ui", "-apple-system", "\"Segoe UI\"", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
