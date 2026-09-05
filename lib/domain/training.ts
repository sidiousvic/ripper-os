export type TrainingSource = "macrofactor" | "strong" | "hevy";

export type DailyMetric =
  | "totalSets"
  | "totalReps"
  | "bestSetReps"
  | "heaviestKg"
  | "totalVolumeKg"
  | "e1rmKg"
  | "durationSec";

export type DailyMetrics = Record<DailyMetric, number | null>;

export interface CanonicalExerciseDay {
  id: string;
  importId: string;
  source: TrainingSource;
  rawExerciseName: string;
  exerciseId: string;
  displayName: string;
  date: string;
  metrics: DailyMetrics;
  origin: "source-aggregate" | "derived-from-sets";
  sourceRefs: string[];
  comparisonKey: string;
}

export interface SourceMuscleDay {
  importId: string;
  source: TrainingSource;
  date: string;
  rawMuscleName: string;
  setEquivalents: number;
}
