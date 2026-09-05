import type { DashboardData } from "./dashboard-types.ts";
import type { MacroFactorImport } from "../import/adapters/macrofactor.ts";

/** Transitional dashboard boundary; detailed projections arrive in V2-014. */
export function buildDashboard(importData: MacroFactorImport): DashboardData {
  return importData.dashboard;
}
