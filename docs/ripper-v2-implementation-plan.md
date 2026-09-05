# Ripper OS v2 Incremental Implementation Roadmap

Current milestone: M3 — Strong drives the existing dashboard
Current task: V2-015
Last completed task: V2-013 — Normalize Strong measurements into canonical units
Next task: V2-015
Blockers: V2-008 browser CSV/XLSX worker smoke checks pending: Chrome extension file URL permission disabled. User approved original anonymized Strong/Hevy fixtures. Strong unitless columns are documented and require explicit import options; Hevy manifest remains V2-034.
Tasks complete: 13
Tasks remaining: 38

Core proof goal:
MacroFactor + Strong -> shared Ripper analytics

## How to execute this roadmap

Read AGENTS.md and this introduction before implementing one task. Select the next dependency-ready TODO task, mark it IN_PROGRESS, implement only that task, verify it, then mark it DONE and update the status fields above in the same focused change. Never mark a task complete merely because its code compiles when fixture or manual acceptance is unmet. Do not start the next task automatically.

Stable IDs must never be renumbered, including completed tasks. If new necessary work appears, append a new ID, explain its dependency and reason under Roadmap changes, and update counts. Blocked tasks stay TODO or IN_PROGRESS with a named blocker; do not invent source schemas to unblock them.

A task marked **REQUIRES HIGHER-MODEL REVIEW** requires a stronger reasoning pass against its stated policy before implementation. The default architecture is specified here; the implementation agent must not invent an alternative. If evidence contradicts that policy, record the issue and stop that task for review. The other tasks should be executable without new architecture decisions.

Every future implementation commit follows AGENTS.md: package and lockfile version bump, professional Conventional Commit release notes, matching annotated version tag with the same release notes, and atomic push of the intended commit/tag to github unless told otherwise. Check the working version immediately before release; another agent may have advanced it. “v2” describes the initiative, not an instruction to jump package semver to 2.0.0. Suggested subjects below are examples, not full release notes.

The roadmap-creation invocation was documentation-only. Implementation began only after the user's subsequent “next task” instruction; the status fields and task entries now track that work.

### Verification convention

There is no `npm run typecheck` script in the inspected package. Use:

- `npm test`
- `npm run test:parser`
- `npx tsc --noEmit --incremental false`
- `npm run lint`
- `npx next build` for Vercel and `npm run build` for Vinext.
- `npm run check:release` after the task's version bump, then check both page footers against that version.

Each task lists a focused test or inspection in addition to these checks. New Node assertion scripts should follow the current small-script test style and be wired into an existing test command or called by CI; do not add a general testing framework merely for this roadmap. TypeScript executed using Node strip-types must use resolvable imports consistent with the existing test runner; do not mass-change app imports to satisfy Node.

Run typecheck before builds. Next may add generated route includes to tsconfig and the two builds can interfere through generated files. Inspect any resulting diff, report real failures, and remove only task-generated changes you own. Never restore an entire shared file over another agent's edits. Do not claim a Next build proves types: next.config currently ignores build type errors.

“Manual checkpoint: YES” means open the running app with the named fixtures, inspect the stated result, and record actual verification. Reuse the user's running dev server when possible; do not kill it or leave diagnostic routes in the product. Build/worker changes need both runtime paths checked. Use the browser skill when browser interaction is needed. A live deployment check remains pending if the Vercel URL is unavailable.

## Repository and architectural reference

Reference: the comprehensive engineering plan in the preceding conversation, especially aggregate/detail fidelity, adapter boundaries, exercise identity separate from load comparability, local-first privacy, and pure shared analytics. No separate engineering-plan file was found in the repository. This roadmap deliberately replaces the earlier implementation phase ordering with smaller vertical increments.

Inspection: 2026-09-05. At the start, HEAD was `9ddb5f7 feat(ui): modernize dark analytics interface` (committed package 0.2.17), following the original audit at b07de72/v0.2.16. Pending UI edits and a working 0.2.18 version were present. During roadmap preparation, the UI work advanced through `6b5247c`, `df89bbc` and finally `a23ac11 refine(ui): quiet visual hierarchy and charts`, with package 0.2.20. Final inspection found only the unrelated public/favicon.svg deletion and Finder “Icon” metadata alongside this new docs directory. These UI commits and leftovers are not this roadmap's changes.

The UI work now uses Google Sans Flex for the interface, Zen Dots for the logotype, muted sage chart tokens, flatter cards, smaller headings and thinner Recharts lines/markers. The footer uses a text wordmark and the new SVG app icon is committed. The observed page changes are presentational; import and analytics boundaries remain those audited below. Preserve this work. **Every task touching app/page.tsx or shared components must inspect the current git diff first, make the smallest functional edit, preserve unrelated visuals and classes, and avoid broad formatting or restoring old JSX/CSS.** This also applies if file locations have moved since this inspection. Likely-files lists are guidance, not permission to overwrite another agent's work. Release metadata changes are additional to the listed 1–5 core files.

Current functional anchors:
- `lib/training-parser.ts:parseTrainingFile()`: compressed, combined SheetJS decoding, MacroFactor normalization, daily aggregation and all dashboard calculations. CSV uses Date/Exercise/Reps; XLSX merges seven exercise metric sheets plus Muscle Groups - Sets. Workbook aggregate cells cannot reconstruct individual workouts or sets.
- `lib/import-training-file.ts`, `lib/training-parser.worker.ts`, and the two create-training-worker factories: browser-only import, File sent to a worker, 25 MB file bound and 30-second cancellation/timeout. Keep both Next and Vinext factories working.
- `app/page.tsx`: DashboardData/Exercise/ProgressRecord types, upload/replace state, filters, charts, recommendations, restore and clear. Recharts consumes daily progress arrays. Most domain logic lives outside React already, but in the parser.
- `lib/training-snapshot.mjs`: synchronous localStorage of the derived dashboard under ripper-os-training-data-v3, 4,000,000-character cap, shallow validation. It does not retain a canonical history.
- `scripts/refresh-training-data.mjs`: separate, divergent workbook-to-dashboard implementation. Browser behavior is the regression baseline; this CLI is not an oracle.
- `scripts/test-training-parser.mjs`: tiny generated CSV/XLSX checks. No representative export fixtures are committed. `scripts/test-data-shape.mjs` checks the empty bundled app/training-data.json.
- `app/api/recommendations/route.ts`: optional BYOK AI receives derived summaries. Import files are never sent there.
- `TEMP-BACKLOG.md` and `BACKLOG.md`: older launch work, with stale completion claims. This file owns v2 implementation state; do not silently mark unrelated launch items done.

### Rules that must survive every intermediate state

1. A daily aggregate is not a session; never manufacture sets from MacroFactor workbook totals.
2. Missing is null/absent, not zero. Preserve supplied zero. Existing dashboard zero-fill is allowed only inside an explicitly named legacy presentation projection until V2-042; never write it back as canonical truth.
3. Keep raw exercise names and source/import identity. Record source row or sheet references where available; no field-derivation database.
4. Canonical mass is kg, distance meters, time seconds; preserve source values/units. Unknown units require an import decision or remain non-comparable; never assume lb means kg.
5. Exercise identity and load comparability are distinct. Unknown machines, per-hand vs total loads, and assisted vs external loads must not silently join one PR series.
6. Analytics consume canonical facts/projections, not source CSV columns. Source-specific names and worksheet knowledge stay in adapters. Source labels may appear in import/provenance UI.
7. Retain raw local data only as needed; no network during import. AI receives a separately selected summary, never an import envelope, sets or notes.
8. Preserve valid MacroFactor metric results first. Correct semantics in named later tasks, not opportunistically during extraction.

## Small target, introduced when needed

V2-003 introduces only:
```ts
type TrainingSource = "macrofactor" | "strong" | "hevy";
type DailyMetric =
  | "totalSets" | "totalReps" | "bestSetReps"
  | "heaviestKg" | "totalVolumeKg" | "e1rmKg" | "durationSec";
type DailyMetrics = Record<DailyMetric, number | null>;
interface CanonicalExerciseDay {
  id: string;
  importId: string;
  source: TrainingSource;
  rawExerciseName: string;
  exerciseId: string; // initially deterministic source-scoped custom identity
  displayName: string; // includes only existing MF compatibility aliases initially
  date: string; // validated YYYY-MM-DD calendar date, never a fabricated midnight instant
  metrics: DailyMetrics;
  origin: "source-aggregate" | "derived-from-sets";
  sourceRefs: string[]; // e.g. sheet/row/column references; not full raw files
  comparisonKey: string; // conservative source/name key until verified equivalence
}
interface SourceMuscleDay {
  importId: string;
  source: TrainingSource;
  date: string;
  rawMuscleName: string;
  setEquivalents: number;
}
```

The shape above is the selected starting contract, not a request to implement it during roadmap creation. Keep deterministic display rounding in analytics only. The adapter may retain multiple source observations before producing one exercise day. Never merge source facts just because display aliases match: sourceRefs must still identify contributors.

V2-008 introduces a small import envelope: schemaVersion: 1, importId, source, filename, adapterVersion, exerciseDays, muscleDays, issues, and relevant retained source rows. Keep retained rows once per import as scalar cell values plus headers/sheet/row references; exclude unrelated nutrition/account sheets and original file bytes. This is sufficient to preserve unused training columns while detailed MF parsing is deferred. No separate record database. Unknown source fields do not enter dashboard or AI types.

V2-012 adds detailed StrengthSession, ExercisePerformance and TrainingSet because Strong needs them: stable import-local IDs, local date, optional original timestamp/timezone/offset, explicit timestamp precision, session boundary evidence, title/duration/notes, ordered repeated exercise blocks, ordered sets, nullable reps/load/distance/duration/RPE/RIR, source set type, normalized set kind and recorded load/repetition basis. Preserve positive assistance separately from external resistance; unknown conventions remain unknown. Original row references and values stay available. Add no endurance/HR interfaces.

For a detailed import, stored sessions are the facts; exerciseDays are a rebuildable projection. For aggregate imports, exerciseDays are the facts. A dashboard builder chooses one representation per import, never adds both. V2-030 persists that distinction. This small union replaces a large universal TrainingHistory graph.

Canonical validation occurs after normalization and before analytics. Adapters may produce staged issues while requesting unit/date choices. Fatal format/structure problems fail that file; invalid rows are reported and skipped; invalid optional fields become null with a warning. Do not coerce an invalid row into a valid zero-valued workout. Empty valid output is an actionable failure. Keep warnings local and bounded.

V2-016 introduces a small versioned catalog and resolver. Order: user override (including “keep custom”), known source mapping, unique exact canonical display name, unique conservatively normalized alias, source-scoped custom identity. Normalize casing/whitespace/punctuation without dropping equipment, angle, stance or machine qualifiers. No fuzzy scores. A builtin exercise ID alone never authorizes joining load series. The bench proof uses fixtures with independently verified kg total external-load semantics; other cases stay separate.

### Deliberate temporary states and cleanup

| Introduced | Temporary state | Explicit exit |
| --- | --- | --- |
| V2-003–007 | Old parsing beside newly extracted pure analytics | V2-008 removes inline duplicate calculations |
| V2-008 | Public parseTrainingFile still returns DashboardData | V2-015 browser import uses ImportOutcome; V2-039 removes obsolete wrapper after callers migrate |
| V2-008 | MF CSV retains rows but still uses existing daily projection | V2-039 narrows/document this supported aggregate route; detailed MF adapter is deferred until verified detailed fixtures require it |
| V2-015 | Canonical imports are RAM-only; reload restores display snapshot only | V2-031 restores canonical history and removes this restriction |
| V2-019 | Add only disjoint-date imports; reject every overlap | V2-025 handles verified same-source re-exports; V2-026 surfaces remaining overlaps |
| V2-020 | Mapping overrides are RAM-only | V2-032 persists mappings |
| Existing | Divergent refresh:data parser | V2-021 reuses shared pipeline |
| V2-003 onward | Legacy metric names, null-to-zero display behavior and name-shaped view model | V2-017 adds identity keys; V2-022/042/043 correct labels and values deliberately |

## Milestones and checkpoints

| Milestone | Tasks | Working outcome |
| --- | --- | --- |
| M1 — Lock down the behavior worth keeping | 001–002 | Useful MF regression coverage without a new framework |
| M2 — MacroFactor through a small shared model | 003–008 | Same dashboard, pure analytics, explicit aggregate fidelity |
| M3 — Strong drives the existing dashboard | 009–015 | Verified Strong CSV works locally through the same analytics |
| M4 — One exercise history across two sources | 016–021 | Known equivalents join across non-overlapping histories; simple manual mappings |
| M5 — Imports become additive and explainable | 022–029 | Preview, incremental imports, conservative conflicts, reports and cancellation |
| M6 — Keep canonical history between visits | 030–033 | Small IndexedDB persistence, durable mappings and local backup |
| M7 — Hevy proves the adapter boundary | 034–039 | Third source, same canonical projection and analytics |
| M8 — Improve meaning after preserving behavior | 040–048 | Explicit comparison contexts, honest metrics, muscle/bodyweight foundations |
| M9 — Measure and prepare the beta | 049–051 | Measured performance, AI privacy boundary, verified source guide and smoke run |

First visible Strong dashboard: V2-015. First unified MF + Strong exercise history in the app: V2-019, without persistence or automatic overlap resolution. No ten-task abstraction runway: V2-004–007 connect each extracted function immediately to the running parser, V2-008 proves MF end to end, then Strong progresses in narrow fixture-driven increments.

Higher-model review: V2-008, V2-016, V2-025, V2-030, V2-040. All other tasks implement the defined contracts.

### Detailed contract to introduce in V2-012

Use these concrete shapes when detail becomes necessary; do not add them in V2-003. `SourceRow` retains a header-keyed scalar record once per import, plus sheet/row locator. Raw supplied values remain there when a normalized optional value is rejected.

```ts
type Scalar = string | number | boolean | null;
interface ImportIssue {
  code: string;
  severity: "warning" | "error";
  rowRefs: string[];
  action: "skipped-row" | "omitted-field" | "needs-input" | "rejected-file";
  message: string; // local, bounded; never HTML
}
interface SourceRow {
  ref: string;
  sheet?: string;
  row: number;
  cells: Record<string, Scalar>;
}
interface RecordedLoad {
  kg: number;
  component: "external" | "assistance" | "combined" | "unknown";
  basis: "total" | "per-implement" | "per-side" | "machine-setting" | "unknown";
  originalValue: number;
  originalUnit: "kg" | "lb";
}
interface TrainingSet {
  id: string;
  sourceSetId?: string;
  index: number; // Ripper's zero-based order, original order in retained source row
  kind: "normal" | "warmup" | "drop" | "failure" | "other" | "unknown";
  rawKind?: string;
  completed: boolean | null;
  reps: number | null;
  repsBasis: "total" | "per-side" | "unknown";
  load: RecordedLoad | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  rir: number | null;
  notes?: string;
  sourceRefs: string[];
}
interface ExercisePerformance {
  id: string;
  sourceExerciseId?: string;
  rawExerciseName: string;
  displayName: string;
  exerciseId: string;
  comparisonKey: string;
  order: number;
  supersetGroup?: string;
  notes?: string;
  sets: TrainingSet[];
}
interface StrengthSession {
  id: string;
  importId: string;
  source: TrainingSource;
  sourceSessionId?: string;
  date: string;
  originalStartedAt?: string;
  startedAt?: string; // instant only when offset/zone is actually known
  endedAt?: string;
  timezone?: string;
  timePrecision: "date" | "local-datetime" | "instant";
  boundary: "source-id" | "timestamp-and-title" | "confirmed";
  title?: string;
  durationSeconds: number | null;
  notes?: string;
  exercises: ExercisePerformance[];
  sourceRefs: string[];
}
```

