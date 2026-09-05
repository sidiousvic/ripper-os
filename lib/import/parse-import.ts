import { buildDashboard } from "../analytics/build-dashboard.ts";
import type { DashboardData } from "../analytics/dashboard-types.ts";
import type { DetailedImport } from "../domain/strength.ts";
import { detectFormat } from "./detect-format.ts";
import { inspectInput } from "./inspect-input.ts";
import type { AggregateImport } from "./types.ts";
import { normalizeMacroFactor } from "./adapters/macrofactor.ts";
import { normalizeStrong, type StrongNormalizationOptions } from "./adapters/strong.ts";

export type ImportOutcome =
  | { status: "ready"; source: "macrofactor"; dashboard: DashboardData; importData: AggregateImport }
  | { status: "ready"; source: "strong"; dashboard: DashboardData; importData: DetailedImport }
  | { status: "needs-input"; source: "strong"; needs: string[] };

export function parseImport(fileBytes: Uint8Array, fileName: string, options: StrongNormalizationOptions = {}): ImportOutcome {
  const input = inspectInput(fileBytes, fileName);
  const detected = detectFormat(input);
  if (detected.format === "ambiguous") throw new Error("Ambiguous training export format. Use one source format per file.");
  if (detected.format === "unknown") throw new Error("We don't recognize this training export yet.");
  if (detected.format === "macrofactor") {
    const importData = normalizeMacroFactor(input, fileName, options);
    return { status: "ready", source: "macrofactor", dashboard: buildDashboard(importData, input.inputKind === "csv" ? "csv" : "workbook"), importData };
  }
  const normalized = normalizeStrong(input, fileName, options);
  if (normalized.status === "needs-input") return { status: "needs-input", source: "strong", needs: normalized.needs };
  return { status: "ready", source: "strong", dashboard: buildDashboard(normalized.data), importData: normalized.data };
}
