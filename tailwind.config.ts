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
        ink: "#14213d",
        flame: "#e94f37",
        copper: "#c46f32",
        frost: "#f4f8fb",
        graphite: "#24303f",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(20, 33, 61, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
