import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        // Base
        background: "#F8F7F4",
        foreground: "#1A1A1A",

        // VIA7 Brand
        primary: "#C3984C",
        "primary-hover": "#B0863F",
        "primary-dark": "#8E6B2F",

        // Neutral
        black: "#1A1A1A",
        white: "#FFFFFF",

        // Gray
        border: "#E6E2DA",
        muted: "#6B7280",
        surface: "#FFFFFF",

        // Status
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        info: "#2563EB",
      },

      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },

      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,.08)",
        modal: "0 12px 40px rgba(0,0,0,.12)",
        button: "0 4px 12px rgba(195,152,76,.25)",
      },

      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },

      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },

  plugins: [],
} satisfies Config;