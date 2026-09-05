import type { DashboardData } from "../analytics/dashboard-types.ts";
import { buildDashboard } from "../analytics/build-dashboard.ts";
import { combineImports, hasImportedContentHash, type HistoryImport } from "../history/combine-imports.ts";
import { resolveDateConflict, toHistoryImport, type ConflictChoice, type ImportConflict } from "../history/reconcile-imports.ts";
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

export type ImportConflictPreview = { conflict: ImportConflict; existing: HistoryImport[]; incoming: HistoryImport; source: ImportOutcome["source"]; filename: string };

export function createImportPreview(outcome: Extract<ImportOutcome, { status: "ready" }>, filename: string, action: "replace" | "add", existing: HistoryImport[]): ImportPreview | ImportConflictPreview {
  const candidate = combineImports([], outcome.importData);
  if (!candidate.ok) return { conflict: candidate.conflict, existing, incoming: toHistoryImport(outcome.importData), source: outcome.source, filename };
  const candidateDashboard = outcome.dashboard;
  const noOp = hasImportedContentHash(existing, outcome.importData.contentHash);
  const combined = noOp ? { ok: true as const, imports: existing } : action === "add" ? combineImports(existing, outcome.importData) : candidate;
  if (!combined.ok) return { conflict: combined.conflict, existing, incoming: toHistoryImport(outcome.importData), source: outcome.source, filename };
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

export function createConflictChoicePreview(input: ImportConflictPreview, choice: ConflictChoice): ImportPreview {
  const imports = resolveDateConflict(input.existing, input.incoming, input.conflict.dates, choice);
  const dashboard = buildDashboard(imports);
  const custom = new Set(input.incoming.exerciseDays.filter(day => day.exerciseId.startsWith("custom_")).map(day => day.exerciseId));
  const mapped = new Set(input.incoming.exerciseDays.filter(day => !day.exerciseId.startsWith("custom_")).map(day => day.exerciseId));
  return { action: "add", source: input.source, filename: input.filename, candidateDashboard: dashboard, nextDashboard: dashboard, nextImports: imports,
    trainingDays: dashboard.coverage.totalSessions, knownWorkouts: dashboard.coverage.knownWorkouts, workoutCountBasis: dashboard.coverage.workoutCountBasis,
    sets: input.incoming.exerciseDays.reduce((sum, day) => sum + (day.metrics.totalSets ?? 0), 0), mappedExercises: mapped.size, customExercises: custom.size,
    warnings: input.incoming.issues.filter(issue => issue.severity === "warning").length, errors: input.incoming.issues.filter(issue => issue.severity === "error").length,
    noOp: choice === "keep-existing" };
}
