"use client";

import type { ImportPreview } from "../../lib/import/import-preview";

export default function ImportPreviewDialog({ preview, onCancel, onAccept }: { preview: ImportPreview | null; onCancel: () => void; onAccept: () => void }) {
  if (!preview) return null;
  const basis = preview.workoutCountBasis === "known" ? "known workouts" : preview.workoutCountBasis === "partial" ? "known workouts in part of this history" : "workouts not available in this aggregate export";
  return (
    <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="import-preview-title">
        <p className="eyebrow accent">Review import</p>
        <h2 id="import-preview-title">{preview.action === "add" ? "Add training data" : "Replace training data"}</h2>
        <p className="loaded-export-name">{preview.filename}</p>
        {preview.batchFailures?.length ? <p className="muted small">{preview.batchFailures.length} file{preview.batchFailures.length === 1 ? "" : "s"} could not be staged; valid files remain ready to import.</p> : null}
        <p className="muted small">{preview.source} detected · {preview.candidateDashboard.coverage.firstDate} → {preview.candidateDashboard.coverage.lastDate}</p>
        <div className="schema-card schema-inline">
          <p><strong>{preview.trainingDays}</strong> training days · <strong>{preview.sets}</strong> recorded sets</p>
          <p><strong>{preview.knownWorkouts ?? "—"}</strong> {basis}</p>
          <p><strong>{preview.mappedExercises}</strong> mapped exercises · <strong>{preview.customExercises}</strong> custom or unresolved</p>
          {(preview.warnings > 0 || preview.errors > 0) && <p>{preview.warnings} warnings · {preview.errors} errors. Valid records can still be imported.</p>}
        </div>
        {preview.action === "add" && <p className="muted small">Unchanged records from the same source are skipped. Changed records and overlaps across sources require resolution.</p>}
        {preview.action === "add" && preview.reconciliation && <p className="muted small">{preview.reconciliation.added} new {preview.reconciliation.unit}; {preview.reconciliation.unchanged} unchanged. Records missing from this export stay in your history.</p>}
        {preview.action === "replace" && <p className="muted small">Replacing removes the currently loaded history after you confirm.</p>}
        {preview.noOp && <p className="muted small">These exact file bytes were already accepted. No changes are needed.</p>}
        <div className="connect-actions"><button className="button secondary" onClick={onCancel}>Cancel</button><button className="button primary" onClick={onAccept} disabled={preview.noOp}>{preview.noOp ? "Already imported" : "Import valid rows"}</button></div>
      </section>
    </div>
  );
}
