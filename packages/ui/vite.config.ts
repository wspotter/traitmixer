import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 4401,
    strictPort: true
  },
  build: {
    outDir: "dist",
  },
});
