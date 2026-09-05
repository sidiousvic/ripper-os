import type { CanonicalExerciseDay, SourceMuscleDay, TrainingSource } from "../domain/training.ts";

export interface ImportIssue {
  code: string;
  severity: "warning" | "error";
  rowRefs: string[];
  action: "skipped-row" | "omitted-field" | "needs-input";
  message: string;
}
export interface SourceRow {
  ref: string;
  sheet: string;
  row: number;
  cells: (string | number | boolean | null)[];
}
/** Aggregate facts only. Detailed imports will supply sets when that source requires them. */
export interface AggregateImport {
  schemaVersion: 1;
  importId: string;
  source: TrainingSource;
  filename: string;
  adapterVersion: string;
  /** SHA-256 of the original file bytes, recorded only after an import is accepted. */
  contentHash?: string;
  /** Number of source workouts when the adapter has session-level fidelity. */
  knownWorkoutCount?: number;
  exerciseDays: CanonicalExerciseDay[];
  muscleDays: SourceMuscleDay[];
  issues: ImportIssue[];
  sourceSheets: Record<string, string[]>;
  sourceRows: SourceRow[];
}
