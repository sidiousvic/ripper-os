import type { ImportPreview } from "./import-preview.ts";

export interface ImportReport {
  action: ImportPreview["action"];
  source: ImportPreview["source"];
  filename: string;
  trainingDays: number;
  knownWorkouts: number | null;
  setsInFile: number;
  addedRecords: number;
  unchangedRecords: number;
  duplicateFile: boolean;
  customExercises: number;
  mappedExercises: number;
  warnings: number;
  errors: number;
  diagnostics: string;
}

/** Build a user-facing summary without including names, dates, notes or raw values in diagnostics. */
export function createImportReport(preview: ImportPreview): ImportReport {
  const addedRecords = preview.reconciliation?.added ?? (preview.noOp ? 0 : preview.trainingDays);
  const unchangedRecords = preview.reconciliation?.unchanged ?? (preview.noOp ? preview.trainingDays : 0);
  const diagnosticLines = [
    `source=${preview.source}`,
    `action=${preview.action}`,
    `training_days=${preview.trainingDays}`,
    `sets_in_file=${preview.sets}`,
    `added_records=${addedRecords}`,
    `unchanged_records=${unchangedRecords}`,
    `duplicate_file=${preview.noOp}`,
    `mapped_exercises=${preview.mappedExercises}`,
    `custom_exercises=${preview.customExercises}`,
    `warnings=${preview.warnings}`,
    `errors=${preview.errors}`,
  ];
  return { action: preview.action, source: preview.source, filename: preview.filename, trainingDays: preview.trainingDays, knownWorkouts: preview.knownWorkouts, setsInFile: preview.sets, addedRecords, unchangedRecords, duplicateFile: preview.noOp, customExercises: preview.customExercises, mappedExercises: preview.mappedExercises, warnings: preview.warnings, errors: preview.errors, diagnostics: diagnosticLines.join("\n") };
}
