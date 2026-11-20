/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Strict policy: only our own files, no network after load.
// GitHub Pages cannot send headers, so the policy lives in a <meta> tag.
// It is added at build time only, because the dev server needs inline scripts.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "manifest-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'catlog-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!--CSP-->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // Pages serves the app from /<repo>/. Set VITE_BASE when you deploy a fork under another name.
  const base = loadEnv(mode, '.', 'VITE_')['VITE_BASE'] ?? '/catlog/';
  return {
    base,
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    plugins: [
      preact(),
      cspPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        // Registered from src/main.tsx, so no inline script is needed.
        injectRegister: false,
        // Only app code is cached. User data stays in IndexedDB.
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
        },
        manifest: {
          name: 'catlog',
          short_name: 'catlog',
          description: 'A private health diary for your cat. Your data stays on your phone.',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#2f6f73',
          background_color: '#fbf8f3',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    build: {
      target: 'es2022',
      sourcemap: false,
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
