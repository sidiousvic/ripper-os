# Temporary launch-readiness backlog

Updated 2026-09-05 at v0.2.7. Work through one focused item at a time; validate, bump the version, write release notes, tag, and push each change. Remove this tracker once the launch pass is complete. This is a work queue, not a changelog.

The import path is browser-only, production dependencies have zero audit findings, snapshot restore is validated, and the replacement-render bug is fixed. The remaining work is ordered by risk to real users and deployment confidence.

| # | Priority | Task | Evidence / acceptance criteria |
| --- | --- | --- | --- |
| 1 | Before sharing | Prevent stale upload and AI responses from updating another dataset. | Complete in v0.2.9. AI requests are abortable on replacement, clear, and unmount; revision plus abort guards reject stale success and error paths, and a focused request-guard test covers current, changed, and aborted requests. |
| 2 | Before sharing | Bound parser work beyond file size and ZIP expansion checks. | Complete in v0.2.10. Added record, unique-exercise, and 30-year date-span limits with a clear local error; existing file-size, ZIP-expansion, worksheet-row, and column limits remain active. |
| 3 | Before sharing | Restore meaningful type validation and a lightweight CI release check. | Complete in v0.2.11. Source TypeScript now passes without generated `.next` route files; CI checks release metadata, tests, parser checks, lint, TypeScript, and both production builds on main, tags, and pull requests. |
| 4 | Before sharing | Use trusted Vercel client identity and durable abuse limits. | In progress in v0.2.12. Identity now trusts Vercel's forwarded client address and only accepts Cloudflare identity when explicitly configured; durable cross-instance limiting still requires Vercel WAF/KV or an equivalent deployment service. |
| 5 | Before sharing | Establish privacy-safe failure reporting and verify deployment/rollback. | Add redacted client/server error reporting or a documented minimal fallback; verify the GitHub-to-Vercel production deployment, environment variables, rollback path, and live footer version. |
| 6 | Before sharing | Review remaining development-tool dependency advisories. | Decide which of the remaining full-audit findings are actionable, update or constrain them where practical, and document why development-only findings cannot reach the production bundle. |
| 7 | Beta UX | Keep About directly accessible before upload and at every screen width. | About remains reachable from the landing state and responsive navigation independently of imported data; verify desktop and mobile layouts. |
| 8 | Beta UX | Improve modal keyboard access, loading/cancellation, and optional-AI onboarding. | Escape closes dialogs, focus is managed, cancellation states are clear, and AI remains understandable and optional without blocking the core dashboard. |
| 9 | Release verification | Complete live and browser upload smoke checks with synthetic data. | Verify CSV/XLSX import, replacement, clear, worker cancellation, error handling, footer version, and AI opt-in on the deployed Vercel build. |
| 10 | Beta UX | Offer a sample preview before requiring an upload. | Decide whether a clearly synthetic sample improves first-use comprehension; if accepted, label it as sample data and keep personal files out of the bundle. |

Unrelated local leftovers (`public/favicon.svg` deletion and Finder metadata) remain outside these fixes unless intentionally included later.
