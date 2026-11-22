/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => ({
  base: "./",                                   // GitHub Pages alt yolunda da çalışsın
  plugins: mode === "https" ? [basicSsl()] : [],
  server: { host: true },                       // telefondan erişim için
  build: {
    target: "es2020", assetsInlineLimit: 0, chunkSizeWarningLimit: 600,
    // three.js ayrı parça (~560 KB): uygulama değişince tarayıcı önbelleğindeki three.js yeniden indirilmez
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: "three", test: /node_modules[\\/]three[\\/]/ }] } } },
  },
  test: { include: ["tests/**/*.test.ts"] },
}));
