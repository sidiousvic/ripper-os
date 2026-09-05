"use client";

import { useState } from "react";
import { exerciseCatalog } from "../../lib/exercises/catalog";
import type { ExerciseOverride } from "../../lib/exercises/resolve";
import { trainingSourceLabel, type TrainingSource } from "../../lib/domain/training";

export type MappingCandidate = { key: string; source: TrainingSource; rawName: string; currentName: string };

export default function ExerciseMappingDialog({
  candidate,
  onClose,
  onSave,
  onKeepCustom,
  onReset,
  onNavigate,
  position,
}: {
  candidate: MappingCandidate | null;
  onClose: () => void;
  onSave: (override: ExerciseOverride) => void;
  onKeepCustom: () => void;
  onReset: () => void;
  onNavigate?: (direction: -1 | 1) => void;
  position?: { current: number; total: number };
}) {
  const [exerciseId, setExerciseId] = useState("");
  if (!candidate) return null;
  return (
    <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="exercise-mapping-title">
        <p className="eyebrow accent">Exercise identity</p>
        <h2 id="exercise-mapping-title">Resolve “{candidate.rawName}”</h2>
        {position && <p className="muted small">Exercise {position.current} of {position.total}</p>}
        <p className="muted small">{trainingSourceLabel(candidate.source)} currently keeps this as {candidate.currentName}. Choose a known movement or retain it as a custom exercise.</p>
        <label className="connect-key-label" htmlFor="exercise-mapping-select">Canonical exercise</label>
        <select id="exercise-mapping-select" className="connect-key-input" value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
          <option value="">Choose an exercise…</option>
          {exerciseCatalog.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.displayName}</option>)}
        </select>
        <div className="connect-actions">
          <button className="button secondary" onClick={onClose}>Close</button>
          {onNavigate && <button className="button secondary" onClick={() => onNavigate(-1)} disabled={!position || position.current <= 1}>Previous</button>}
          {onNavigate && <button className="button secondary" onClick={() => onNavigate(1)} disabled={!position || position.current >= position.total}>Next</button>}
          <button className="button secondary" onClick={onReset}>Reset automatic mapping</button>
          <button className="button secondary" onClick={onKeepCustom}>Keep custom</button>
          <button className="button primary" onClick={() => { if (exerciseId) onSave({ exerciseId }); }} disabled={!exerciseId}>Use this mapping</button>
        </div>
      </section>
    </div>
  );
}
