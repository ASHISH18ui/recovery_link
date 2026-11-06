import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#F6F8FB",
          dark: "#0B0F17",
        },
        brand: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#0EA5A4",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        accent: {
          500: "#2563EB",
          600: "#1D4ED8",
        },
        risk: {
          low: {
            text: "#059669",
            bg: "#ECFDF5",
            border: "#A7F3D0",
            badge: "#D1FAE5",
            dot: "#10B981"
          },
          medium: {
            text: "#D97706",
            bg: "#FFFBEB",
            border: "#FDE68A",
            badge: "#FEF3C7",
            dot: "#F59E0B"
          },
          high: {
            text: "#E11D48",
            bg: "#FFF1F2",
            border: "#FECDD3",
            badge: "#FFE4E6",
            dot: "#F43F5E"
          },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        card: "0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.03)",
        "card-hover": "0 8px 25px -4px rgba(14, 165, 164, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }
    },
  },
  plugins: [],
};
export default config;
