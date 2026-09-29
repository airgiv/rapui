import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Preview site
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist-site" },
});
