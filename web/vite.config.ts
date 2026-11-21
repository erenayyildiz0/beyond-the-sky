/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => ({
  base: "./",                                   // GitHub Pages alt yolunda da çalışsın
  plugins: mode === "https" ? [basicSsl()] : [],
  server: { host: true },                       // telefondan erişim için
  build: { target: "es2020", assetsInlineLimit: 0 },
  test: { include: ["tests/**/*.test.ts"] },
}));
