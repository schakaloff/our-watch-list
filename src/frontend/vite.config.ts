import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Send /api calls to the Spring Boot backend so the login cookie works.
    proxy: { "/api": "http://localhost:8080" },
  },
});
