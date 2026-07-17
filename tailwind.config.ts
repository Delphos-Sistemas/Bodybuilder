import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        iron: "#090909",
        graphite: "#171717",
        bronze: "#A9783F",
        "bronze-light": "#C89B62",
        sand: "#D5C2A5",
        parchment: "#F1EDE5",
        military: "#4C513D",
        danger: "#C94A4A"
      },
      fontFamily: {
        display: ["Arial Narrow", "Impact", "system-ui", "sans-serif"],
        sans: ["system-ui", "sans-serif"]
      },
      boxShadow: {
        bronze: "0 18px 60px rgba(169, 120, 63, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
