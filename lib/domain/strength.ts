import type { TrainingSource } from "./training.ts";
import type { ImportIssue, SourceRow } from "../import/types.ts";

export interface RecordedLoad {
  kg: number;
  component: "external" | "assistance" | "combined" | "unknown";
  basis: "total" | "per-implement" | "per-side" | "machine-setting" | "unknown";
  originalValue: number;
  originalUnit: "kg" | "lb";
}
export interface TrainingSet {
  id: string;
  index: number;
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
export interface ExercisePerformance {
  id: string;
  rawExerciseName: string;
  displayName: string;
  exerciseId: string;
  comparisonKey: string;
  order: number;
  notes?: string;
  sets: TrainingSet[];
}
export interface StrengthSession {
  id: string;
  importId: string;
  source: TrainingSource;
  date: string;
  originalStartedAt?: string;
  startedAt?: string;
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
export interface DetailedImport {
  schemaVersion: 1;
  importId: string;
  source: TrainingSource;
  filename: string;
  adapterVersion: string;
  representation: "detailed";
  sessions: StrengthSession[];
  issues: ImportIssue[];
  sourceSheets: Record<string, string[]>;
  sourceRows: SourceRow[];
}
