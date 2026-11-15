import type { Run } from '../shared/schema.js';
export function escapeHtml(v: unknown) {
  return String(v).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
export function htmlReport(run: Run) {
  const e = escapeHtml;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>LinkSunder report</title><style>body{font:16px system-ui;max-width:900px;margin:50px auto;padding:24px;background:#10131b;color:#e8eaf3}h1{color:#a8a4ff}li{padding:10px;border-bottom:1px solid #34384a}img{max-width:100%;border-radius:12px}small{color:#b7bdce}</style><h1>LinkSunder / ${e(run.status.toUpperCase())}</h1><h2>${e(run.name)}</h2><p>${e(run.started)} · ${run.duration} ms · ${run.passed}/${run.assertions} assertions passed</p><p>${e(run.error || '')}</p><p>${e(run.advice || 'Only explicitly configured assertions determine PASS or FAIL.')}</p><ol>${run.steps.map((s) => `<li>${e(s.action)} · ${e(s.status)} · ${e(s.message)} <small>${s.duration} ms</small></li>`).join('')}</ol>${run.screenshots.map((s) => `<img alt="Captured test page" src="${s}">`).join('')}<p>Local report. Request bodies, headers, cookies, field values and full target URLs are not logged. Screenshots may contain page content.</p></html>`;
}
