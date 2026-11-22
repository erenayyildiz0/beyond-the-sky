/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * PWA: derlemeden sonra dist/sw.js'i yazar (şablon: pwa/sw.js). Kabuk listesi dist'teki veri dışı dosyalardır;
 * önbellek sürümleri içerikten özetlenir, böylece veri değişmedikçe kullanıcı 26 MB'ı yeniden indirmez.
 */
function pwa(): Plugin {
  let outDir = "dist";
  return {
    name: "bts-pwa",
    apply: "build",
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const files = (readdirSync(outDir, { recursive: true, withFileTypes: true }) as import("node:fs").Dirent[])
        .filter(d => d.isFile()).map(d => relative(outDir, join(d.parentPath, d.name)).split("\\").join("/"))
        .filter(f => f !== "sw.js").sort();
      const digest = (list: string[]) => {
        const h = createHash("sha256");
        for (const f of list) h.update(f).update(readFileSync(join(outDir, f)));
        return h.digest("hex").slice(0, 12);
      };
      const data = files.filter(f => f.startsWith("data/"));
      const shell = files.filter(f => !f.startsWith("data/"));
      const sw = readFileSync("pwa/sw.js", "utf8")
        .replace("__SHELL__", JSON.stringify(["./", ...shell.map(f => `./${f}`)]))
        .replace("__SHELL_VER__", digest(shell))
        .replace("__DATA_VER__", digest(data));
      writeFileSync(join(outDir, "sw.js"), sw);
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: "./",                                   // GitHub Pages alt yolunda da çalışsın
  plugins: [pwa(), ...(mode === "https" ? [basicSsl()] : [])],
  server: { host: true },                       // telefondan erişim için
  build: {
    target: "es2020", assetsInlineLimit: 0, chunkSizeWarningLimit: 600,
    // three.js ayrı parça (~560 KB): uygulama değişince tarayıcı önbelleğindeki three.js yeniden indirilmez
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: "three", test: /node_modules[\\/]three[\\/]/ }] } } },
  },
  test: { include: ["tests/**/*.test.ts"] },
}));
