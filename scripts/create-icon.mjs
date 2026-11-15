import { chromium } from 'playwright';
import { Buffer } from 'node:buffer';
import { readFile, writeFile } from 'node:fs/promises';
import { browserOptions } from '../dist/server/browser.js';
const browser = await chromium.launch(browserOptions());
try {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  const svg = await readFile('desktop/icon.svg', 'utf8');
  await page.setContent('<style>body{margin:0}svg{display:block}</style>' + svg);
  await page.screenshot({ path: 'desktop/icon.png', omitBackground: true });
  await page.setViewportSize({ width: 256, height: 256 });
  await page.addStyleTag({ content: 'svg{width:256px;height:256px}' });
  const png = await page.screenshot({ omitBackground: true });
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await writeFile('desktop/icon.ico', Buffer.concat([header, png]));
} finally {
  await browser.close();
}
