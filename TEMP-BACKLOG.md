# Temporary launch-readiness backlog

Created 2026-09-05 from the app assessment. Work through one focused fix at a time; validate, bump the version, commit release notes, tag, and push each fix. Remove this temporary tracker once the launch pass is complete. This is a work queue, not a changelog.

| # | Priority | Task | Status / evidence |
| --- | --- | --- | --- |
| 1 | Before sharing | Replace vulnerable SheetJS 0.18.5 with an official patched release; verify CSV/XLSX compatibility. | Complete in v0.1.2. Pinned official 0.20.3 tarball with lockfile integrity. CSV/XLSX compatibility, both builds, lint, and existing test passed; production audit no longer flags xlsx. |
| 1a | User priority | Process files and calculate summaries in a browser Web Worker; remove the server upload endpoint. | Complete in v0.2.0. Local worker, 25 MB cap, cancellation, 30-second timeout; upload API removed. Synthetic CSV/XLSX, cancellation, and invalid-file checks passed in Vinext development and Next.js production browsers. Fixed Vinext file-URL worker loading and timezone date shifts. |
| 2 | Before sharing | Review and update remaining affected production dependencies, including Next.js. | Complete in v0.2.2. Next.js and matching lint config 16.3.4; patched production PostCSS/sharp; ws override 8.21.0. Production audit reports zero vulnerabilities. Production browser import and both footer versions verified. |
| 2a | Development hardening | Review remaining development-tool dependency advisories. | Pending. Full audit still reports 10 affected packages (1 low, 9 high), outside the production dependency tree; avoid exposing development servers publicly. |
| 3 | Before sharing | Align upload limits with Vercel and handle oversized/non-JSON responses gracefully. | Upload issue resolved by v0.2.0: files never reach Vercel; 25 MB limit enforced locally. Friendly non-JSON handling for AI responses remains pending under item 13. |
| 4 | Before sharing | Correct achievement peaks. | Complete in v0.2.4. Peak selection and first-to-peak cards are fixed; restored older snapshots are recalculated at render time so stale latest-value percentages cannot show as headline gains. |
| 5 | Before sharing | Handle unsupported CSV units and required columns explicitly. | Complete in v0.2.6. Pounds/lbs/pounds columns convert to kilograms; unsupported weight units and missing Date/Exercise/Reps columns produce clear local parser errors. |
| 6 | Before sharing | Correct privacy and persistence copy. | File privacy resolved in v0.2.0: browser-only processing makes the privacy claim true. README/About and initial import copy updated. Remaining persistence edge cases belong to item 7. |
| 7 | Before sharing | Make snapshot storage/restore safe and independent of successful uploads. | Partial in v0.2.1: storage failures no longer interrupt replacement; quota retry, stale snapshot removal, and persistent warnings verified. Full stored-data schema validation remains pending. |
| 8 | Before sharing | Prevent stale upload and AI responses from updating another dataset. | Local imports cancel on replacement, clear, and unmount (v0.2.0). v0.2.1 adds dataset revision checks for AI responses on replacement, clear, and unmount; dedicated AI race verification remains pending. |
| 9 | Before sharing | Handle malformed multipart requests and bound parser work. | Multipart endpoint removed in v0.2.0. Local worker terminates on cancellation/timeout. Further date/expansion/memory bounds remain pending. |
| 10 | Before sharing | Use trusted Vercel client identity and durable abuse limits. | Pending. Current maps are per process and prioritize a Cloudflare header. External configuration may be needed. |
| 11 | Before sharing | Restore meaningful type validation and a lightweight CI release check. | Pending. Real dashboard type errors and generated-route conflicts; Next.js ignores type errors. Keep tests targeted. |
| 12 | Before sharing | Establish privacy-safe failure reporting and verify deployment/rollback. | Pending. No app error monitoring found; live Vercel URL/configuration still needed. |
| 13 | Beta UX | Improve modal keyboard access, loading/cancellation, and optional-AI onboarding. | Pending. Escape did not close connection dialog; focus trap absent. |
| 14 | Beta UX | Offer a sample preview before requiring an upload. | Pending. Product choice; avoid publishing personal training data. |
| 15 | Release verification | Complete live and browser upload smoke checks with synthetic data. | Pending. Local API checks and mobile landing inspection passed; browser upload blocked by extension file access. |
| 16 | User-requested follow-up | Keep About directly accessible before upload and at every screen width. | Pending. About currently shares the dashboard navigation's visibility rules; it should remain available independently of imported data. |
| 17 | User-reported bug | Replace export must replace the entire current render. | Complete in v0.2.1. Reproduced mixed old/new dashboard under storage quota failure. Moved dataset into React state, reset filters/comparison, decoupled saving, and verified replacement plus refresh with synthetic exports. |

Unrelated local leftovers (`public/favicon.svg` deletion and Finder metadata) remain outside these fixes unless intentionally included later.
