# Local verification

Validated on Windows with portable Node.js 24 LTS and the installed Google Chrome
through Playwright. No production website or private user data was used.

- Install and setup completed. Browser CDN returned a regional 403; setup supports
  and verifies installed Chrome/Edge on Windows as an alternative.
- Lint, TypeScript and production build passed.
- 24 unit/integration tests passed, including real offline Broken FAIL / Fixed PASS,
  HTTP 503 injection, delayed request, cancellation and assertion-free OBSERVED.
- Dashboard E2E covers demo, JSON/HTML exports, history, dark/light themes, mobile
  overflow, navigation, no-code assertion, invalid inputs, CSRF and serialization.
- Automated axe WCAG A/AA checks on the overview in both themes passed after fixing
  light-theme guide-text contrast. This is partial automated coverage, not a formal
  WCAG conformance certification or a full assistive-technology audit.
- Production `npm run start` served the dashboard and API with HTTP 200.
- npm audit reported zero vulnerabilities after dependency updates.

Real screenshots are in screenshots/. UI screenshots were inspected at desktop
1280px and mobile 390px widths. CI results must be checked independently on GitHub.
