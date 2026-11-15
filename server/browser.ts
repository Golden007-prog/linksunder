import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
export function browserOptions() {
  if (process.env.LINKSUNDER_BROWSER) return { executablePath: process.env.LINKSUNDER_BROWSER };
  if (existsSync(chromium.executablePath())) return {};
  if (process.platform === 'win32') {
    for (const executablePath of [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ])
      if (existsSync(executablePath)) return { executablePath };
  }
  return {};
}
