# Ripper OS working instructions

## Commit, version, and deployment cadence

- Complete each focused change, run checks appropriate to its scope, then commit and push to GitHub unless the user explicitly says not to push. The GitHub remote is `github`; Vercel deploys from GitHub. Do not publish to the legacy Sites remote (`origin`) unless requested.
- Every new commit must include a version upgrade in both `package.json` and `package-lock.json`, release notes in its commit body, and a matching annotated Git tag named `v<version>`. Push the commit and its tag together, preferably using an atomic push. Do not move or reuse existing release tags.
- Use judgment for semantic versioning: default to a patch bump for fixes and small refinements, minor for substantial compatible features, and major for breaking changes. Patch numbers have no artificial ceiling: `0.1.555` is valid. Do not roll over to a minor release just because a patch number is large.
- Keep the shared website footer tied to the package version and build metadata so local, preview, and production environments can be compared and traced to a commit. Never hardcode a separate display version. Restart development after a version/configuration change to refresh build metadata.
- Show only the version in the production footer; add a Local or Preview label in those environments. Keep the commit hash and source fingerprint in hover details rather than the visible label.
- Keep commits focused. Preserve unrelated user edits; do not commit OS metadata or personal training archives.

## Commit release notes

- Use Conventional Commit subjects: `<type>(<scope>): <imperative summary>`. Use `fix`, `feat`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, or `chore` as appropriate; scope is optional. Mark breaking changes with `!` and explain them in a `BREAKING CHANGE:` body paragraph.
- For changes beyond trivial edits, use the commit body to explain the user-facing problem, resulting behavior, and validation. Include known limitations when relevant. Do not claim checks passed when they did not, or deployments succeeded before verification.
- Do not create or maintain a separate CHANGELOG.md. Each commit is its own changelog: put the release version in the body and use concise Added, Changed, Fixed, Removed, or Security sections as applicable, followed by Validation. Use the same release notes for the annotated tag.
- Write concrete release notes for users and maintainers. Describe behavior and impact, not a transcript of implementation steps. Cover the actual changes, including documentation-only releases; never invent historical release notes.
- Before pushing, confirm the package and lockfile versions match the commit release notes and tag, and that the shared footer derives its version from the package. Push only the intended branch and release tag; do not push unrelated tags.

## Validation and scope

- Keep testing proportional while the product is still being defined. Do not introduce a broad test suite for small changes.
- Vercel uses `npx next build`; the existing `npm run build` uses Vinext. Validate the relevant build paths when changing shared code or configuration.
- Report failed checks accurately. Next.js currently skips TypeScript build errors; a successful build does not establish type correctness.
