import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library build: `npm run build:lib` -> dist/index.js, dist/fonts.js, dist/rapui.css
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: "src/rapui/index.ts",
        fonts: "src/rapui/fonts.ts",
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: "rapui",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", /^@fontsource/, /^framer-motion/, /^lucide-react/],
    },
  },
});
