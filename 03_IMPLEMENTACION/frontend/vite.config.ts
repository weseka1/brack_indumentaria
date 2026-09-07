import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // ENLATADO: en local queda "/", y el deploy a wsk.com.ar/demos/<slug>
  // se buildea con DEMO_BASE=/demos/yague/ npx vite build
  base: process.env.DEMO_BASE || "/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
