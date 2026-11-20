// Makes the app icons (PNG) and the favicon from docs/branding/catlog-avatar.svg.
// Run it only when the avatar changes: `npm run icons`.
// It needs the Playwright browser (`npx playwright install chromium`) and writes to public/.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const source = await readFile('docs/branding/catlog-avatar.svg', 'utf8');
const BG = /<rect[^>]*fill="(#[0-9a-fA-F]{6})"/.exec(source)?.[1] ?? '#2F6F73';

// Same picture, but with a fixed size, so it can be placed on a page.
const plain = source.replace(/ width="\d+" height="\d+"/, '');

// Maskable icons need the picture inside the middle 80%, because phones cut the corners.
const inner = source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const maskable =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" fill="${BG}"/>` +
  `<g transform="translate(51.2 51.2) scale(0.8)">${inner}</g></svg>`;

await mkdir('public/icons', { recursive: true });
await writeFile('public/favicon.svg', plain);

const browser = await chromium.launch();
const page = await browser.newPage();
const targets = [
  ['public/icons/icon-192.png', 192, plain],
  ['public/icons/icon-512.png', 512, plain],
  ['public/icons/maskable-512.png', 512, maskable],
];
for (const [path, size, markup] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`,
  );
  await page.screenshot({ path });
}
await browser.close();
console.log('Icons written to public/');
