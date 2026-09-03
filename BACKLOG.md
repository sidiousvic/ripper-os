# Ripper OS backlog

Product and data-quality follow-ups. Deployment work is intentionally tracked elsewhere and is not included here.

## Validate the real MacroFactor CSV

- [x] Test a real user-provided MacroFactor CSV end to end.
- [x] Compare session, set, rep, weight, volume, and date totals against MacroFactor.
- Add parser regression assertions without committing private export files.
- [x] Document which CSV fields cannot provide muscle-group analysis.

## Uploaded-data persistence

- [x] Keep the default ephemeral behavior clear to users.
- Decide whether session persistence should remain the default or become opt-in.
- [x] Add an explicit “Clear uploaded data” confirmation and storage-size handling.
- Consider IndexedDB for larger normalized datasets.

## OpenAI flow hardening

- [x] Improve API-key failure and retry states.
- [x] Add model and prompt version metadata to insight results.
- [x] Add cost and privacy messaging before the first request.
- Replace the in-memory rate limiter with a provider-appropriate limiter for multi-instance hosting.
- Add structured-response/schema validation tests.
- [x] Keep raw workbook data out of OpenAI requests.

## Testing and release polish

- Add XLSX fixture tests.
- Add malformed-file and missing-sheet tests.
- Add empty-data and no-muscle-data tests.
- Add recommendation sanitization tests.
- Add a public contribution guide.
- Decide whether to include an anonymized sample dataset.

## Scope

Gymverse import remains out of scope until a real export format is available.
