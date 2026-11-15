# Launch drafts — not posted

## Show HN

Show HN: LinkSunder — a local UI for testing what survives a network failure

I built a small open-source Playwright tool for a familiar bug: a form clears your
draft before its request succeeds. LinkSunder runs a broken and fixed example,
then lets you build your own offline/API-failure scenarios without writing code.
It reports PASS/FAIL only for explicit assertions, exports offline HTML/JSON, and
runs locally without an account or AI service. It's an early 0.1 release, with
Chromium, CSS selectors and one active run. Feedback on useful assertions and the
scenario workflow would be especially welcome.

## Developer community / Reddit

I made LinkSunder to reproduce lost-draft bugs when the network drops. It has a
local dashboard over Playwright, ordered scenario steps, HTTP failure/delay rules,
and a one-click broken-vs-fixed demo. No assertions means observations, not a health
score. It's MIT licensed and designed for apps you own. I'd appreciate feedback on
the workflow and what error states you most often forget to test.

Check each community's self-promotion rules before posting. Add the verified
repository URL only after publication. No social post has been submitted.
