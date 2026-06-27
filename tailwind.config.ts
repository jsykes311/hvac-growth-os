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
        ink: "#071b33",
        flame: "#8a2432",
        copper: "#9f3444",
        frost: "#f6f7f9",
        graphite: "#243244",
      },
      boxShadow: {
        soft: "0 22px 60px rgba(7, 27, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
