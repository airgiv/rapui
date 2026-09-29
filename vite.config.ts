import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Preview site
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // relative asset paths, so the built site works from any folder or host
  base: "./",
  build: { outDir: "dist-site" },
});