An import with ambiguous units/boundaries stays staged; it cannot supply an apparently valid RecordedLoad/session by guessing. Strict ranges for finite normalized values: non-negative counts/load magnitudes/distance/duration, nonempty IDs and non-negative integer order indices, RPE 0–10 and RIR >=0 when supplied. Source negative assistance conventions must be converted to positive assistance magnitude with the original signed row retained. Do not turn other negative weights positive indiscriminately. Validate actual calendar dates; preserve local dates when no zone is supplied.

If a real fixture needs two distinct load components on one set, stop for a narrowly scoped higher-model amendment before extending RecordedLoad to an array. Do not silently flatten components. This is an evidence-triggered decision, not a prerequisite architecture project.

The first proof is a usable release at M4. M8 is deliberately later product work: bodyweight tasks are fixture-gated, and completing all optional analytics is not required to share the three-source beta. M9 verification must describe the features actually complete.

## Tasks

### V2-001 — Add a representative MacroFactor regression dataset

Status:
DONE

Milestone:
M1 — Lock down the behavior worth keeping

Manual checkpoint: NO

Goal:
Commit a deterministic, privacy-safe MF CSV and workbook fixture covering several months.

Why this task exists:
Later extraction needs a trustworthy before/after input, independent of the divergent refresh:data CLI.

Scope:

- Add multi-exercise, multi-month input with gaps, peak-then-decline, timed work and muscle rows.
- Document fixture provenance and generate the workbook from a readable cell matrix.

Explicitly out of scope:

- Do not claim generated data is a real export.
- Do not change parser formulas, UI or dependencies.

Likely files:

- `tests/fixtures/macrofactor/*`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Use the exact seven sheet names and Muscle Groups - Sets already read by parseTrainingFile. Include missing optional sheets, source aliases and repeated same-day CSV sets. A realistically sized synthetic baseline can proceed now; identify it as synthetic. If a permission-cleared real export is available, anonymize and document it separately without blocking this baseline.

Acceptance criteria:

- Fixture generation is deterministic and contains no personal notes or identifiers.
- Fixture spans at least four months and exercises all currently supported metric columns.
- Existing parser successfully reads the baseline; unusual invalid inputs belong in separate files.

Verification:

- Focused: Load both fixtures with parseTrainingFile and run existing parser checks.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Subsequent tasks have a repeatable MF comparison dataset.

Dependencies:

- None.

Blocks:

- V2-002

Suggested commit message:
`test(macrofactor): add representative regression fixtures`

Implementation-agent brief:
Implement V2-001 only. Commit a deterministic, privacy-safe MF CSV and workbook fixture covering several months. Use the exact seven sheet names and Muscle Groups - Sets already read by parseTrainingFile. Stay within the Scope and Explicitly out of scope lists above. Load both fixtures with parseTrainingFile and run existing parser checks. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-002 — Assert current dashboard analytics against the baseline

Status:
DONE

Milestone:
M1 — Lock down the behavior worth keeping

Manual checkpoint: NO

Goal:
Add explicit expectations for the dashboard values currently produced by the browser parser.

Why this task exists:
This separates extraction regressions from later deliberate metric corrections.

Scope:

- Assert coverage/monthly rankings, gaps/streaks, progress, achievements and muscle windows/heatmap.
- Document existing surprising semantics alongside named expectations.

Explicitly out of scope:

- Do not use the refresh:data CLI as expected output.
- Do not fix daily-session counting, zeros or date parsing in this task.

Likely files:

- `scripts/test-training-parser.mjs`
- `tests/fixtures/macrofactor/expected-dashboard.json`
- `tests/fixtures/macrofactor/README.md`

Implementation guidance:
Exclude generatedAt from comparisons. Hand-check important totals and dates; a snapshot generated from the parser alone is insufficient. Record that totalSessions currently counts active dates and that achievement selection follows exercise order. Include no-muscle and short-history fixtures. Keep current assertions about notes being absent from DashboardData.

Acceptance criteria:

- Each current analytics section has at least one independently justified expected value.
- Tests fail if a month count, peak value or muscle-window boundary changes.
- Known semantic problems are documented without becoming permanent canonical requirements.

Verification:

- Focused: Run regression script twice to confirm generated timestamps do not make it flaky.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Safe extraction has a bounded regression gate.

Dependencies:

- V2-001

Blocks:

- V2-004
- V2-005
- V2-006
- V2-007

Suggested commit message:
`test(analytics): lock current MacroFactor dashboard behavior`

Implementation-agent brief:
Implement V2-002 only. Add explicit expectations for the dashboard values currently produced by the browser parser. Exclude generatedAt from comparisons. Stay within the Scope and Explicitly out of scope lists above. Run regression script twice to confirm generated timestamps do not make it flaky. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-003 — Introduce exercise-day and dashboard boundary types

Status:
DONE

Milestone:
M2 — MacroFactor through a small shared model

Manual checkpoint: NO

Goal:
Add the small canonical daily model and move the existing dashboard types out of React.

Why this task exists:
Pure functions need source-neutral inputs and reusable output types without a full domain framework.

Scope:

- Implement the introductory CanonicalExerciseDay, DailyMetrics and SourceMuscleDay contracts.
- Move current dashboard-only interfaces unchanged into lib/analytics/dashboard-types.ts.

Explicitly out of scope:

- Do not add session/set types, IndexedDB or an importer registry.
- Do not change calculations, styles or reorganize page components.

Likely files:

- `lib/domain/training.ts`
- `lib/analytics/dashboard-types.ts`
- `app/page.tsx`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Use null for unknown canonical measurements. Keep current DashboardData property names, including legacy sessions names. Retain React-specific AI/UI types in page.tsx. Inspect the current page diff first and replace only moved declarations with type imports. Add a tiny contract example that distinguishes null from recorded zero. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Page typechecks with imported dashboard types.
- Canonical days carry source, original name and source references.
- No runtime behavior or metric output changes.

Verification:

- Focused: Compile a null/zero contract example and rerun MF baselines.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Reusable domain and view types exist with no visual change.

Dependencies:

- None.

Blocks:

- V2-004
- V2-005
- V2-006
- V2-007

Suggested commit message:
`refactor(domain): define canonical exercise-day records`

Implementation-agent brief:
Implement V2-003 only. Add the small canonical daily model and move the existing dashboard types out of React. Use null for unknown canonical measurements. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Compile a null/zero contract example and rerun MF baselines. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-004 — Extract monthly frequency, coverage and gap calculations

Status:
DONE

Milestone:
M2 — MacroFactor through a small shared model

Manual checkpoint: YES

Goal:
Move the calendar summary block into a pure source-neutral function and call it from the current parser.

Why this task exists:
This creates the first shared analytics boundary while the existing app remains connected.

Scope:

- Add calculateConsistencySummary(days) for coverage dates, month counts/rankings and gaps.
- Use a narrow current-record-to-day conversion at the parser call site until V2-008.

Explicitly out of scope:

- Do not reinterpret training days as actual sessions.
- Do not change boundary-month coverage, rounding or chart styling.

Likely files:

- `lib/analytics/consistency.ts`
- `lib/training-parser.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Move the current unique dates with positive totalSets, monthly loop, complete-month rankings and gaps logic together. Leave attendance/streak calculation for V2-006; compose its longest streak later. Preserve existing field shapes and arithmetic. The temporary converter must only map existing facts, never fill canonical unknowns with zero.

Acceptance criteria:

- parseTrainingFile no longer calculates monthly rankings or gaps inline.
- The function accepts canonical exercise days without worksheet knowledge.
- All existing coverage/monthly/gap expectations remain identical.

Verification:

- Focused: Compare baseline output and manually inspect monthly bars, rankings and gap cards.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
One visible dashboard area now runs on a shared pure function.

Dependencies:

- V2-002
- V2-003

Blocks:

- V2-008

Suggested commit message:
`refactor(analytics): extract consistency summaries`

Implementation-agent brief:
Implement V2-004 only. Move the calendar summary block into a pure source-neutral function and call it from the current parser. Move the current unique dates with positive totalSets, monthly loop, complete-month rankings and gaps logic together. Stay within the Scope and Explicitly out of scope lists above. Compare baseline output and manually inspect monthly bars, rankings and gap cards. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-005 — Extract exercise progression and achievement calculations

Status:
DONE

Milestone:
M2 — MacroFactor through a small shared model

Manual checkpoint: YES

Goal:
Move exercise summaries, metric selection and achievement selection into pure analytics.

Why this task exists:
Strong must reuse the same progress and highlight calculations rather than duplicate them.

Scope:

- Add calculateExerciseSummary(days) returning current exercises and achievements.
- Isolate existing family/name heuristics as legacy presentation helpers.

Explicitly out of scope:

- Do not introduce new aliases or change achievement ranking.
- Do not calculate e1RM or repair missing/zero metric behavior yet.

Likely files:

- `lib/analytics/exercises.ts`
- `lib/analytics/legacy-exercise-labels.ts`
- `lib/training-parser.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Copy formulas faithfully, including first-to-peak highlights, >0 availability and ordering by total sets. Keep name-shaped dashboard output until V2-017, but accept IDs in input. No source-column tests in analytics. Inspect charts against the baseline, including decline after peak.

Acceptance criteria:

- Parser calls the extracted function and contains no parallel exercise/achievement implementation.
- Progress arrays and all baseline highlights remain equal.
- Family regex limitations are isolated and explicitly left for V2-044.

Verification:

- Focused: Assert progression and first/latest/peak parity; inspect explorer and highlights.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Exercise charts use a reusable source-neutral calculation.

Dependencies:

- V2-002
- V2-003

Blocks:

- V2-008

Suggested commit message:
`refactor(analytics): extract exercise progression`

Implementation-agent brief:
Implement V2-005 only. Move exercise summaries, metric selection and achievement selection into pure analytics. Copy formulas faithfully, including first-to-peak highlights, >0 availability and ordering by total sets. Stay within the Scope and Explicitly out of scope lists above. Assert progression and first/latest/peak parity; inspect explorer and highlights. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-006 — Extract attendance and active-week streak calculations

Status:
DONE

Milestone:
M2 — MacroFactor through a small shared model

Manual checkpoint: NO

Goal:
Move attendance heatmap bins and week streaks into one pure function.

Why this task exists:
The remaining consistency calculations must be reusable by Strong without silently redefining intensity.

Scope:

- Create calculateAttendance(days) with existing Monday-week boundaries.
- Connect the parser to returned attendance and longestActiveWeekStreak.

Explicitly out of scope:

- Do not alter load-relative bins or rename intensity labels yet.
- Do not add rolling caches, new charts or session reconstruction.

Likely files:

- `lib/analytics/attendance.ts`
- `lib/training-parser.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Preserve current load-ratio thresholds .33/.66 and fallback set thresholds 8/16. Keep distinct active dates as the input concept. Avoid source checks. Record the misleading intensity interpretation for V2-043 rather than fixing it during this move.

Acceptance criteria:

- Attendance cells, week counts and longest streak match all baselines.
- No attendance loop remains duplicated in parseTrainingFile.
- Empty optional load data uses the same fallback as before.

Verification:

- Focused: Check weeks spanning a month/year boundary and a multi-week gap.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Attendance is now another shared calculation.

Dependencies:

- V2-002
- V2-003

Blocks:

- V2-008

Suggested commit message:
`refactor(analytics): extract attendance calculations`

Implementation-agent brief:
Implement V2-006 only. Move attendance heatmap bins and week streaks into one pure function. Preserve current load-ratio thresholds .33/.66 and fallback set thresholds 8/16. Stay within the Scope and Explicitly out of scope lists above. Check weeks spanning a month/year boundary and a multi-week gap. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-007 — Extract source-reported muscle summaries

Status:
DONE

Milestone:
M2 — MacroFactor through a small shared model

Manual checkpoint: YES

Goal:
Move muscle windows and heatmap calculation behind a pure dated-ledger input.

Why this task exists:
MF muscle views must survive normalization even though Strong initially supplies no muscle ledger.

Scope:

- Add calculateSourceMuscles(muscleDays, firstDate, lastDate).
- Return the current muscles, muscleWindows and muscleHeatmap shapes.

Explicitly out of scope:

- Do not infer muscle coefficients for Strong or from exercise names.
- Do not mix source-reported muscle models or alter comparison windows.

Likely files:

- `lib/analytics/muscles.ts`
- `lib/training-parser.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Keep SheetJS extraction in the parser and map cells into SourceMuscleDay. Move only date-window and summary calculations. Empty ledger returns empty rows safely. Preserve current single-day behavior in the baseline and leave improvements for V2-044. Do not discard the dated ledger after this boundary is introduced.

Acceptance criteria:

- MF window totals and every heatmap cell match the baseline.
- The function has no XLSX imports or source-specific sheet names.
- CSV without muscle data still imports and has no fabricated muscle values.

Verification:

- Focused: Inspect MF muscle bars and heatmap; assert empty-ledger behavior.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Source muscle data is separated from its presentation calculations.

Dependencies:

- V2-002
- V2-003

Blocks:

- V2-008

Suggested commit message:
`refactor(analytics): extract reported muscle summaries`

Implementation-agent brief:
Implement V2-007 only. Move muscle windows and heatmap calculation behind a pure dated-ledger input. Keep SheetJS extraction in the parser and map cells into SourceMuscleDay. Stay within the Scope and Explicitly out of scope lists above. Inspect MF muscle bars and heatmap; assert empty-ledger behavior. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-008 — Route MacroFactor through the canonical import boundary

Status:
IN_PROGRESS

Implementation and automated verification complete; browser worker smoke verification pending extension file URL permission.

Milestone:
M2 — MacroFactor through a small shared model

**REQUIRES HIGHER-MODEL REVIEW**

Manual checkpoint: YES

Goal:
Make MF normalization produce an import envelope and compose its existing dashboard through shared analytics.

Why this task exists:
This is the first end-to-end proof of MacroFactor -> canonical representation -> existing dashboard.

Scope:

- Move MF CSV/workbook mapping to a focused adapter; keep file/archive safety checks shared.
- Add buildDashboard(imports) composing V2-004–007 and validate canonical output.

Explicitly out of scope:

- Do not reconstruct workbook sessions/sets or invent missing values.
- Do not add Strong, persistence migrations or redesign metric semantics.

Likely files:

