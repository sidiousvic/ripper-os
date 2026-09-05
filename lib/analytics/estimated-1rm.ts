export const E1RM_MODEL_VERSION = "epley-v1" as const;
export function estimateE1rmKg(loadKg: number | null, reps: number | null, eligible = true): number | null {
  if (!eligible || loadKg === null || reps === null || !Number.isFinite(loadKg) || !Number.isFinite(reps) || loadKg <= 0 || reps < 1 || reps > 10) return null;
  return reps === 1 ? loadKg : loadKg * (1 + reps / 30);
}
