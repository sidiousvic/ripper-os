import { inspectInput } from "./import/inspect-input.ts";
import { normalizeMacroFactor } from "./import/adapters/macrofactor.ts";
import { buildDashboard } from "./analytics/build-dashboard.ts";

export const safeParseMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (/No workout sessions/i.test(message)) return "No workout sessions were found in this MacroFactor export.";
  if (/Missing required CSV column/i.test(message)) return "This CSV is missing a required Date, Exercise, or Reps column.";
  if (/Unsupported weight unit/i.test(message)) return "This CSV uses an unsupported weight unit. Use kilograms (kg) or pounds (lb).";
  if (/Export exceeds the supported/i.test(message)) return "This export is too large or spans too much history to process safely in the browser.";
  if (/Missing required MacroFactor sheet/i.test(message)) return "This workbook is missing a required MacroFactor workout sheet.";
  return "Could not parse this export. Confirm it is a supported MacroFactor CSV or XLSX file and try again.";
};

/** Browser-local compatibility entry point; only the dashboard leaves the worker. */
export function parseTrainingFile(fileBytes: Uint8Array, fileName: string) {
  return buildDashboard(normalizeMacroFactor(inspectInput(fileBytes, fileName), fileName), /\.csv$/i.test(fileName) ? "csv" : "workbook");
}
