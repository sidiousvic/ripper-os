export type TrainingSource = "macrofactor" | "strong" | "hevy";

export const trainingSourceLabel = (source: string) => source.split("+").map((part) => {
  const value = part.trim();
  return value.toLowerCase() === "macrofactor" ? "MacroFactor" : value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}).filter(Boolean).join(" + ");

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
