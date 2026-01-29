import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  base : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL || "http://localhost:8000",
    ),
  },
  server: {
    allowedHosts: [
      "polymer-thing-promise-commentary.trycloudflare.com",
      "192.168.1.100",
      ".example.com", // Allows example.com and all subdomains
    ],
  },
});
