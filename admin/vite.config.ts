import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <- this enables Tailwind in Vite
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.API_BASE_URL": JSON.stringify(
      process.env.API_BASE_URL || "http://localhost:8000",
    ),
  },
});
