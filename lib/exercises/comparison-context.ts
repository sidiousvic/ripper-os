export type LoadMode = "external" | "assistance" | "machine" | "unknown";
export interface ComparisonContext { exerciseId: string; equipmentInstance: string | null; loadBasis: "total" | "per-implement" | "per-side" | "machine-setting" | "unknown"; mode: LoadMode; comparable: boolean; }
export function contextsCompatible(a: ComparisonContext, b: ComparisonContext) {
  return a.exerciseId === b.exerciseId && a.equipmentInstance === b.equipmentInstance && a.loadBasis === b.loadBasis && a.mode === b.mode && a.comparable && b.comparable;
}
