# Ripper OS backlog

Product and data-quality follow-ups. Deployment work is intentionally tracked elsewhere and is not included here.

## Validate the real MacroFactor CSV

- Test `/Users/sidiousvic/Downloads/MacroFactor-20260903125636.csv` end to end.
- Compare session, set, rep, weight, volume, and date totals against MacroFactor.
- Add a checked-in CSV fixture and regression assertions.
- Document which CSV fields cannot provide muscle-group analysis.

## Uploaded-data persistence

- Keep the default ephemeral behavior clear to users.
- Decide whether session persistence should remain the default or become opt-in.
- Add an explicit “Clear uploaded data” confirmation and storage-size handling.
- Consider IndexedDB for larger normalized datasets.

## OpenAI flow hardening

- Improve API-key failure and retry states.
- Add model and prompt version metadata to saved insight results.
- Add cost and privacy messaging before the first request.
- Replace the in-memory rate limiter with a provider-appropriate limiter for multi-instance hosting.
- Add structured-response/schema validation tests.
- Keep raw workbook data out of OpenAI requests.

## Testing and release polish

- Add XLSX fixture tests.
- Add malformed-file and missing-sheet tests.
- Add empty-data and no-muscle-data tests.
- Add recommendation sanitization tests.
- Add a public contribution guide.
- Decide whether to include an anonymized sample dataset.

## Scope

Gymverse import remains out of scope until a real export format is available.
