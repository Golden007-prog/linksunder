import { spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { existsSync } from 'node:fs';
// A desktop release must include the browser. Never silently ship a system-browser dependency.
const browserPath = path.resolve('build/browsers');
process.env.PLAYWRIGHT_BROWSERS_PATH = browserPath;
const result = spawnSync(
  process.execPath,
  ['node_modules/playwright/cli.js', 'install', 'chromium', '--no-shell'],
  {
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserPath },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
const { chromium } = await import('playwright');
const browser = await chromium.launch({
  headless: true,
  executablePath: chromium.executablePath(),
});
await browser.close();
if (!existsSync(browserPath)) throw new Error('Bundled browser directory is missing');
