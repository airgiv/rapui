import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Library build: `npm run build:lib` -> dist/index.js, dist/fonts.js, dist/rapui.css
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // public/ holds the site's favicon and preview image — not part of the package
  publicDir: false,
  build: {
    lib: {
      entry: {
        index: "src/rapui/index.ts",
        fonts: "src/rapui/fonts.ts",
        icons: "src/rapui/icons.tsx",
        // the stylesheet: Tailwind theme + utilities used by the components, no preflight
        styles: "src/rapui/styles.ts",
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: "rapui",
    },
    rollupOptions: {
      // every runtime dependency stays external: the consumer installs them
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^clsx/, /^class-variance-authority/, /^tailwind-merge/, /^@fontsource/, /^framer-motion/, /^liquid-gooey/, /^@hugeicons/, /^@solar-icons/, /^radix-ui/, /^@radix-ui/, /^react-day-picker/, /^cmdk/, /^sonner/, /^vaul/, /^input-otp/, /^embla-carousel/, /^react-resizable-panels/, /^@tanstack/, /^recharts/, /^date-fns/],
      // one file per module, so an app's bundler keeps only the components it imports
      // (a single index.js made every app ship all of them, recharts and the calendar included)
      output: {
        preserveModules: true,
        preserveModulesRoot: "src/rapui",
        entryFileNames: "[name].js",
      },
    },
  },
});
