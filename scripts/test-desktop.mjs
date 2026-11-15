import { _electron as electron } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import console from 'node:console';
import { URL } from 'node:url';
import { setTimeout } from 'node:timers';
const data = await mkdtemp(path.join(tmpdir(), 'linksunder-desktop-'));
const options = process.env.LINKSUNDER_PACKAGED_EXE
  ? { executablePath: process.env.LINKSUNDER_PACKAGED_EXE, args: [] }
  : { args: ['.'] };
const app = await electron.launch({
  ...options,
  env: { ...process.env, LINKSUNDER_DESKTOP_DATA: data },
  timeout: 45000,
});
try {
  const page = await app.firstWindow({ timeout: 45000 });
  await page.getByRole('heading', { name: 'Build for the unexpected.' }).waitFor();
  const preferences = await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
  );
  assert.equal(preferences.nodeIntegration, false);
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.sandbox, true);
  await page.getByRole('button', { name: 'New test', exact: true }).click();
  await page.getByLabel('Scenario name').fill('Desktop application smoke test');
  await page.getByRole('button', { name: 'Add step' }).click();
  await page.getByLabel('Step 1 selector').fill('#note');
  await page.getByRole('button', { name: 'Run Test', exact: true }).click();
  await page.getByRole('link', { name: 'Download JSON Report' }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('.heading .badge').textContent(), 'pass');
  const origin = new URL(page.url()).origin;
  const runs = await page.evaluate(async () => (await fetch('/api/runs')).json());
  assert.equal(runs.length, 1);
  assert.ok(runs[0].duration > 0);
  await app.close();
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await assert.rejects(fetch(origin + '/api/runs'), 'Closing the app must stop its local server');
  console.log(
    'Desktop smoke passed: app window, isolated renderer, real browser assertion, report and engine shutdown.',
  );
} finally {
  await app.close().catch(() => {});
  if (
    !path.resolve(data).startsWith(path.resolve(tmpdir()) + path.sep) ||
    !path.basename(data).startsWith('linksunder-desktop-')
  )
    assert.fail('Unexpected test directory');
  await rm(data, { recursive: true, force: true });
}
