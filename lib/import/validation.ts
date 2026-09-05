import type { CanonicalExerciseDay } from "../domain/training.ts";

export function validateCanonicalExerciseDays(days: CanonicalExerciseDay[]) {
  const issues: string[] = [];
  for (const day of days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) issues.push(`Invalid date for ${day.rawExerciseName}`);
    if (!day.id || !day.importId || !day.source || !day.rawExerciseName || !day.exerciseId || !day.displayName || !day.sourceRefs.length) issues.push("Canonical exercise day is missing identity or provenance");
    for (const value of Object.values(day.metrics)) if (value !== null && (!Number.isFinite(value) || value < 0)) issues.push(`Invalid metric for ${day.rawExerciseName}`);
  }
  return issues;
}
