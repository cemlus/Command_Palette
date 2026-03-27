import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
        name: "cmdPalette",
        inlineDynamicImports: true,
      },
    },
  },
});