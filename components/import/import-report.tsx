"use client";

import { useState } from "react";
import type { ImportReport } from "../../lib/import/import-report";
import { trainingSourceLabel } from "../../lib/domain/training";

export default function ImportReportDialog({ report, onClose }: { report: ImportReport | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!report) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(report.diagnostics); setCopied(true); } catch { setCopied(false); }
  };
  return <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="import-report-title">
      <p className="eyebrow accent">Import complete</p>
      <h2 id="import-report-title">{report.action === "add" ? "Training data added" : "Training data loaded"}</h2>
      <p className="loaded-export-name">{report.filename}</p>
      <p className="muted small">{trainingSourceLabel(report.source)} · {report.trainingDays} training days · {report.setsInFile} sets in file</p>
      <div className="schema-card schema-inline">
        <p><strong>{report.addedRecords}</strong> added · <strong>{report.unchangedRecords}</strong> unchanged or duplicate</p>
        <p><strong>{report.mappedExercises}</strong> mapped exercises · <strong>{report.customExercises}</strong> custom or unresolved</p>
        <p>{report.warnings} warnings · {report.errors} errors</p>
      </div>
      <p className="muted small">The copyable diagnostic summary contains counts and source type only. It excludes filenames, exercise names, notes and training dates.</p>
      <div className="connect-actions"><button className="button secondary" onClick={onClose}>Close</button><button className="button primary" onClick={copy}>{copied ? "Copied" : "Copy diagnostics"}</button></div>
    </section>
  </div>;
}
