# LinkSunder v0.1.0

First release of a local network-resilience lab powered by Playwright.

Build ordered scenarios, take a browser offline, inject HTTP 503 responses, delay
selected requests, and evaluate explicit element/value assertions. The included
Broken/Fixed demo reproduces and detects a lost-draft bug with real Chromium runs.

Includes dark/light responsive dashboard, real history, cancellation, opt-in masked
screenshots and standalone HTML/JSON reports. Requires Node.js 22.12+ and Chromium.

Known limits: trusted local use only; Chromium only; one active run and one API
fault rule; CSS selectors; no browser recorder or login profile; DNS validation is
not an absolute sandbox; selected-request delay is not mobile-network emulation.

Run `npm install`, `npm run setup`, `npm run dev`. No npm package is published.
