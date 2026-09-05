import type { TrainingSource } from "./training.ts";

export type BodyweightKind = "scale" | "trend";

export interface BodyweightMeasurement {
  id: string;
  importId: string;
  source: TrainingSource;
  date: string;
  kg: number;
  kind: BodyweightKind;
  originalValue: number;
  originalUnit: "kg";
  sourceRefs: string[];
}
