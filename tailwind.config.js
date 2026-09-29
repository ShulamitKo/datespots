/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Heebo תומך בעברית ובלטינית; Inter שהיה כאן לא כולל אותיות עבריות
        sans: ['Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        background: "#ffffff",
        foreground: "#1f2937",
        primary: {
          DEFAULT: "#CC1F66", // ניגודיות 5.3:1 מול טקסט לבן (WCAG AA)
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f3f4f6",
          foreground: "#1f2937",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#CC1F66", // ניגודיות 5.3:1 מול טקסט לבן (WCAG AA)
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#e5e7eb",
      },
    },
  },
  plugins: [],
}

