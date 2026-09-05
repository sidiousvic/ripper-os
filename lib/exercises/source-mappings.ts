import type { TrainingSource } from "../domain/training.ts";

export type SourceMapping = { source: TrainingSource; rawName: string; exerciseId: string; comparable: boolean };
export const sourceMappings: SourceMapping[] = [
  { source: "macrofactor", rawName: "Barbell Bench Press", exerciseId: "barbell_bench_press", comparable: true },
  { source: "strong", rawName: "Bench Press (Barbell)", exerciseId: "barbell_bench_press", comparable: true },
];

export function sourceMappingKey(source: TrainingSource, rawName: string) {
  return `${source}:${rawName.trim().toLocaleLowerCase()}`;
}
export const sourceMappingByKey = new Map(sourceMappings.map(mapping => [sourceMappingKey(mapping.source, mapping.rawName), mapping]));
