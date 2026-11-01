/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Para GitHub Pages o app fica em https://<usuario>.github.io/<repositorio>/.
// Troque "orca-obra" pelo nome do seu repositório (ou defina VITE_BASE na hora do build).
const NOME_DO_REPOSITORIO = "orca-obra";

export default defineConfig(({ command, isPreview }) => ({
  base: process.env.VITE_BASE ?? (command === "build" || isPreview ? `/${NOME_DO_REPOSITORIO}/` : "/"),
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Orça Obra",
        short_name: "Orça Obra",
        description: "Calcule quanto cobrar em obras elétricas comerciais.",
        lang: "pt-BR",
        theme_color: "#1C2026",
        background_color: "#1C2026",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { chunkSizeWarningLimit: 1200 },
  test: { include: ["src/**/*.test.ts"] },
}));
