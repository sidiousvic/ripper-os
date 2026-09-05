import { inspectInput } from "./import/inspect-input.ts";
import { normalizeMacroFactor } from "./import/adapters/macrofactor.ts";
import { detectFormat } from "./import/detect-format.ts";
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
/** @deprecated Use parseImport() and buildDashboard() for source-neutral imports. */
export function parseTrainingFile(fileBytes: Uint8Array, fileName: string) {
  const input = inspectInput(fileBytes, fileName);
  const detected = detectFormat(input);
  if (detected.format === "strong") throw new Error("Strong CSV detected. Dashboard support is not available yet.");
  if (detected.format === "ambiguous") throw new Error("Ambiguous training export format.");
  // Preserve MF's actionable missing-column error for unknown CSVs during compatibility support.
  return buildDashboard(normalizeMacroFactor(input, fileName), input.inputKind === "csv" ? "csv" : "workbook");
}
