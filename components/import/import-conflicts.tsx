"use client";

import type { ConflictChoice } from "../../lib/history/reconcile-imports";
import type { ImportConflictPreview } from "../../lib/import/import-preview";

export default function ImportConflicts({ preview, onCancel, onChoice }: { preview: ImportConflictPreview | null; onCancel: () => void; onChoice: (choice: ConflictChoice) => void }) {
  if (!preview) return null;
  return <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="import-conflict-title">
      <p className="eyebrow accent">Review overlap</p>
      <h2 id="import-conflict-title">These dates need a decision</h2>
      <p className="muted small">{preview.conflict.message}</p>
      <p className="muted small">Affected dates: {preview.conflict.dates.join(", ")}. The choice applies to each complete date so exercise and muscle facts stay together.</p>
      <div className="connect-actions"><button className="button secondary" onClick={onCancel}>Cancel</button><button className="button secondary" onClick={() => onChoice("keep-existing")}>Keep existing</button><button className="button primary" onClick={() => onChoice("use-incoming")}>Use incoming</button><button className="button secondary" onClick={() => onChoice("keep-both")}>Keep both (may double-count)</button></div>
    </section>
  </div>;
}