- `lib/import/adapters/macrofactor.ts`
- `lib/import/validation.ts`
- `lib/analytics/build-dashboard.ts`
- `lib/training-parser.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Implement the envelope and representation rules above. Keep parseTrainingFile(bytes,name) as a compatibility wrapper returning DashboardData so the browser caller does not change yet. Retain relevant training rows once per import for later reinterpretation; dashboard output still excludes notes. Separate raw name from legacy alias. Valid baseline results must match; malformed dates/negative counts now become explicit issues at validation, not accepted canonical facts. State that intentional invalid-input change in tests/release notes.

Acceptance criteria:

- All valid MF baselines match through buildDashboard.
- Workbook imports contain aggregate days and no fabricated sessions.
- Canonical unknowns remain null and source references survive.
- Inline analytics duplicates are removed; malformed canonical records cannot reach buildDashboard.

Verification:

- Focused: Run MF parity, impossible-date/negative-value cases and a browser CSV/XLSX worker import on both runtimes.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
MF runs on the new boundary while users retain the current dashboard.

Dependencies:

- V2-004
- V2-005
- V2-006
- V2-007

Blocks:

- V2-010
- V2-014
- V2-021

Suggested commit message:
`refactor(macrofactor): route imports through canonical analytics`

Implementation-agent brief:
Implement V2-008 only. Complete the marked higher-model review before coding; do not replace the stated policy. Make MF normalization produce an import envelope and compose its existing dashboard through shared analytics. Implement the envelope and representation rules above. Stay within the Scope and Explicitly out of scope lists above. Run MF parity, impossible-date/negative-value cases and a browser CSV/XLSX worker import on both runtimes. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-009 — Add a verified anonymized Strong export fixture

Status:
DONE

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: NO

Goal:
Commit a real Strong CSV with a schema manifest before coding the adapter.

Why this task exists:
Strong headers, units and date conventions are not established by this repository.

Scope:

- Obtain a permission-cleared export and anonymize names/notes while preserving structure.
- Document platform/app version when known, export locale, units, timestamp and set-marker conventions.

Explicitly out of scope:

- Do not substitute a guessed schema or label synthetic data as real.
- Do not implement Strong parsing or upload personal archives.

Likely files:

- `tests/fixtures/strong/*`

Implementation guidance:
Official reference: https://help.strongapp.io/article/235-export-workout-data confirms CSV export, not an exact schema. A provided local file is preferable; request a sample if none is available and keep this task blocked. Include at least two workouts and repeated sets from a real export; supplement with explicitly synthetic variants for additional edge cases. Record how weight/distance/time units were verified. Unavailable variants remain unsupported.

Acceptance criteria:

- A real anonymized CSV and its provenance/permission manifest are committed.
- Verified mandatory/optional headers, date format and unit evidence are written down.
- Unknown session-boundary or load conventions are explicitly called out as blockers for affected variants.

Verification:

- Focused: Inspect headers and representative rows against the source file; run existing tests without changing expectations.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Strong work can target an actual contract.

Dependencies:

- None.

Blocks:

- V2-010

Suggested commit message:
`test(strong): add verified export fixture`

Implementation-agent brief:
Implement V2-009 only. Commit a real Strong CSV with a schema manifest before coding the adapter. Official reference: https://help.strongapp.io/article/235-export-workout-data confirms CSV export, not an exact schema. Stay within the Scope and Explicitly out of scope lists above. Inspect headers and representative rows against the source file; run existing tests without changing expectations. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-010 — Detect MacroFactor and Strong from content signatures

Status:
DONE

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: NO

Goal:
Introduce a small pure detector using verified worksheet/header signatures.

Why this task exists:
Users should not select a source when the file content identifies it reliably.

Scope:

- Add inspectInput and detectFormat with macrofactor, strong, ambiguous and unknown outcomes.
- Reuse existing SheetJS decoding and bounds rather than decoding each candidate adapter separately.

Explicitly out of scope:

- Do not parse Strong workouts or add numeric confidence scores.
- Do not rely on filename alone or change the upload UI.

Likely files:

- `lib/import/inspect-input.ts`
- `lib/import/detect-format.ts`
- `lib/training-parser.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Extract the existing bounded decode into inspectInput. Keep the compatibility wrapper using the MF adapter. Use the committed Strong header signature, not the conceptual list from the vision. Ambiguous signatures must list candidates; do not select by detector order. Preserve BOM, quoted CSV and extension/magic mismatch handling, and enforce limits before unnecessary work.

Acceptance criteria:

- Verified MF and Strong fixtures classify correctly despite renamed files.
- Unrelated CSV is unknown; deliberately overlapping signatures are ambiguous.
- Archive/file bounds and MF regression output remain intact.

Verification:

- Focused: Add signature, BOM, renamed-file, ambiguity and invalid-archive tests.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
One inspection can identify the supported source without yet enabling Strong upload.

Dependencies:

- V2-008
- V2-009

Blocks:

- V2-011
- V2-015
- V2-035

Suggested commit message:
`feat(import): detect Strong CSV content`

Implementation-agent brief:
Implement V2-010 only. Introduce a small pure detector using verified worksheet/header signatures. Extract the existing bounded decode into inspectInput. Stay within the Scope and Explicitly out of scope lists above. Add signature, BOM, renamed-file, ambiguity and invalid-archive tests. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-011 — Parse and validate Strong rows with explicit issues

Status:
DONE

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: NO

Goal:
Read verified Strong rows into a typed source-only staging representation.

Why this task exists:
This isolates header/date/numeric quirks before session reconstruction and unit normalization.

Scope:

- Add StrongRow and local ImportIssue values with row numbers/codes.
- Parse source dates and optional numeric values, retaining original cell values and units.

Explicitly out of scope:

- Do not group sessions or emit dashboard data.
- Do not infer ambiguous units, split CSV on commas or silently repair invalid calendar dates.

Likely files:

- `lib/import/adapters/strong-rows.ts`
- `lib/import/value-parsing.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Use decoded cells from inspectInput. Follow the fixture's date grammar, preserving wall time without inventing UTC. Parse finite numbers explicitly; blank optional fields become null and supplied zero remains zero. Invalid required dates/names skip a row with an issue. Optional malformed values become null with warnings. Return needs-input for unresolved date/unit settings; normalize physical units only in V2-013.

Acceptance criteria:

- Quoted multiline notes remain intact and source row numbers are correct.
- Negative reps, invalid dates, NaN/infinity and missing names cannot become valid rows.
- Zero load is distinguishable from absent load; warnings do not expose content through remote logging.

Verification:

- Focused: Test the real fixture plus blank, malformed, zero and ambiguous-date rows.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Strong CSV can be inspected and explained without creating workouts yet.

Dependencies:

- V2-010

Blocks:

- V2-012

Suggested commit message:
`feat(strong): parse validated export rows`

Implementation-agent brief:
Implement V2-011 only. Read verified Strong rows into a typed source-only staging representation. Use decoded cells from inspectInput. Stay within the Scope and Explicitly out of scope lists above. Test the real fixture plus blank, malformed, zero and ambiguous-date rows. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-012 — Reconstruct Strong sessions and preserve detailed sets

Status:
DONE

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: NO

Goal:
Group typed Strong rows into source-faithful sessions, repeated exercise blocks and ordered sets.

Why this task exists:
Multiple workouts per day and set detail cannot be represented by MF-style daily totals alone.

Scope:

- Introduce the minimal detailed types described in the introduction.
- Implement grouping with explicit boundary evidence and stable import-local IDs.

Explicitly out of scope:

- Do not merge identical set rows or group only by calendar date.
- Do not invent missing timestamps, convert loads or implement an exercise ontology.

Likely files:

- `lib/domain/strength.ts`
- `lib/import/adapters/strong-sessions.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Use source session IDs if verified; otherwise use the fixture's full workout timestamp plus title and contiguous boundary evidence. Preserve repeated exercise blocks when names recur after another exercise. Set-order reset may indicate another block; if evidence cannot distinguish blocks/workouts, produce an ambiguity issue instead of silently joining. Retain original set order/type, notes, completion if supplied and row references; missing completion is unknown. IDs derive from import identity plus stable group/row positions, never exercise display labels.

Acceptance criteria:

- Two verified workouts on one day remain two sessions.
- A/B/A exercise blocks remain three performances.
- Repeated equal sets remain separate; total source-row accounting is auditable.
- Ambiguous boundaries are reported rather than asserted as known sessions.

Verification:

- Focused: Test two-a-day, repeated exercise, set-order reset, identical sets and missing boundary evidence.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Detailed Strong history is retained independently of its eventual daily charts.

Dependencies:

- V2-011

Blocks:

- V2-013

Suggested commit message:
`feat(strong): reconstruct sessions and ordered sets`

Implementation-agent brief:
Implement V2-012 only. Group typed Strong rows into source-faithful sessions, repeated exercise blocks and ordered sets. Use source session IDs if verified; otherwise use the fixture's full workout timestamp plus title and contiguous boundary evidence. Stay within the Scope and Explicitly out of scope lists above. Test two-a-day, repeated exercise, set-order reset, identical sets and missing boundary evidence. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-013 — Normalize Strong measurements into canonical units

Status:
DONE

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: NO

Goal:
Convert staged Strong measurements into canonical detailed records without losing original conventions.

Why this task exists:
Shared analytics cannot safely compare kg and lb or mistake assistance for external resistance.

Scope:

- Add kg/lb, meters and seconds conversions for fixture-verified units.
- Finalize the Strong adapter output, options and post-normalization validation.

Explicitly out of scope:

- Do not guess unitless weight, double dumbbells or add bodyweight to external load.
- Do not derive e1RM, muscle exposure or PRs.

Likely files:

- `lib/import/units.ts`
- `lib/import/adapters/strong.ts`
- `lib/domain/strength.ts`
- `lib/import/validation.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Use 1 lb = 0.45359237 kg without rounding stored values. Keep raw values/units and load basis external/assistance/combined/unknown. For an undocumented unit require explicit options; conflicting row/global units produce issues. Convert duration strings only according to the verified field grammar; session duration must not be copied into every set. Preserve distance-only and timed sets, RPE/RIR and unknown set markers. MF optional fields remain untouched.

Acceptance criteria:

- 100 lb normalizes to 45.359237 kg within floating-point tolerance.
- Blank, zero and positive load survive as distinct states.
- Timed/distance records remain valid without fabricated reps.
- Adapter output passes canonical validation and retains source rows.

Verification:

- Focused: Test round trips/tolerances, mixed/unknown units, duration and assistance fixtures.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Strong produces detailed canonical facts ready for shared analytics.

Dependencies:

- V2-012

Blocks:

- V2-014
- V2-036
- V2-047

Suggested commit message:
`feat(strong): normalize training measurements`

Implementation-agent brief:
Implement V2-013 only. Convert staged Strong measurements into canonical detailed records without losing original conventions. Use 1 lb = 0.45359237 kg without rounding stored values. Stay within the Scope and Explicitly out of scope lists above. Test round trips/tolerances, mixed/unknown units, duration and assistance fixtures. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-014 — Project detailed Strong history into shared daily analytics

Status:
DONE

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: NO

Goal:
Add a source-independent detailed-session-to-exercise-day projector and reuse buildDashboard.

Why this task exists:
This proves the shared model in tests before connecting another browser import route.

Scope:

- Create projectExerciseDays(sessions), used for any detailed adapter.
- Make buildDashboard choose detailed projection or aggregate facts once per import.

Explicitly out of scope:

- Do not add source checks in analytics or synthesize muscle data.
- Do not change current MF formulas or enable additive imports.

Likely files:

- `lib/analytics/project-exercise-days.ts`
- `lib/analytics/build-dashboard.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Group valid sets by date, exerciseId and comparisonKey. Count recorded sets using the existing inclusive convention initially; sum known reps/load×reps and preserve all-missing as null. Max known paired set load/reps as appropriate; no artificial e1RM. Carry provenance into derived day IDs/references. A detailed import's cached exerciseDays must never also be summed. Do not sum session duration as set duration. Keep legacy display totals localized at the view projection.

Acceptance criteria:

- Strong fixture yields expected daily sets/reps/load and existing dashboard fields.
- 80×8, 80×8, 80×7 yields 3 sets, 23 reps and 1840 kg·reps.
- Equivalent aggregate MF facts produce matching comparable metrics.
- A detailed import cannot double-count its own derived days.

Verification:

- Focused: Add cross-source comparable-metric and missing-measurement tests; rerun MF parity.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Strong already powers the same analytics in a headless test.

Dependencies:

- V2-008
- V2-013

Blocks:

- V2-015
- V2-018

Suggested commit message:
`feat(analytics): project detailed sessions into exercise days`

Implementation-agent brief:
Implement V2-014 only. Add a source-independent detailed-session-to-exercise-day projector and reuse buildDashboard. Group valid sets by date, exerciseId and comparisonKey. Stay within the Scope and Explicitly out of scope lists above. Add cross-source comparable-metric and missing-measurement tests; rerun MF parity. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-015 — Render Strong imports in the existing dashboard

Status:
TODO

Milestone:
M3 — Strong drives the existing dashboard

Manual checkpoint: YES

Goal:
Connect detection and adapters to the browser worker and replace-upload flow.

Why this task exists:
This is the first visible Strong-powered Ripper checkpoint.

Scope:

- Return ImportOutcome containing canonical import, dashboard and bounded issues.
- Offer only necessary source/unit/date choices and show source-neutral upload labels.

Explicitly out of scope:

- Do not add multi-file import, append, IndexedDB or new chart designs.
- Do not send the richer ImportOutcome to AI or localStorage wholesale.

Likely files:

- `lib/training-parser.worker.ts`
- `lib/import-training-file.ts`
- `lib/import/parse-import.ts`
- `app/page.tsx`
- `components/import/import-options.tsx`

Implementation guidance:
Keep a single canonical import in RAM; save only the existing dashboard snapshot. Explain that refresh currently restores charts, not editable import history. Preserve revision/abort behavior, retain the old dashboard until valid replacement, and surface all-invalid/unsupported errors. Minimal options may use a native dialog with cancel and focus restoration. Inspect current UI diffs; preserve classes/tokens. Use existing chart components without Strong-specific branches. Do not create a permanent worker test route. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Verified Strong CSV renders explorer, frequency, workhorses and applicable highlights.
- MF CSV/XLSX still import through the same entry point.
- Unknown units require a choice; cancellation leaves the prior dashboard intact.
- No raw file, sets or notes appear in network requests or the persisted dashboard.

Verification:

- Focused: Open Ripper: import MF, replace with Strong, inspect charts, cancel a new import, refresh and verify the stated snapshot limitation; smoke both worker builds.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Users can see real Strong history in the existing Ripper dashboard.

Dependencies:

- V2-010
- V2-014

Blocks:

- V2-016
- V2-029
- V2-050

Suggested commit message:
`feat(import): render Strong training exports`

Implementation-agent brief:
Implement V2-015 only. Connect detection and adapters to the browser worker and replace-upload flow. Keep a single canonical import in RAM; save only the existing dashboard snapshot. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Open Ripper: import MF, replace with Strong, inspect charts, cancel a new import, refresh and verify the stated snapshot limitation; smoke both worker builds. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-016 — Resolve a small set of known exercise identities

Status:
TODO

Milestone:
M4 — One exercise history across two sources

**REQUIRES HIGHER-MODEL REVIEW**

Manual checkpoint: NO

Goal:
Add deterministic source mappings and conservative aliases for a small verified catalog.

Why this task exists:
Equivalent MF/Strong bench records need one identity without collapsing different movements or load conventions.

Scope:

- Add builtin IDs/display names and source mapping tables for fixture exercises.
- Implement override -> source mapping -> exact name -> normalized alias -> custom resolution.

Explicitly out of scope:

- Do not build a comprehensive ontology, fuzzy matching or muscle coefficients.
- Do not treat common identity as proof of comparable machine/per-hand loads.

Likely files:

- `lib/exercises/catalog.ts`
- `lib/exercises/resolve.ts`
- `lib/exercises/source-mappings.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Implement barbell_bench_press for the verified MF Barbell Bench Press and Strong Bench Press (Barbell). Preserve equipment, angle, stance and custom machine identifiers in normalization. Resolve collisions to custom, never first match. Custom IDs are source-scoped and stable across reimports; overrides can explicitly keep custom. Return method and mapping version. Promote comparisonKey only where fixture evidence verifies the same total external-load semantics; otherwise keep source-scoped comparison keys.

Acceptance criteria:

- The two verified bench names resolve to barbell_bench_press.
- Dumbbell/incline/front-squat/Romanian variants do not collapse into barbell/flat/back/conventional.
- Same movement with unknown load basis retains separate comparison keys.
- No unresolved record is discarded.

Verification:

- Focused: Add positive aliases, dangerous near-matches, normalization idempotence and override precedence tests.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Known identity matches are deterministic and reversible.

Dependencies:

- V2-015

Blocks:

- V2-017
- V2-018
- V2-020

Suggested commit message:
`feat(exercises): resolve verified source aliases`

Implementation-agent brief:
Implement V2-016 only. Complete the marked higher-model review before coding; do not replace the stated policy. Add deterministic source mappings and conservative aliases for a small verified catalog. Implement barbell_bench_press for the verified MF Barbell Bench Press and Strong Bench Press (Barbell). Stay within the Scope and Explicitly out of scope lists above. Add positive aliases, dangerous near-matches, normalization idempotence and override precedence tests. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-017 — Key dashboard exercise selection by stable identity

Status:
TODO

Milestone:
M4 — One exercise history across two sources

Manual checkpoint: YES

Goal:
Carry exercise IDs and comparison keys into dashboard view models and use them for selection.

Why this task exists:
Display names must stop controlling whether history joins or selection survives imports.

Scope:

- Add explicit exerciseId/comparisonKey/seriesId to exercise view data.
- Update explorer, comparison controls and React keys to stable series IDs.

Explicitly out of scope:

- Do not restyle charts or redesign comparison-context UI.
- Do not join different comparison keys just because display names match.

Likely files:

- `lib/analytics/dashboard-types.ts`
- `lib/analytics/exercises.ts`
- `app/page.tsx`
- `scripts/test-training-parser.mjs`
- `lib/import/parse-import.ts`

Implementation guidance:
Group identity-resolved facts by exerciseId plus comparisonKey. Wire the resolver at parse-import/history preparation before buildDashboard, not as source checks in analytics. Keep displayName only for labels and show a small source/setup suffix when one movement has multiple series. Update selected/comparison state lookups surgically after reading the UI diff. On replacement choose a valid fallback ID. Preserve all formulas and chart layout. Legacy snapshot views may get derived display-only IDs on restore until V2-031 removes legacy restore. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Renaming a label does not change current-series identity.
- Two distinct custom exercises sharing a label remain selectable separately.
- MF and Strong bench data with verified comparable keys select the same series identity.

Verification:

- Focused: Test duplicate display names and replacement fallback; manually inspect explorer selection and comparison.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Dashboard identity is ready for joined histories.

Dependencies:

- V2-016

Blocks:

- V2-019
- V2-041

Suggested commit message:
`refactor(dashboard): select exercises by stable IDs`

Implementation-agent brief:
Implement V2-017 only. Carry exercise IDs and comparison keys into dashboard view models and use them for selection. Group identity-resolved facts by exerciseId plus comparisonKey. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test duplicate display names and replacement fallback; manually inspect explorer selection and comparison. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-018 — Combine non-overlapping canonical imports in memory

Status:
TODO

Milestone:
M4 — One exercise history across two sources

Manual checkpoint: NO

Goal:
Add a pure history combiner supporting disjoint-date imports for the first multi-source proof.

Why this task exists:
This gives a useful safe subset of additive import without solving duplicate reconciliation first.

Scope:

- Represent loaded history as a small array of import envelopes.
- Resolve identities before composing the shared dashboard.

Explicitly out of scope:

- Do not accept overlapping dates, implement fuzzy duplicates or persist canonical data.
- Do not merge derived dashboard snapshots.

Likely files:

- `lib/history/combine-imports.ts`
- `lib/analytics/build-dashboard.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Initially reject an added import when any represented training date intersects existing dates; report overlap and retain existing history. This intentionally conservative gate includes different exercises on the same day. Combine source muscle ledgers only within known compatible source models; in this proof MF ledger remains explicitly MF-reported, not full-history muscle coverage. Do not duplicate detailed days. V2-025/026 will replace the blanket overlap gate.

Acceptance criteria:

- Disjoint MF + Strong fixtures produce one chronological dashboard.
- Bench series has both source periods when identity and comparison semantics agree.
- Any date intersection returns a conflict without mutating either input.

Verification:

- Focused: Assert combined dates, summed sets and one bench series; test rollback-on-overlap.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Multi-source composition works through a bounded pure function.

Dependencies:

- V2-014
- V2-016

Blocks:

- V2-019
- V2-025

Suggested commit message:
`feat(history): combine disjoint source histories`

Implementation-agent brief:
Implement V2-018 only. Add a pure history combiner supporting disjoint-date imports for the first multi-source proof. Initially reject an added import when any represented training date intersects existing dates; report overlap and retain existing history. Stay within the Scope and Explicitly out of scope lists above. Assert combined dates, summed sets and one bench series; test rollback-on-overlap. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-019 — Expose Add data for the first unified history

Status:
TODO

Milestone:
M4 — One exercise history across two sources

Manual checkpoint: YES

Goal:
Allow a second non-overlapping import to extend the currently loaded canonical history.

Why this task exists:
This is the central visible proof: changing logging apps no longer ends exercise history.

Scope:

- Add explicit Add data and Replace actions using the in-memory combiner.
- Show source list and the temporary reload/persistence limitation.

Explicitly out of scope:

- Do not silently append on replacement or add complex conflict resolution.
- Do not append to a dashboard-only restored snapshot.

Likely files:

- `app/page.tsx`
- `lib/import-training-file.ts`
- `lib/history/combine-imports.ts`

Implementation guidance:
Read current UI diffs before minimal functional changes. Keep the candidate separate until parse/validation/combine succeeds. Clear stale AI on accepted changes. On snapshot-only restore disable Add and explain reimport is needed; Replace remains available. Do not add unsupported source filtering inside charts. Present overlap as 'These histories share training dates; adding overlaps is not supported yet.' Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Import older MF then newer Strong: one bench series spans both periods.
- Replacing still replaces; failed/cancelled/overlapping Add preserves the previous render.
- The temporary limitation is visible before users depend on refresh.

Verification:

- Focused: Manual checkpoint: add the verified disjoint fixtures, inspect bench progression and total dates, then test replace, overlap and refresh.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
MF + Strong histories are visibly unified before storage infrastructure.

Dependencies:

- V2-017
- V2-018

Blocks:

- V2-020
- V2-022
- V2-023
- V2-030

Suggested commit message:
`feat(history): add training data to the current dashboard`

Implementation-agent brief:
Implement V2-019 only. Allow a second non-overlapping import to extend the currently loaded canonical history. Read current UI diffs before minimal functional changes. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Manual checkpoint: add the verified disjoint fixtures, inspect bench progression and total dates, then test replace, overlap and refresh. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-020 — Allow explicit exercise mappings and keep-custom choices

Status:
TODO

Milestone:
M4 — One exercise history across two sources

Manual checkpoint: YES

Goal:
Provide a small mapping editor for unresolved exercise names in the loaded history.

Why this task exists:
Users can resolve actual custom names without a mandatory spreadsheet or fuzzy matching.

Scope:

- Offer choose builtin, keep custom and reset override for one exercise at a time.
- Re-resolve and rebuild the loaded history after confirmation.

Explicitly out of scope:

- Do not add fuzzy suggestions, automatic machine load merging or durable storage yet.
- Do not require every unresolved exercise to be mapped before import.

Likely files:

- `components/import/exercise-mapping-dialog.tsx`
- `lib/exercises/resolve.ts`
- `app/page.tsx`

Implementation guidance:
Use source + exact raw exercise name as the override key. Keep custom is a persistent decision in the current RAM map, not a missing mapping. Identity override must not change comparisonKey unless comparability was already verified. Explain that these choices last only for the current session until V2-032. Dialog must support keyboard cancel and focus return. Inspect existing UI changes. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Override wins on the next import in this browser session.
- Keep custom preserves history and reset restores deterministic automatic mapping.
- Changing identity recalculates charts and invalidates AI without modifying retained source names.

Verification:

- Focused: Test override round trip and reset; manually map and unmap one fixture exercise with keyboard controls.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Real custom exercise names can participate without unsafe automatic guesses.

Dependencies:

- V2-016
- V2-019

Blocks:

- V2-032

Suggested commit message:
`feat(exercises): add explicit mapping overrides`

Implementation-agent brief:
Implement V2-020 only. Provide a small mapping editor for unresolved exercise names in the loaded history. Use source + exact raw exercise name as the override key. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test override round trip and reset; manually map and unmap one fixture exercise with keyboard controls. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-021 — Remove the divergent offline dashboard generator

Status:
TODO

Milestone:
M4 — One exercise history across two sources

Manual checkpoint: NO

Goal:
Make refresh:data use the same parser/normalizer and analytics as the browser.

Why this task exists:
The old CLI would otherwise keep reintroducing incompatible aliases and metric definitions.

Scope:

- Replace duplicate CLI calculations with the shared pipeline.
- Require an explicit local output path and update usage instructions.

Explicitly out of scope:

- Do not add source features or change analytics to match old CLI results.
- Do not write personal training output into tracked app/training-data.json.

Likely files:

- `scripts/refresh-training-data.mjs`
- `README.md`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Browser parity is authoritative. Preserve a useful CLI invocation but default no output into app/public. Refuse tracked bundle destinations for personal input; use a temporary local path in tests. Document deliberate differences from the legacy script. Keep the bundled empty/demo file untouched. Use the runtime import convention already proven by tests.

Acceptance criteria:

- CLI and browser pipeline yield equal dashboard values excluding generatedAt.
- No duplicate parsing/analytics implementation remains in refresh:data.
- README no longer recommends bundling personal exports.

Verification:

- Focused: Run CLI on committed fixtures into a temporary directory and compare output.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
One implementation now powers both supported entry points.

Dependencies:

- V2-008

Blocks:

- V2-039

Suggested commit message:
`refactor(cli): reuse the shared training pipeline`

Implementation-agent brief:
Implement V2-021 only. Make refresh:data use the same parser/normalizer and analytics as the browser. Browser parity is authoritative. Stay within the Scope and Explicitly out of scope lists above. Run CLI on committed fixtures into a temporary directory and compare output. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-022 — Label training days separately from known workouts

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: YES

Goal:
Correct the existing session label while preserving historical daily-frequency calculations.

Why this task exists:
Strong reveals multiple sessions on one date, so the current label becomes demonstrably misleading.

Scope:

- Label existing frequency counts as training days.
- Add a known detailed-workout count with partial/unknown status for aggregate history.

Explicitly out of scope:

- Do not change daily frequency formulas, attendance or all chart designs.
- Do not estimate the number of MF workouts from aggregate days.

Likely files:

- `lib/analytics/dashboard-types.ts`
- `lib/analytics/consistency.ts`
- `app/page.tsx`
- `app/about/page.tsx`

Implementation guidance:
Keep legacy field names internally if renaming would broaden the diff. Expose count basis explicitly in the view model. Two Strong sessions on one day mean one training day and two known workouts; mixed MF history must not label the known subset as total workouts. Update affected labels/tooltips only after checking UI diffs. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Existing MF numerical frequency values are unchanged and correctly labelled.
- Two-a-day Strong fixture shows one training day and two known sessions.
- Mixed fidelity does not invent total session counts.

Verification:

- Focused: Assert count basis and manually inspect headline/frequency copy.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Users can interpret combined history accurately.

Dependencies:

- V2-019

Blocks:

- V2-027

Suggested commit message:
`fix(analytics): distinguish training days from workouts`

Implementation-agent brief:
Implement V2-022 only. Correct the existing session label while preserving historical daily-frequency calculations. Keep legacy field names internally if renaming would broaden the diff. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Assert count basis and manually inspect headline/frequency copy. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-023 — Stage replacement and addition behind an import preview

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: YES

Goal:
Add a candidate preview that commits changes only after explicit acceptance.

Why this task exists:
Units, warnings and mapping uncertainty need a review point before growing history.

Scope:

- Preview source, date range, training days/known sessions, sets, mapped/custom counts and issues.
- Keep candidate state separate from active canonical history.

Explicitly out of scope:

- Do not add duplicate heuristics, multi-file queues or mandatory mapping review.
- Do not send preview data to a server or restyle the surrounding dashboard.

Likely files:

- `components/import/import-preview.tsx`
- `lib/import/import-preview.ts`
- `app/page.tsx`

Implementation guidance:
Reuse ImportOutcome and existing options/mapping UI. Report counts with their fidelity labels. Offer Import valid rows when recoverable issues exist; disable acceptance for unresolved required units/boundaries or no valid records. Replacing must state that it replaces current history. Cancel preserves charts and mappings. Small surgical page edits only. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Preview totals match the candidate records.
- No active state changes before acceptance.
- Cancelled or invalid candidate leaves history, selections and saved snapshot unchanged.

Verification:

- Focused: Test preview counts; inspect clean, warning, fatal and cancelled flows with MF and Strong.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Import is now understandable before it changes the dashboard.

Dependencies:

- V2-019

Blocks:

- V2-024
- V2-026

Suggested commit message:
`feat(import): preview training data before applying`

Implementation-agent brief:
Implement V2-023 only. Add a candidate preview that commits changes only after explicit acceptance. Reuse ImportOutcome and existing options/mapping UI. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test preview counts; inspect clean, warning, fatal and cancelled flows with MF and Strong. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-024 — Skip identical file imports using content hashes

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: NO

Goal:
Detect byte-identical previously accepted files before parsing them again.

Why this task exists:
This cheaply prevents the most common accidental duplicate.

Scope:

- Compute SHA-256 once per input in the worker.
- Store accepted content hashes in the import envelope and preview no-op results.

Explicitly out of scope:

- Do not hash only the filename or implement workout similarity.
- Do not remove repeated identical set rows.

Likely files:

- `lib/import/file-identity.ts`
- `lib/import/parse-import.ts`
- `lib/history/combine-imports.ts`
- `components/import/import-preview.tsx`

Implementation guidance:
Hash raw bytes locally before releasing them. Filename changes do not affect identity. A hash becomes accepted only when the candidate is committed. Failed/cancelled imports must not poison the registry. This exact-file check is independent of later record fingerprints. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Reimporting the same bytes under another name adds nothing.
- A cancelled first import can later be accepted.
- A changed file is parsed, not declared identical.

Verification:

- Focused: Test renamed duplicate, changed byte and cancel/retry paths.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Repeat file uploads are safe no-ops.

Dependencies:

- V2-023

Blocks:

- V2-025
- V2-028

Suggested commit message:
`feat(import): skip previously imported files`

Implementation-agent brief:
Implement V2-024 only. Detect byte-identical previously accepted files before parsing them again. Hash raw bytes locally before releasing them. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test renamed duplicate, changed byte and cancel/retry paths. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-025 — Reconcile verified same-source incremental exports

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

**REQUIRES HIGHER-MODEL REVIEW**

Manual checkpoint: NO

Goal:
Replace the blanket date-overlap rejection for proven same-source re-exports with conservative reconciliation.

Why this task exists:
Users need to import an updated all-history export without doubling old history.

Scope:

- Add versioned fingerprints for source sessions and aggregate observation scopes.
- Create a pure candidate reconciliation result: unchanged, added or conflicting.

Explicitly out of scope:

- Do not auto-deduplicate across sources or match by date alone.
- Do not auto-apply edited workouts or delete old records missing from a new file.

Likely files:

- `lib/history/fingerprints.ts`
- `lib/history/reconcile-imports.ts`
- `lib/history/combine-imports.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Prefer verified stable source session IDs. Without them, use full original timestamp/title plus ordered exercise blocks, set values/types and explicit unit/basis after canonical normalization; exclude filename, import time and mapped display labels. Same-source identical payloads may skip; same locator with changed content becomes conflict. Aggregate fingerprints use source/date/raw exercise/metric scope and original values, not a synthetic workout. Date-only detailed boundaries remain ambiguous. Comparing source-profile identity is local history scope; no account system. Preserve repeated sets within sessions.

Acceptance criteria:

- Jan history + March superset adds only new facts when unchanged identity is provable.
- Edited existing records produce a conflict; missing records are retained.
- Changing user aliases does not alter fingerprints.
- Reimport order cannot double source aggregate and detailed projections.

Verification:

- Focused: Test exact re-export, reordered sessions, edits, missing old sessions, two-a-day and aggregate observations.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Verified incremental updates work without broad duplicate guessing.

Dependencies:

- V2-018
- V2-024

Blocks:

- V2-026
- V2-028
- V2-030

Suggested commit message:
`feat(history): reconcile same-source reexports`

Implementation-agent brief:
Implement V2-025 only. Complete the marked higher-model review before coding; do not replace the stated policy. Replace the blanket date-overlap rejection for proven same-source re-exports with conservative reconciliation. Prefer verified stable source session IDs. Stay within the Scope and Explicitly out of scope lists above. Test exact re-export, reordered sessions, edits, missing old sessions, two-a-day and aggregate observations. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-026 — Resolve remaining overlaps explicitly in preview

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: YES

Goal:
Let users choose a conservative outcome for overlaps that cannot be proved duplicates.

Why this task exists:
This unlocks mixed-source imports without silently double-counting migrated histories.

Scope:

- Show grouped overlapping date/source ranges with keep-existing or use-incoming options.
- Allow keep-both only with an explicit double-counting explanation.

Explicitly out of scope:

- Do not add cross-source automatic deduplication, fuzzy matching or undo history.
- Do not compare aggregate days to fabricated session structures.

Likely files:

- `lib/history/reconcile-imports.ts`
- `components/import/import-conflicts.tsx`
- `components/import/import-preview.tsx`
- `app/page.tsx`

Implementation guidance:
Group conflicts at a complete affected date scope initially, including exercise facts and source muscle observations, so selecting incoming cannot leave stale half-day totals. Explain this coarse scope before confirmation. Distinct verified source IDs may coexist, but aggregate/detail overlap stays a conflict. Keep-both must remain visibly marked; unknown load contexts remain separate. Do not mutate active imports while changing preview choices. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- MF aggregate + overlapping Strong details never silently sum.
- Each choice has deterministic totals and retained provenance.
- Cancellation restores the untouched active dataset; affected dates are clearly listed.

Verification:

- Focused: Test aggregate/detail overlap, two legitimate same-day workouts and all preview choices; inspect conflict UI.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Users can resolve overlap safely with a deliberately simple policy.

Dependencies:

- V2-023
- V2-025

Blocks:

- V2-027
- V2-028

Suggested commit message:
`feat(import): review unresolved history overlaps`

Implementation-agent brief:
Implement V2-026 only. Let users choose a conservative outcome for overlaps that cannot be proved duplicates. Group conflicts at a complete affected date scope initially, including exercise facts and source muscle observations, so selecting incoming cannot leave stale half-day totals. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test aggregate/detail overlap, two legitimate same-day workouts and all preview choices; inspect conflict UI. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-027 — Show a compact local import report

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: NO

Goal:
Summarize exactly what was added, skipped and left unresolved after acceptance.

Why this task exists:
Debugging imports should not require raw console dumps or inspecting hundreds of exercises.

Scope:

- Build report counts from reconciliation decisions, not pre-parse row counts.
- Add a local issue list and copyable redacted diagnostic summary.

Explicitly out of scope:

- Do not add telemetry, raw-note logging or a full audit database.
- Do not claim full-history muscle coverage when only MF supplied it.

Likely files:

- `lib/import/import-report.ts`
- `components/import/import-report.tsx`
- `app/page.tsx`

Implementation guidance:
Report files/sources, known workouts/training days, sets, duplicates, conflict choices, mapping counts and warning codes. Use bounded issue examples with row numbers. Copyable diagnostics exclude filenames, exercise names, notes and exact training dates by default. Detailed issues stay local. Keep report generation pure and inspect shared UI diffs. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Reported totals match the committed change, including no-op imports.
- No skipped row is counted as imported.
- Copyable diagnostics contain no fixture private markers.

Verification:

- Focused: Test counts across clean, partial, duplicate and conflict imports; inspect report after acceptance.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Each import produces a useful explanation.

Dependencies:

- V2-022
- V2-026

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`feat(import): report accepted changes and warnings`

Implementation-agent brief:
Implement V2-027 only. Summarize exactly what was added, skipped and left unresolved after acceptance. Report files/sources, known workouts/training days, sets, duplicates, conflict choices, mapping counts and warning codes. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test counts across clean, partial, duplicate and conflict imports; inspect report after acceptance. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-028 — Accept multiple files in one staged import

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: YES

Goal:
Extend the proven single-file path to a bounded sequential batch.

Why this task exists:
The upload affordance can now match the source-independent product vision.

Scope:

- Enable multiple selection/drop and show per-file status.
- Stage each accepted file against the candidate batch history before one final acceptance.

Explicitly out of scope:

- Do not parallelize large workbook decoding or build batch undo.
- Do not commit half a batch without an explicit partial-import choice.

Likely files:

- `components/import/import-dropzone.tsx`
- `lib/import/import-batch.ts`
- `components/import/import-preview.tsx`
- `app/page.tsx`

Implementation guidance:
Reuse detection, hash checks, parser, resolver and reconciliation per file. Keep concurrency one initially; check file limits before work. An unknown/bad file leaves other valid candidates reviewable. Cancel discards the entire uncommitted batch. Compare duplicates against earlier files in that same batch as well as active history. Use current styles and accessible browse fallback. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- MF + Strong can be selected together and previewed as one change.
- Duplicate files in a batch add nothing twice.
- One malformed file does not erase valid candidates or active data.
- Memory is bounded by sequential decoding and existing limits.

Verification:

- Focused: Test mixed batch, intra-batch duplicate, one bad file and cancellation; manually drag/drop and browse.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Multiple exports enter the same understandable import flow.

Dependencies:

- V2-024
- V2-025
- V2-026

Blocks:

- V2-029

Suggested commit message:
`feat(import): stage multiple training files`

Implementation-agent brief:
Implement V2-028 only. Extend the proven single-file path to a bounded sequential batch. Reuse detection, hash checks, parser, resolver and reconciliation per file. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test mixed batch, intra-batch duplicate, one bad file and cancellation; manually drag/drop and browse. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-029 — Exercise real cancellation and stale-result races

Status:
TODO

Milestone:
M5 — Imports become additive and explainable

Manual checkpoint: YES

Goal:
Harden the import controller with tests that simulate the actual asynchronous flow.

Why this task exists:
Existing request-guard tests only test a boolean helper; richer import state needs behavioral coverage.

Scope:

- Extract only the small import-operation state/controller needed for testing.
- Guard worker successes/errors, preview acceptance, clear and AI invalidation with operation identity.

Explicitly out of scope:

- Do not rewrite all React state or adopt a global store.
- Do not alter visual loading components beyond correct state and actions.

Likely files:

- `lib/import/import-controller.ts`
- `lib/import-training-file.ts`
- `app/page.tsx`
- `scripts/test-import-controller.mjs`

Implementation guidance:
Use a fake worker/controlled promises in a focused Node test, plus a browser smoke test. Resolve old request A after B succeeds and ensure it cannot overwrite history or errors. Clear/cancel must terminate active work and reset busy state, including failed replacement after AI abort. Candidate identity must be rechecked at acceptance. Preserve the user's page changes. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Late successes and late failures cannot mutate a newer dataset.
- Cancel, clear and failed replacement leave no stuck generating/processing state.
- No worker remains active after completion or unmount.

Verification:

- Focused: Run controlled race tests and manually cancel a large fixture in both worker runtimes.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Additive import remains responsive and consistent under interruption.

Dependencies:

- V2-015
- V2-028

Blocks:

- V2-031
- V2-050

Suggested commit message:
`fix(import): guard candidate state against stale results`

Implementation-agent brief:
Implement V2-029 only. Harden the import controller with tests that simulate the actual asynchronous flow. Use a fake worker/controlled promises in a focused Node test, plus a browser smoke test. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Run controlled race tests and manually cancel a large fixture in both worker runtimes. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-030 — Add a small transactional canonical-history store

Status:
TODO

Milestone:
M6 — Keep canonical history between visits

**REQUIRES HIGHER-MODEL REVIEW**

Manual checkpoint: NO

Goal:
Persist canonical facts in IndexedDB now that additive histories have a concrete durability requirement.

Why this task exists:
This replaces RAM-only history without introducing repositories or extensive migration machinery.

Scope:

- Add one database with a state store for schema/version/current history and mappings.
- Use an atomic transaction to replace the current accepted state.

Explicitly out of scope:

- Do not index every set, store whole raw files or build general migrations.
- Do not yet change page restore or migrate old dashboard summaries into fake facts.

Likely files:

- `lib/storage/training-store.ts`
- `lib/storage/stored-history.ts`
- `scripts/test-training-store.mjs`

Implementation guidance:
Use a schemaVersion:1 envelope and IndexedDB database version1. Store aggregate days for aggregate imports and nested sessions for detailed imports; omit rebuildable detailed-day projections. Retain compact relevant source rows once per import. Expose load/save/clear and explicit unsupported/quota errors. Validate on read and before write. Prefer native IndexedDB and a tiny transaction helper; test in a browser harness if no suitable existing fake exists. A single state document is acceptable at current measured scale; V2-049 determines whether splitting stores is needed.

Acceptance criteria:

- A failed save leaves the previously committed state intact.
- Read/write round trip preserves null, zero, identities, units and source detail.
- Unknown schema versions return a recoverable incompatibility outcome.
- No training data is sent over the network.

Verification:

- Focused: Test real IndexedDB save/load/clear and forced transaction failure in a local browser.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Canonical history has a small transactional storage boundary.

Dependencies:

- V2-019
- V2-025

Blocks:

- V2-031

Suggested commit message:
`feat(storage): persist canonical training history`

Implementation-agent brief:
Implement V2-030 only. Complete the marked higher-model review before coding; do not replace the stated policy. Persist canonical facts in IndexedDB now that additive histories have a concrete durability requirement. Use a schemaVersion:1 envelope and IndexedDB database version1. Stay within the Scope and Explicitly out of scope lists above. Test real IndexedDB save/load/clear and forced transaction failure in a local browser. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-031 — Restore canonical history and retire legacy snapshot restore

Status:
TODO

Milestone:
M6 — Keep canonical history between visits

Manual checkpoint: YES

Goal:
Connect the canonical store to startup, accepted imports and clear.

Why this task exists:
Users should be able to continue adding data after reload without re-uploading old files.

Scope:

- Rebuild DashboardData from stored facts on load.
- Offer a simple reimport/reset notice for old dashboard-only localStorage data.

Explicitly out of scope:

- Do not reverse-engineer raw workouts from saved charts or preserve every legacy UI state.
- Do not silently erase a valid stored history on quota/parse errors.

Likely files:

- `app/page.tsx`
- `lib/training-snapshot.mjs`
- `lib/storage/training-store.ts`
- `lib/import/import-controller.ts`

Implementation guidance:
New saves are atomic before being labelled saved. If storage fails, offer explicit session-only continuation with clear status while retaining the old saved version. Do not silently save an older dashboard over new facts. Legacy v3 snapshots can be shown as an optional temporary read-only preview with reimport prompt, or reset by explicit choice; never treat them as canonical input. Remove the V2-015/019 refresh restriction once canonical restore succeeds. Clear must affect both old and new keys and abort active work. Inspect UI diffs. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Reload restores a combined history and Add remains available.
- Legacy snapshot users get a clear reimport/reset path without fabricated sessions.
- Quota/corruption/unknown-version failures keep a usable recovery screen.
- Clear removes persisted history and current state coherently.

Verification:

- Focused: Manual checkpoint: combine, reload, append, simulate blocked storage, restore legacy key and clear.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Returning users retain canonical history without a complex migration project.

Dependencies:

- V2-029
- V2-030

Blocks:

- V2-032
- V2-033
- V2-045

Suggested commit message:
`feat(storage): restore canonical history on startup`

Implementation-agent brief:
Implement V2-031 only. Connect the canonical store to startup, accepted imports and clear. New saves are atomic before being labelled saved. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Manual checkpoint: combine, reload, append, simulate blocked storage, restore legacy key and clear. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-032 — Persist user mapping overrides with history

Status:
TODO

Milestone:
M6 — Keep canonical history between visits

Manual checkpoint: YES

Goal:
Make confirmed mappings and keep-custom choices survive reload and later imports.

Why this task exists:
Exercise identity is only useful across time if user decisions are durable.

Scope:

- Persist mappings by source/raw name with decision method and mapping version.
- Apply stored overrides before automatic resolution and rebuild views after edits.

Explicitly out of scope:

- Do not create accounts, cloud sync or fuzzy matching.
- Do not rewrite retained source names or auto-promote load comparability.

Likely files:

- `lib/storage/stored-history.ts`
- `lib/exercises/resolve.ts`
- `components/import/exercise-mapping-dialog.tsx`
- `app/page.tsx`

Implementation guidance:
Save history plus mappings coherently through the existing store transaction. Handle failed saves like V2-031 session-only changes. Support reset override and clear-all mappings with an explicit action distinct from clearing training history; explain whether clear history retains mappings. Default clear history retains mappings, with a separate erase-everything control. Remove RAM-only copy. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- A confirmed alias and keep-custom decision both survive refresh.
- Future matching source names reuse the override.
- Reset returns to the current deterministic resolver and invalidates derived views/AI.

Verification:

- Focused: Test stored override precedence and persistence failure; manually map, refresh and reimport.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
User exercise decisions now last across imports.

Dependencies:

- V2-020
- V2-031

Blocks:

- V2-033
- V2-038

Suggested commit message:
`feat(exercises): persist mapping decisions`

Implementation-agent brief:
Implement V2-032 only. Make confirmed mappings and keep-custom choices survive reload and later imports. Save history plus mappings coherently through the existing store transaction. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test stored override precedence and persistence failure; manually map, refresh and reimport. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-033 — Export and restore a private local backup

Status:
TODO

Milestone:
M6 — Keep canonical history between visits

Manual checkpoint: YES

Goal:
Provide a downloadable versioned JSON backup of current canonical facts and mappings.

Why this task exists:
Local browser storage can be cleared; a small backup is useful before any public interchange specification.

Scope:

- Add backup download and validated restore preview.
- Use ripperBackupVersion:1 with canonical schema metadata.

Explicitly out of scope:

- Do not call this an industry interchange standard or add generic CSV mapping.
- Do not include API keys, AI request state or original raw file bytes.

Likely files:

- `lib/storage/backup.ts`
- `components/import/backup-controls.tsx`
- `lib/import/validation.ts`
- `app/page.tsx`

Implementation guidance:
Export accepted imports and mappings; derived dashboards can be rebuilt. Warn that this local download contains personal training data. Restore replaces current history only after validation and preview; do not route it through training-source detection or merge it automatically. Reject unsupported versions with an actionable message. Parse with size/depth/collection bounds before accepting, and render strings as text. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Round-trip backup reproduces comparable dashboard metrics and mapping choices.
- Corrupt/oversized/unsupported backup cannot overwrite current history.
- Keys and AI state never appear in exported bytes.

Verification:

- Focused: Test round trip and invalid backup; manually download, clear and restore.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Users can retain and recover their history without a server.

Dependencies:

- V2-031
- V2-032

Blocks:

- V2-051

Suggested commit message:
`feat(storage): add local training backup`

Implementation-agent brief:
Implement V2-033 only. Provide a downloadable versioned JSON backup of current canonical facts and mappings. Export accepted imports and mappings; derived dashboards can be rebuilt. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test round trip and invalid backup; manually download, clear and restore. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-034 — Add a verified anonymized Hevy export fixture

Status:
TODO

Milestone:
M7 — Hevy proves the adapter boundary

Manual checkpoint: NO

Goal:
Establish the actual Hevy file schema before implementing its adapter.

Why this task exists:
The third source must be evidence-driven, not inferred from its resemblance to Strong.

Scope:

- Commit a permission-cleared workout CSV and schema/provenance manifest.
- Identify Hevy-specific dates, units, exercise IDs, set types and empty fields.

Explicitly out of scope:

- Do not implement an API client or assume JSON export exists.
- Do not reuse Strong's column schema without evidence.

Likely files:

- `tests/fixtures/hevy/*`

Implementation guidance:
Official reference: https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy confirms file export and separate measurement export. It does not establish the exact schema. Obtain a real anonymized file; if unavailable, mark blocked. Preserve meaningful structure and document exported app/platform/locale. Measurement import remains V2-045 only when separately verified.

Acceptance criteria:

- A real workout fixture and permission/provenance notes exist.
- Each numeric field's unit and session identity evidence are recorded.
- Synthetic edge cases are clearly separated from real exports.

Verification:

- Focused: Inspect sample against the original export and run existing fixture tests.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Hevy's contract is grounded in evidence.

Dependencies:

- None.

Blocks:

- V2-035
- V2-036

Suggested commit message:
`test(hevy): add verified export fixture`

Implementation-agent brief:
Implement V2-034 only. Establish the actual Hevy file schema before implementing its adapter. Official reference: https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy confirms file export and separate measurement export. Stay within the Scope and Explicitly out of scope lists above. Inspect sample against the original export and run existing fixture tests. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-035 — Detect Hevy without confusing Strong exports

Status:
TODO

Milestone:
M7 — Hevy proves the adapter boundary

Manual checkpoint: NO

Goal:
Add Hevy's verified signature to the existing detector.

Why this task exists:
This should extend the detector without introducing analytics changes.

Scope:

- Add exact Hevy signature/candidate rules.
- Extend ambiguity and unknown-format tests.

Explicitly out of scope:

- Do not parse Hevy workouts or relax Strong detection.
- Do not use heuristic source priority to hide ambiguity.

Likely files:

- `lib/import/detect-format.ts`
- `scripts/test-training-parser.mjs`
- `tests/fixtures/hevy/*`

Implementation guidance:
Use only the committed fixture's signature. Test overlapping subsets and renamed files. Return ambiguous when content cannot prove a source and let the existing options flow request a choice. Filename remains a hint, never the sole authority.

Acceptance criteria:

- MF, Strong and Hevy fixtures classify independently.
- Similar headers do not cause Hevy to be parsed as Strong.
- Unknown CSV retains the existing actionable error.

Verification:

- Focused: Run detector matrix and all existing parser baselines.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
The third source is recognized by the same detection layer.

Dependencies:

- V2-010
- V2-034

Blocks:

- V2-038

Suggested commit message:
`feat(import): detect Hevy workout exports`

Implementation-agent brief:
Implement V2-035 only. Add Hevy's verified signature to the existing detector. Use only the committed fixture's signature. Stay within the Scope and Explicitly out of scope lists above. Run detector matrix and all existing parser baselines. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-036 — Parse Hevy source rows and normalize measurements

Status:
TODO

Milestone:
M7 — Hevy proves the adapter boundary

Manual checkpoint: NO

Goal:
Implement Hevy-specific row parsing using shared low-level value and unit utilities.

Why this task exists:
Sharing primitive parsing is useful; sharing speculative app schemas is brittle.

Scope:

- Add a typed Hevy row parser with row references and issues.
- Normalize verified fields and preserve all meaningful training values.

Explicitly out of scope:

- Do not delegate Hevy parsing to StrongRow or change analytics.
- Do not infer unitless load, bodyweight or undocumented set markers.

Likely files:

- `lib/import/adapters/hevy-rows.ts`
- `lib/import/units.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Follow V2-034's schema manifest. Reuse finite-number/calendar/unit utilities, not Strong header or grouping code. Preserve supplied zero and optional reps/distance/duration/RPE, original IDs/timestamps/notes and unknown set labels. Keep assistance/per-hand conventions explicit. Any schema discrepancy blocks that variant rather than inspiring an unreviewed canonical redesign.

Acceptance criteria:

- Real Hevy rows normalize with original source references.
- Malformed optional fields warn; malformed required fields skip; all-invalid input fails.
- kg/lb and duration conversions pass the same primitive checks as Strong.

Verification:

- Focused: Test real Hevy rows plus invalid, missing, zero and unit variants.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Hevy has its own reliable normalization path.

Dependencies:

- V2-013
- V2-034

Blocks:

- V2-037

Suggested commit message:
`feat(hevy): parse normalized export rows`

Implementation-agent brief:
Implement V2-036 only. Implement Hevy-specific row parsing using shared low-level value and unit utilities. Follow V2-034's schema manifest. Stay within the Scope and Explicitly out of scope lists above. Test real Hevy rows plus invalid, missing, zero and unit variants. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-037 — Group Hevy rows into existing canonical sessions

Status:
TODO

Milestone:
M7 — Hevy proves the adapter boundary

Manual checkpoint: NO

Goal:
Reconstruct Hevy workouts and sets using its own verified boundary rules.

Why this task exists:
This tests whether the detailed model is sufficient for another real source.

Scope:

- Add the Hevy adapter and its session grouping.
- Return the same validated detailed import envelope used by Strong.

Explicitly out of scope:

- Do not add Hevy-only dashboard fields or edit shared analytics formulas.
- Do not discard repeated sets or force date-only rows into invented workouts.

Likely files:

- `lib/import/adapters/hevy.ts`
- `lib/import/validation.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Prefer exported stable IDs when verified. Preserve exercise block order, timestamps/precision, set kind and notes. Reuse the canonical types and projectExerciseDays unchanged. If essential evidence cannot fit the existing type, mark the task blocked for a narrowly scoped roadmap amendment; do not add source switches to analytics.

Acceptance criteria:

- Two same-day Hevy sessions remain distinct.
- Repeated exercise blocks and equal sets are retained.
- Hevy bench fixture produces expected shared daily metrics with no analytics edits.

Verification:

- Focused: Test grouping boundaries and run the shared 80×8/8/7 equivalence case.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Hevy proves the detailed adapter contract headlessly.

Dependencies:

- V2-036

Blocks:

- V2-038

Suggested commit message:
`feat(hevy): reconstruct canonical training sessions`

Implementation-agent brief:
Implement V2-037 only. Reconstruct Hevy workouts and sets using its own verified boundary rules. Prefer exported stable IDs when verified. Stay within the Scope and Explicitly out of scope lists above. Test grouping boundaries and run the shared 80×8/8/7 equivalence case. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-038 — Connect Hevy to the existing import experience

Status:
TODO

Milestone:
M7 — Hevy proves the adapter boundary

Manual checkpoint: YES

Goal:
Enable Hevy in the same worker, preview, mapping and additive-history flow.

Why this task exists:
This is the third-source user-visible checkpoint.

Scope:

- Register the Hevy adapter and verified source exercise mappings.
- Add its export instructions and source label in import UI.

Explicitly out of scope:

- Do not add Hevy-specific charts, a cloud API or restyle import components.
- Do not widen automatic comparison rules for unknown machines.

Likely files:

- `lib/import/parse-import.ts`
- `lib/exercises/source-mappings.ts`
- `app/about/page.tsx`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Use the established ImportOutcome and preview options. Keep provenance labels subtle and muscle data availability honest. Verify a Hevy bench alias only when its equipment/load semantics match. Inspect the current shared UI diff before documentation/label edits. No changes to buildDashboard should be needed; if needed for schema reasons, stop and document the leak. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Hevy imports alone and appends to disjoint MF/Strong history.
- A verified comparable bench series spans all three sources.
- Preview/report/dedup/reload behavior is reused without a Hevy fork.

Verification:

- Focused: Manually import and persist all three fixtures, inspect bench history, cancel and reject bad Hevy input.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
The third source plugs into the same product.

Dependencies:

- V2-032
- V2-035
- V2-037

Blocks:

- V2-039

Suggested commit message:
`feat(import): enable Hevy training history`

Implementation-agent brief:
Implement V2-038 only. Enable Hevy in the same worker, preview, mapping and additive-history flow. Use the established ImportOutcome and preview options. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Manually import and persist all three fixtures, inspect bench history, cancel and reject bad Hevy input. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-039 — Remove transitional import wrappers and lock adapter parity

Status:
TODO

Milestone:
M7 — Hevy proves the adapter boundary

Manual checkpoint: NO

Goal:
Finish the bounded adapter transition and remove compatibility code that is no longer called.

Why this task exists:
Temporary paths must not become permanent competing implementations.

Scope:

- Move remaining tests/callers to parseImport plus buildDashboard and remove obsolete parseTrainingFile wrapper.
- Add a three-source equivalence matrix and source-leak checks.

Explicitly out of scope:

- Do not parse new MF granular formats without verified fixtures.
- Do not reorganize unrelated modules or change metric semantics.

Likely files:

- `lib/training-parser.ts`
- `lib/import/parse-import.ts`
- `scripts/test-training-parser.mjs`
- `scripts/refresh-training-data.mjs`
- `README.md`

Implementation guidance:
Search all consumers before deleting the wrapper. Keep safe parsing/error helpers in named import modules if still needed. Assert MF aggregate facts have zero fabricated sessions, while Strong/Hevy details retain sets. MF CSV may remain a documented retained-row plus aggregate adapter; this is an explicit fidelity limit, not an implied cleanup promise. No worksheet/header/source branches in analytics. Remove temporary converter helpers created in V2-004–007 if any remain.

Acceptance criteria:

- One import pipeline serves browser, CLI and tests.
- All three comparable-metric fixtures agree, including 1840 kg·reps.
- No dead compatibility wrapper or duplicate analytics remains.
- Source-specific assumptions are confined to adapters/import UI and source-reported provenance.

Verification:

- Focused: Run the three-source regression matrix and search analytics for source-schema strings.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
The architectural proof is complete without long-lived duplicate paths.

Dependencies:

- V2-021
- V2-038

Blocks:

- V2-040
- V2-042
- V2-044
- V2-045
- V2-049
- V2-051

Suggested commit message:
`refactor(import): retire legacy parser compatibility`

Implementation-agent brief:
Implement V2-039 only. Finish the bounded adapter transition and remove compatibility code that is no longer called. Search all consumers before deleting the wrapper. Stay within the Scope and Explicitly out of scope lists above. Run the three-source regression matrix and search analytics for source-schema strings. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-040 — Make load comparison contexts explicit

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

**REQUIRES HIGHER-MODEL REVIEW**

Manual checkpoint: NO

Goal:
Replace conservative comparisonKey strings with a small explicit context record.

Why this task exists:
Real imports now provide evidence for improving load comparability without altering exercise identity.

Scope:

- Represent equipment instance, load basis, assistance/external mode and known unilateral convention.
- Migrate existing comparison keys deterministically without joining previously separate series.

Explicitly out of scope:

- Do not estimate machine mechanics or infer total dumbbell load.
- Do not reassign exercise identity or introduce a general ontology engine.

Likely files:

- `lib/exercises/comparison-context.ts`
- `lib/domain/training.ts`
- `lib/domain/strength.ts`
- `lib/analytics/project-exercise-days.ts`
- `lib/storage/stored-history.ts`

Implementation guidance:
Selected policy: comparability requires same exercise ID plus compatible equipment instance/load basis/mode. Verified total external barbell contexts may join across sources; unknown machine instances remain source/raw-name scoped. Context edits are metadata overlays over immutable original measurements. Add a single explicit stored schema migration for these introduced fields, preserving the previous state until success; no migration framework. Document negative assistance direction separately from positive external-load PRs.

Acceptance criteria:

- Previously separate unknown contexts stay separate after migration.
- Verified barbell contexts remain joined across three sources.
- Stored raw components are unchanged by context changes.
- Failed migration preserves recoverable saved data.

Verification:

- Focused: Test machine/per-hand/assisted cases and one real schema upgrade round trip.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Comparable load series are explicit and reviewable.

Dependencies:

- V2-039

Blocks:

- V2-041
- V2-043
- V2-046
- V2-048

Suggested commit message:
`refactor(exercises): model load comparison contexts`

Implementation-agent brief:
Implement V2-040 only. Complete the marked higher-model review before coding; do not replace the stated policy. Replace conservative comparisonKey strings with a small explicit context record. Selected policy: comparability requires same exercise ID plus compatible equipment instance/load basis/mode. Stay within the Scope and Explicitly out of scope lists above. Test machine/per-hand/assisted cases and one real schema upgrade round trip. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-041 — Let users inspect and choose comparison contexts

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Add a small context selector/detail panel within the existing exercise explorer.

Why this task exists:
Users need a way to distinguish machine setups and confirm compatible series.

Scope:

- Show recorded load basis and source/setup labels for the selected movement.
- Allow explicit setup separation or comparability confirmation with a preview.

Explicitly out of scope:

- Do not silently merge historical PR series or edit recorded loads.
- Do not redesign the explorer layout or introduce a machine database.

Likely files:

- `components/dashboard/comparison-context-controls.tsx`
- `lib/exercises/comparison-context.ts`
- `app/page.tsx`

Implementation guidance:
Use the context contract from V2-040. Default to existing separation. A user confirmation can link compatible contexts only with an explicit explanation of its effect; persist the overlay and recompute. Disallow linking assistance and external resistance into one ascending load PR series. Read the UI diff first and preserve existing chart tokens/classes. Reset restores source-safe contexts. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Changing context changes the selected series, not raw history.
- Unknown machines are distinguishable and remain separate by default.
- Confirmed compatible contexts can be undone via reset.

Verification:

- Focused: Test context selection/reset and manually compare two machine fixtures.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Load comparisons are transparent rather than implicit.

Dependencies:

- V2-017
- V2-040

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`feat(explorer): expose load comparison settings`

Implementation-agent brief:
Implement V2-041 only. Add a small context selector/detail panel within the existing exercise explorer. Use the context contract from V2-040. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test context selection/reset and manually compare two machine fixtures. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-042 — Preserve missing and recorded-zero values in dashboard views

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Remove legacy presentation coercions that make unknown measurements look like recorded zeros.

Why this task exists:
This is a deliberate metric correction after adapter parity is stable.

Scope:

- Update daily series/summary types to represent unavailable totals and partial coverage.
- Show gaps/unavailable labels for unknown values while retaining measured zero.

Explicitly out of scope:

- Do not combine this with volume-policy, e1RM or source-parser changes.
- Do not reclassify unknown-load exercises as bodyweight.

Likely files:

- `lib/analytics/exercises.ts`
- `lib/analytics/dashboard-types.ts`
- `app/page.tsx`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Remove positive-only filtering when zero is a valid measurement. Avoid drawing a connected line across unknown values by default. If a total has only some known contributions, label it recorded subtotal with coverage rather than a complete total; all-missing is unavailable. Keep zero baseline percentage undefined rather than invented infinity/0% gain. Adjust only affected labels/chart behavior and baseline expectations with named corrections. Preserve current styling. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Zero external load appears as a real point; missing load appears as unavailable.
- Unknown total is not displayed as 0 kg.
- Missing load no longer produces an unsupported Bodyweight claim.
- Old valid fully populated fixtures retain their values.

Verification:

- Focused: Test mixed known/unknown, genuine zero and zero-baseline achievement cases; inspect chart gaps.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Unknown data is visibly distinct from measured zero.

Dependencies:

- V2-039

Blocks:

- V2-043
- V2-047
- V2-048

Suggested commit message:
`fix(analytics): distinguish missing metrics from zero`

Implementation-agent brief:
Implement V2-042 only. Remove legacy presentation coercions that make unknown measurements look like recorded zeros. Remove positive-only filtering when zero is a valid measurement. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test mixed known/unknown, genuine zero and zero-baseline achievement cases; inspect chart gaps. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-043 — Clarify tonnage and recorded-set semantics

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Make volume and attendance labels match what the calculations actually measure.

Why this task exists:
Cross-source histories make mechanically misleading volume claims more consequential.

Scope:

- Distinguish reported volume from external-load tonnage and recorded sets from working/hard sets.
- Label attendance coloring as recorded workload instead of physiological intensity.

Explicitly out of scope:

- Do not add machine/bodyweight effective-load equations.
- Do not silently change historical MF reported-volume values.

Likely files:

- `lib/analytics/project-exercise-days.ts`
- `lib/analytics/dashboard-types.ts`
- `app/page.tsx`
- `app/about/page.tsx`

Implementation guidance:
Use context metadata to decide whether load×reps is external tonnage; assisted/unknown/combined contexts cannot masquerade as it. Preserve MF source-reported volume with its provenance label. Aggregate whole-history totals only as a labelled sum of recorded values, never mechanical equivalence; show separate categories when semantics differ. Continue to count all recorded sets unless a new working-set filter is explicitly selected; do not call every set hard. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Known barbell tonnage remains correct.
- Assistance and unknown machine values do not produce external-load PR/tonnage claims.
- Labels explain inclusion and missing coverage without changing unrelated formulas.

Verification:

- Focused: Test barbell/assisted/unknown contexts and inspect volume cards/attendance copy.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Volume remains useful with explicit limits.

Dependencies:

- V2-040
- V2-042

Blocks:

- V2-048
- V2-051

Suggested commit message:
`fix(analytics): label workload and volume semantics`

Implementation-agent brief:
Implement V2-043 only. Make volume and attendance labels match what the calculations actually measure. Use context metadata to decide whether load×reps is external tonnage; assisted/unknown/combined contexts cannot masquerade as it. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test barbell/assisted/unknown contexts and inspect volume cards/attendance copy. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-044 — Add a small versioned derived muscle exposure model

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Estimate muscle exposure for a limited verified catalog while preserving MF-reported observations separately.

Why this task exists:
Strong and Hevy currently have no muscle views; a bounded interpretation layer can now add value.

Scope:

- Add reviewed primary/secondary muscle metadata for fixture/catalog exercises.
- Implement a versioned derived exposure calculation and coverage indicator.

Explicitly out of scope:

- Do not backfill coefficients into historical facts or silently mix MF-reported and Ripper-derived values.
- Do not infer muscles for unresolved custom exercises or claim scientific precision.

Likely files:

- `lib/exercises/catalog.ts`
- `lib/analytics/muscle-model.ts`
- `lib/analytics/muscles.ts`
- `lib/analytics/dashboard-types.ts`
- `app/page.tsx`

Implementation guidance:
Define model v1 as recorded-set exposure: primary 1.0 and secondary 0.5 only for reviewed exercises, explicitly a product heuristic rather than physiology. Exclude known warmups from a working-set variant, but do not call unknown-effort sets hard. Keep a separate source-reported mode for MF and never add both modes. Show mapped/unknown coverage; custom exercises contribute only after explicit assignments. Recalculate when model or mapping version changes; preserve existing UI design. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Strong/Hevy mapped sets can produce labelled Ripper-derived exposure.
- MF-reported mode retains original values.
- Unknown exercises do not become zero-exposure evidence.
- Changing coefficients recalculates history without reimport.

Verification:

- Focused: Test one multi-muscle exercise, unknown exercise and reported/derived non-double-counting; inspect both modes.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Muscle views become source-independent with honest interpretation boundaries.

Dependencies:

- V2-039

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`feat(analytics): derive versioned muscle exposure`

Implementation-agent brief:
Implement V2-044 only. Estimate muscle exposure for a limited verified catalog while preserving MF-reported observations separately. Define model v1 as recorded-set exposure: primary 1.0 and secondary 0.5 only for reviewed exercises, explicitly a product heuristic rather than physiology. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test one multi-muscle exercise, unknown exercise and reported/derived non-double-counting; inspect both modes. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-045 — Import verified bodyweight measurements as a separate series

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: NO

Goal:
Preserve bodyweight history when an actual supported export provides it.

Why this task exists:
Later relative-strength analysis needs independent measurements, not baked workout values.

Scope:

- Add BodyweightMeasurement with date/time precision, kg, kind and provenance.
- Extend one verified source adapter to read only confirmed bodyweight fields/sheets.

Explicitly out of scope:

- Do not infer bodyweight from weighted exercise loads or import all nutrition sheets.
- Do not block training-only imports or add physiological domains.

Likely files:

- `lib/domain/bodyweight.ts`
- `lib/import/adapters/macrofactor.ts`
- `lib/storage/stored-history.ts`
- `tests/fixtures/macrofactor/*`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Gate implementation on a real anonymized bodyweight export fixture; current workbook tests do not verify these sheets. Preserve scale weight separately from source trend weight. Keep original units and source record references. Add one explicit schema-version change with empty measurement arrays for old history; no permanent attachment to sessions. If fixture unavailable, record the blocker and proceed only to independent tasks.

Acceptance criteria:

- Measurements retain date, kg, source and scale/trend distinction.
- Training-only exports still work identically.
- No invented bodyweight values appear on workouts.
- Storage and backup validation account for the new optional series.

Verification:

- Focused: Test kg/lb measurements, duplicate measurement IDs, missing series and schema upgrade.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Bodyweight is available as objective independent history.

Dependencies:

- V2-031
- V2-039

Blocks:

- V2-046

Suggested commit message:
`feat(import): retain bodyweight measurements`

Implementation-agent brief:
Implement V2-045 only. Preserve bodyweight history when an actual supported export provides it. Gate implementation on a real anonymized bodyweight export fixture; current workbook tests do not verify these sheets. Stay within the Scope and Explicitly out of scope lists above. Test kg/lb measurements, duplicate measurement IDs, missing series and schema upgrade. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-046 — Add explicit bodyweight lookup and a limited relative-load view

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Implement a transparent same-day/prior-measurement lookup for eligible load contexts.

Why this task exists:
This enables a small real bodyweight feature without comprehensive cutting/bulking analytics.

Scope:

- Create lookupBodyweight(date, policy) with provenance and age.
- Show optional external-load/bodyweight ratio for eligible known contexts.

Explicitly out of scope:

- Do not add bodyweight to external load as stored truth or interpolate by default.
- Do not claim push-up effective load or mix scale and trend measurements.

Likely files:

- `lib/analytics/bodyweight.ts`
- `lib/analytics/dashboard-types.ts`
- `components/dashboard/bodyweight-context.tsx`
- `app/page.tsx`

Implementation guidance:
Default same-day scale measurement, otherwise most recent prior scale measurement no older than seven days. No future lookup; if multiple same-day readings lack ordering, expose ambiguity instead of arbitrary choice. Return missing beyond the window. Display measurement date/age and a clearly named external-load-to-bodyweight ratio only for compatible contexts; do not label it total system strength. Preserve original facts and allow users to hide the view. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Lookup never uses a future or stale measurement.
- Ambiguous same-day data is identified.
- Displayed ratio uses known compatible load/bodyweight and includes measurement age.

Verification:

- Focused: Test same-day/prior/stale/future/multiple readings; manually inspect missing and available states.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
A limited bodyweight context is useful without invented physiology.

Dependencies:

- V2-040
- V2-045

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`feat(analytics): show bodyweight context for eligible loads`

Implementation-agent brief:
Implement V2-046 only. Implement a transparent same-day/prior-measurement lookup for eligible load contexts. Default same-day scale measurement, otherwise most recent prior scale measurement no older than seven days. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test same-day/prior/stale/future/multiple readings; manually inspect missing and available states. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-047 — Display preferred units without altering canonical values

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Add kg/lb display preference across existing mass-based charts and summaries.

Why this task exists:
Canonical kg storage should not force every user to read kg.

Scope:

- Persist a simple display-unit preference.
- Format loads, compatible tonnage and tooltips through shared conversion helpers.

Explicitly out of scope:

- Do not renormalize stored measurements or change deduplication hashes.
- Do not infer importer units from display preference.

Likely files:

- `lib/analytics/display-units.ts`
- `app/page.tsx`
- `lib/storage/training-store.ts`
- `scripts/test-training-parser.mjs`

Implementation guidance:
Reuse exact conversion constants, round only final presentation and apply kg·reps/lb·reps labels accurately. Import choices remain explicit and independent. Inspect page changes and update only metric formatting/labels, not layout. Treat source-reported ambiguous volume as reported rather than forcing a misleading conversion. Include bodyweight formatting when V2-046 is available. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Switching kg/lb changes labels and displayed numbers consistently.
- Canonical serialized facts and duplicate fingerprints remain byte-equivalent.
- Unknown metrics remain unavailable, not converted zeros.

Verification:

- Focused: Test conversion/rounding and manually inspect explorer, highlights, tooltips and volume labels.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Users can read data in their preferred units.

Dependencies:

- V2-013
- V2-042

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`feat(settings): support preferred load display units`

Implementation-agent brief:
Implement V2-047 only. Add kg/lb display preference across existing mass-based charts and summaries. Reuse exact conversion constants, round only final presentation and apply kg·reps/lb·reps labels accurately. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test conversion/rounding and manually inspect explorer, highlights, tooltips and volume labels. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-048 — Add eligible per-set estimated 1RM trends

Status:
TODO

Milestone:
M8 — Improve meaning after preserving behavior

Manual checkpoint: YES

Goal:
Derive e1RM from actual paired load/reps while retaining source-reported estimates distinctly.

Why this task exists:
This improves strength progression only after detailed facts and load contexts are trustworthy.

Scope:

- Add an explicit Epley policy for eligible completed/recorded working sets.
- Expose derived-vs-source estimate provenance and model version.

Explicitly out of scope:

- Do not calculate estimates from unrelated daily max weight and max reps.
- Do not support assisted, unknown machine or bodyweight-effective-load estimates.

Likely files:

- `lib/analytics/estimated-1rm.ts`
- `lib/analytics/project-exercise-days.ts`
- `lib/analytics/dashboard-types.ts`
- `app/page.tsx`

Implementation guidance:
Use weight for a single rep and weight*(1+reps/30) for reps 2–10; require positive known external total load in a verified compatible context. Exclude known warmups and explicitly incomplete sets; missing completion remains recorded/unknown and is labelled accordingly. No estimates outside the range. Keep MF source-reported e1rm in a separate labelled series, never overwrite it with a derived daily guess. Apply deterministic daily best selection with provenance. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- 80×8 gives the documented Epley estimate within tolerance.
- No estimate appears for high reps, unknown loads or an aggregate-only day lacking source e1RM.
- Source and Ripper estimates remain distinguishable.

Verification:

- Focused: Test formula boundaries, eligibility and peak selection; inspect one detailed and one aggregate exercise.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
A defensible e1RM trend is available where the data supports it.

Dependencies:

- V2-040
- V2-042
- V2-043

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`feat(analytics): estimate strength from eligible sets`

Implementation-agent brief:
Implement V2-048 only. Derive e1RM from actual paired load/reps while retaining source-reported estimates distinctly. Use weight for a single rep and weight*(1+reps/30) for reps 2–10; require positive known external total load in a verified compatible context. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test formula boundaries, eligibility and peak selection; inspect one detailed and one aggregate exercise. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-049 — Measure and fix the first demonstrated import bottleneck

Status:
TODO

Milestone:
M9 — Measure and prepare the beta

Manual checkpoint: YES

Goal:
Benchmark a realistic multi-year three-source history and optimize only the largest evidenced bottleneck.

Why this task exists:
Performance work should respond to measured local workloads rather than hypothetical scale.

Scope:

- Add a reproducible synthetic generator with 10 years and roughly 100,000 sets plus aggregate history.
- Record worker time, main-thread responsiveness, storage time and memory observations on named devices.

Explicitly out of scope:

- Do not add caching layers, per-set databases or server infrastructure without evidence.
- Do not rewrite every analytics pass or change import limits blindly.

Likely files:

- `scripts/benchmark-training.mjs`
- `lib/analytics/build-dashboard.ts`
- `lib/analytics/exercises.ts`
- `lib/analytics/consistency.ts`
- `docs/ripper-v2-performance.md`

Implementation guidance:
Existing audit found repeated records.filter scans by day and exercise; measure them in the new pipeline before choosing the fix. Preferred first optimization is one-pass date/exercise indexes. Change only the measured hotspot and preserve outputs. If targets are already met, the benchmark/report is the logical commit; do not invent an optimization. Targets are smooth controls, prompt visible cancellation and tolerable import time, with measurements reported rather than universal guarantees.

Acceptance criteria:

- Benchmark specifies dataset, runtime/device and repeatable command.
- Before/after outputs match and timings are recorded.
- Any optimization addresses an identified bottleneck and leaves other layers untouched.

Verification:

- Focused: Run benchmark before/after, parity suite and browser responsiveness/cancellation check.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
Scale limits are based on evidence.

Dependencies:

- V2-039

Blocks:

- V2-051

Suggested commit message:
`perf(analytics): measure and reduce repeated history scans`

Implementation-agent brief:
Implement V2-049 only. Benchmark a realistic multi-year three-source history and optimize only the largest evidenced bottleneck. Existing audit found repeated records.filter scans by day and exercise; measure them in the new pipeline before choosing the fix. Stay within the Scope and Explicitly out of scope lists above. Run benchmark before/after, parity suite and browser responsiveness/cancellation check. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-050 — Enforce the derived-summary boundary for optional AI

Status:
TODO

Milestone:
M9 — Measure and prepare the beta

Manual checkpoint: NO

Goal:
Ensure richer canonical history cannot leak into AI requests as the app evolves.

Why this task exists:
ImportOutcome now contains sets and notes that the former dashboard-only path never held.

Scope:

- Add an explicit allowlisted AI summary builder and runtime server validation.
- Keep input bounded and exclude provenance, raw rows, notes, filenames and measurements.

Explicitly out of scope:

- Do not add telemetry, cloud history storage or a new AI feature.
- Do not combine deployment WAF/rate-limit infrastructure with this task.

Likely files:

- `lib/ai/summary.ts`
- `app/page.tsx`
- `app/api/recommendations/route.ts`
- `scripts/test-ai-summary.mjs`

Implementation guidance:
Pick only supported derived statistics and required display labels with bounded lengths/counts; labels themselves can be personal, so show an accurate opt-in explanation. Reject or strip unknown fields server-side, with a real bounded-body read rather than relying solely on Content-Length. Include model/policy/data revision metadata for stale-response rejection, not raw facts. API keys remain transient. Source-neutralize the MF-only prompt without changing recommendation scope. Inspect current UI diffs. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Fixture note/raw-row/filename markers never appear in actual AI request payloads.
- Oversized and malformed request bodies fail before model invocation.
- Import and analytics work without AI/network access.
- Aborted/stale AI responses cannot update newer history.

Verification:

- Focused: Test allowlist/body limits with mocked OpenAI; inspect browser network for all three imports and optional AI.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
The local-first boundary remains explicit despite richer imports.

Dependencies:

- V2-015
- V2-029

Blocks:

- V2-051

Suggested commit message:
`fix(privacy): bound AI input to derived summaries`

Implementation-agent brief:
Implement V2-050 only. Ensure richer canonical history cannot leak into AI requests as the app evolves. Pick only supported derived statistics and required display labels with bounded lengths/counts; labels themselves can be personal, so show an accurate opt-in explanation. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Test allowlist/body limits with mocked OpenAI; inspect browser network for all three imports and optional AI. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

### V2-051 — Document supported sources and run the combined beta checkpoint

Status:
TODO

Milestone:
M9 — Measure and prepare the beta

Manual checkpoint: YES

Goal:
Publish accurate in-app import guidance and verify the complete supported workflow.

Why this task exists:
This closes the roadmap with a reviewable product checkpoint rather than untested architectural claims.

Scope:

- Update README/About with verified source variants, units, local persistence, backup and known limits.
- Record a concise smoke result for MF, Strong, Hevy and the shared history.

Explicitly out of scope:

- Do not claim every source export variant is supported or that a push proves deployment.
- Do not change UI styling, solve unrelated launch backlog items or enable future formats.

Likely files:

- `README.md`
- `app/about/page.tsx`
- `docs/ripper-v2-implementation-plan.md`
- `TEMP-BACKLOG.md`

Implementation guidance:
Use fixture manifests as the support matrix. Confirm browser-local imports, mappings, reload, backup, duplicate/conflict handling, cancellation and source-neutral charts. Reconcile only directly addressed temporary-backlog claims and leave independent deployment/abuse work visible. Respect UI diffs. Follow version/tag cadence and inspect both footers; verify the live Vercel build if its URL is available, otherwise explicitly leave that verification pending. Do not bundle private files. Optional M8 features that remain TODO are documented as unavailable and are not beta blockers; do not claim to have smoke-tested them. Inspect current git diff before shared UI edits; preserve unrelated visual changes and avoid broad reformatting.

Acceptance criteria:

- Guide matches actual tested file variants and data retention.
- Three-source longitudinal proof and recovery flows pass a recorded manual smoke.
- Remaining product/deployment blockers are stated accurately.
- No temporary diagnostics or old duplicate parser path remains.

Verification:

- Focused: Run full tests/typecheck/lint, both production builds and the manual flow with committed fixtures; record footer and deployment status.
- Tests: `npm test` and `npm run test:parser`; include the new focused assertions in the existing runner/CI.
- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Build: `npx next build` and `npm run build`; for fixture/docs-only changes, existing CI builds suffice unless executable generation/runner code changes.
- Release: follow the version/tag/footer checks in this document and AGENTS.md; report any blocked verification.

Expected result:
A source-independent beta can be reviewed with clear evidence and limits.

Dependencies:

- V2-033
- V2-039
- V2-043
- V2-049
- V2-050

Blocks:

- No later task directly depends on this item.

Suggested commit message:
`docs(beta): document and verify multi-source training support`

Implementation-agent brief:
Implement V2-051 only. Publish accurate in-app import guidance and verify the complete supported workflow. Use fixture manifests as the support matrix. Preserve the current UI agent's diff. Stay within the Scope and Explicitly out of scope lists above. Run full tests/typecheck/lint, both production builds and the manual flow with committed fixtures; record footer and deployment status. Run `npm test`, `npm run test:parser`, `npx tsc --noEmit --incremental false`, `npm run lint`, and both applicable builds as specified above. Update this task and the roadmap status; follow AGENTS.md release cadence and stop.

## Intentionally deferred destinations

These are not hidden prerequisites and must not be implemented opportunistically inside an earlier task:

- Full universal TrainingHistory/entity graph, field-level derivation graphs, an extensive source-record database, elaborate repositories, and comprehensive migration infrastructure. The initial per-import envelope and one transactional stored state are enough until measurements prove otherwise.
- Fuzzy exercise matching and confidence scoring. Real unresolved names should first improve deterministic mappings or the explicit custom flow.
- Cross-source automatic duplicate removal, probabilistic workout similarity, granular batch undo and per-set conflict editing. Exact file identity, verified same-source reconciliation and explicit coarse overlap choices come first.
- Complete load biomechanics, machine equivalence, dumbbell total-load guessing, bodyweight effective-load modeling, automatic plateau/detraining diagnoses, cutting/bulking claims and comprehensive relative-strength analytics.
- A comprehensive muscle ontology/model redesign. V2-044 introduces a deliberately small, labelled heuristic after the source proof; it does not promise physiological precision.
- Generic column-mapping UI, a public interchange specification and generic CSV interchange. V2-033 is a private versioned JSON backup, not an open standard. A rich interchange contract can be designed after three adapters establish real requirements.
- API imports, accounts, cloud sync, cloud storage and server-side parsing. None is needed for the file-based product proof.
- FIT/GPX/TCX, running, heart rate/HRV, recovery and wearable fusion. Future endurance sessions should be a separate domain, not dummy strength sets. Existing IDs and honest time precision leave this possible without adding unused interfaces now.
- Worker pools, elaborate caches, indexed per-set storage and server-scale analytics. V2-049 is measurement-first; add infrastructure only for an observed bottleneck.
- Perfect legacy snapshot recovery. There are no real production users to justify reconstructing lost facts. Reimport/reset with explicit messaging is the selected policy.
- Detailed MacroFactor workout parsing beyond the verified aggregate route. Retain relevant source rows now; add a focused detailed adapter task when a real fixture establishes its schema. Never invent sets to satisfy cross-source equality.
- Production WAF/KV limiting and broad telemetry remain separate deployment decisions in the launch backlog. They are not dependencies for local multi-source proof. V2-050 covers the concrete AI data boundary only.

## Known metric corrections deliberately separated from extraction

| Current issue | Preserve during extraction | Deliberate follow-up |
| --- | --- | --- |
| Unique active dates called sessions | Keep numeric values | V2-022 labels training days / known workouts |
| Zero/unknown conflation and positive-only chart filters | Confine to legacy view projection | V2-042 |
| Cross-category tonnage and “intensity” implication | Keep formulas for valid MF parity | V2-043 |
| Source muscle ledger treated as complete history | Preserve ledger, expose limited coverage in mixed proof | V2-044 separate derived mode |
| Exercise-name substring families | Isolate legacy helper | V2-016 IDs; V2-044 reviewed metadata for known exercises |
| e1RM available only from a workbook field | Retain source estimate, never fabricate paired sets | V2-048 |
| Aggregate maximums cannot describe actual set pairing | Preserve aggregate fidelity | Keep unavailable unless detailed facts exist |

Date/number validation is the exception to accepting invalid legacy behavior: V2-008 rejects/omits malformed facts explicitly, while valid-input analytics remain equal. Regression tests should name this distinction.

## Roadmap changes

- 2026-09-05: Created this incremental roadmap from the prior engineering plan and a fresh working-tree inspection. Accounted for committed UI modernization and pending typography/branding/version changes without modifying them.
- 2026-09-05: Selected a daily-aggregate-first boundary, Strong dashboard checkpoint at V2-015, and in-memory cross-source history checkpoint at V2-019. Deferred durable storage until V2-030, sophisticated duplicates indefinitely, and optional semantics until after the third-source proof.
- 2026-09-05: No implementation tasks started. Real Strong and Hevy fixtures remain explicit evidence gates. Future changes must append dated reasons here and preserve task IDs.
- 2026-09-05: Final working-tree recheck captured concurrent UI commits through a23ac11/v0.2.20. Updated the repository context to preserve the current Google Sans Flex, muted palette and thinner chart treatment; task boundaries are unchanged.
- 2026-09-05: V2-001 completed with deterministic synthetic MacroFactor CSV/workbook fixtures, optional-sheet coverage, alias coverage and parser acceptance checks. No real user data was added.
- 2026-09-05: V2-002 completed with independently checked baseline assertions for coverage, monthly frequency, gaps, exercise totals, peak/latest achievements and source-reported muscle summaries. Current metric semantics remain unchanged.
- 2026-09-05: V2-003 completed with source-neutral exercise-day/domain types and shared dashboard view types. Existing page behavior and parser output remain unchanged.
- 2026-09-05: V2-004 completed by extracting consistency dates, monthly summaries and gaps into `lib/analytics/consistency.ts`; MacroFactor output remains at baseline parity.
- 2026-09-05: V2-005 completed by extracting exercise summaries and first-to-peak achievements into `lib/analytics/exercises.ts`; existing formulas and ordering remain unchanged.
- 2026-09-05: V2-006 completed by extracting attendance bins and active-week streak calculations into `lib/analytics/attendance.ts`; existing thresholds and dashboard output remain unchanged.
- 2026-09-05: V2-007 completed by extracting source-reported muscle windows and heatmap calculations into `lib/analytics/muscles.ts`; workbook parsing and baseline output remain unchanged.
- 2026-09-05: V2-008 completed with a transitional MacroFactor import envelope, canonical exercise-day provenance, validation, and a dashboard boundary. Detailed source adapter extraction remains intentionally deferred until verified source fixtures require it.
- 2026-09-05: V2-009 is waiting on confirmation that the newly appearing untracked `fixtures/raw-strong.csv` and `fixtures/raw-hevy.csv` files are permission-cleared, anonymized, and intended for repository use. They were inspected only and were not copied or staged.

- 2026-09-05: Higher-model review reopened V2-008. Replaced dashboard pass-through with canonical-driven composition, isolated MacroFactor mapping, retained training rows and muscle ledger, and validated dates/numbers before analytics. Valid regression fixtures, typecheck, lint and both builds pass; Next home/About show v0.2.37. Browser upload blocked by extension permission, so V2-008 stays IN_PROGRESS for that verification. CSV legacy zero-fill and workbook zero omission are presentation-only until V2-042. Multiple imports explicitly rejected until additive reconciliation; V2-019 removes this guard. User confirmed original Strong/Hevy CSVs anonymized and approved.

- 2026-09-05: V2-009: Committed the approved original Strong fixture and observed schema manifest. Unitless Weight/Distance require explicit options; no source settings are guessed.

- 2026-09-05: V2-010: Detect source signatures using decoded content, including BOM, renamed files and ambiguous candidates. Strong upload remains disabled; unknown CSV retains MF compatibility errors.

- 2026-09-05: V2-011: Parsed all 1,903 original Strong rows into typed staging records; preserve wall time, CSV records and multiline notes. Invalid required fields are skipped with issues; missing units and alternate date grammars request input.

- 2026-09-05: V2-012: Grouped original Strong rows into 86 contiguous timestamp/title sessions with all 1,903 sets preserved. A/B/A blocks and equal sets remain distinct; resets and missing/reappearing workout boundaries require review. Introduced detailed domain types without converting measurements.

- 2026-09-05: V2-013: Strong now emits validated detailed imports using explicit mass/distance choices, without fabricating reps, completion, timezone, load basis or bodyweight. Positive assistance supported only via explicit exercise semantics; row-unit conflicts and ambiguous sessions require input. 86 workouts and 1,903 sets retained. Next task V2-014 projects these facts into shared daily analytics.

- 2026-09-05: V2-008 final regression review found simultaneous legacy aliases could lose CSV totals or complementary workbook metrics in the compatibility projection. Corrected presentation merging while retaining distinct raw canonical facts; added focused CSV/workbook collision tests. Released locally as v0.2.43 after parser/unit tests, typecheck, lint and both builds. V2-014 is next; browser worker smoke still pending file permission.
- 2026-09-05: V2-014 completed with a pure detailed-session projection into canonical exercise days. Strong daily facts derive only from sets; unknown load basis remains non-comparable and set duration is not copied from workout duration. `buildDashboard()` accepts detailed imports through the projection; Strong UI wiring is V2-015.
