import type { DashboardData } from "../analytics/dashboard-types.ts";
import { buildDashboard } from "../analytics/build-dashboard.ts";
import { combineImports, hasImportedContentHash, type HistoryImport } from "../history/combine-imports.ts";
import type { ImportOutcome } from "./parse-import.ts";

export type ImportPreview = {
  action: "replace" | "add";
  source: ImportOutcome["source"];
  filename: string;
  candidateDashboard: DashboardData;
  nextDashboard: DashboardData;
  nextImports: HistoryImport[];
  trainingDays: number;
  knownWorkouts: number | null;
  workoutCountBasis: "known" | "partial" | "unknown";
  sets: number;
  mappedExercises: number;
  customExercises: number;
  warnings: number;
  errors: number;
  noOp: boolean;
  reconciliation?: { added: number; unchanged: number; unit: "workouts" | "daily observations" };
};

export function createImportPreview(outcome: Extract<ImportOutcome, { status: "ready" }>, filename: string, action: "replace" | "add", existing: HistoryImport[]): ImportPreview | { conflict: string } {
  const candidate = combineImports([], outcome.importData);
  if (!candidate.ok) return { conflict: candidate.conflict.message };
  const candidateDashboard = outcome.dashboard;
  const noOp = hasImportedContentHash(existing, outcome.importData.contentHash);
  const combined = noOp ? { ok: true as const, imports: existing } : action === "add" ? combineImports(existing, outcome.importData) : candidate;
  if (!combined.ok) return { conflict: combined.conflict.message };
  const nextDashboard = noOp && existing.length ? buildDashboard(existing) : action === "replace" ? candidateDashboard : buildDashboard(combined.imports);
  const candidateImport = candidate.imports[0];
  const names = new Map<string, boolean>();
  for (const day of candidateImport.exerciseDays) names.set(`${day.source}:${day.rawExerciseName}`, day.exerciseId.startsWith("custom_"));
  const issues = "issues" in outcome.importData ? outcome.importData.issues : [];
  return {
    action, source: outcome.source, filename, candidateDashboard, nextDashboard, nextImports: combined.imports,
    trainingDays: candidateDashboard.coverage.totalSessions,
    knownWorkouts: candidateDashboard.coverage.knownWorkouts,
    workoutCountBasis: candidateDashboard.coverage.workoutCountBasis,
    sets: candidateImport.exerciseDays.reduce((sum, day) => sum + (day.metrics.totalSets ?? 0), 0),
    mappedExercises: [...names.values()].filter((custom) => !custom).length,
    customExercises: [...names.values()].filter(Boolean).length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    errors: issues.filter((issue) => issue.severity === "error").length,
    noOp,
    reconciliation: !noOp && "added" in combined ? { added: combined.added, unchanged: combined.unchanged, unit: outcome.source === "strong" ? "workouts" : "daily observations" } : undefined,
  };
}
