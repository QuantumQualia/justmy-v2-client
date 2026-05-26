import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  /** Browser IIFE: dependencies may read `process.env.NODE_ENV`; `process` does not exist on `window`. */
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(dirname, "src/boot.tsx"),
      name: "AskSkyEmbedBoot",
      formats: ["iife"],
      fileName: () => "asksky.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        /** Minimal Node `process` stub — some bundled deps still touch `process.env.NODE_ENV`. */
        banner: 'var process={env:{NODE_ENV:"production"}};',
      },
    },
    target: "es2022",
    emptyOutDir: true,
    outDir: "dist",
  },
});
