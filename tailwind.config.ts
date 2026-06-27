import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#063944",
        flame: "#19b8b5",
        copper: "#087b84",
        frost: "#f3faf8",
        graphite: "#5d7175",
      },
      boxShadow: {
        soft: "0 22px 58px rgba(6, 57, 68, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
