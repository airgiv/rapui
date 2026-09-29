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
        icons: "src/rapui/icons.tsx",
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: "rapui",
    },
    rollupOptions: {
      // every runtime dependency stays external: the consumer installs them
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@fontsource/, /^framer-motion/, /^@phosphor-icons/, /^@solar-icons/, /^radix-ui/, /^@radix-ui/, /^react-day-picker/, /^cmdk/, /^sonner/, /^vaul/, /^input-otp/, /^embla-carousel/, /^react-resizable-panels/, /^@tanstack/, /^recharts/, /^date-fns/],
    },
  },
});
