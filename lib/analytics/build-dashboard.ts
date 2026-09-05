import type { DashboardData } from "./dashboard-types.ts";
import type { AggregateImport } from "../import/types.ts";
import { assertValidImport } from "../import/validation.ts";
import { calculateConsistencySummary } from "./consistency.ts";
import { calculateExerciseSummaries } from "./exercises.ts";
import { calculateAttendance } from "./attendance.ts";
import { calculateSourceMuscles } from "./muscles.ts";
import { legacyExerciseFamily } from "./legacy-exercise-labels.ts";

/** Legacy presentation grouping only. Canonical identities and supplied zeros stay untouched. */
type LegacyPresentation = "csv" | "workbook";
function legacyPresentationRecords(imports: AggregateImport[], presentation?: LegacyPresentation) {
  const records = new Map<string, { date: string; exercise: string; family: string } & AggregateImport["exerciseDays"][number]["metrics"]>();
  for (const data of imports) for (const day of data.exerciseDays) {
    const key = JSON.stringify([day.date, day.displayName]);
    const previous = records.get(key);
    const metrics = { ...day.metrics };
    // The old CSV view zero-filled absent load/reps. Workbook views omitted zero cells.
    // Keep these conventions only at this presentation boundary until V2-042.
    if (presentation === "csv") {
      for (const field of ["totalReps", "bestSetReps", "heaviestKg", "totalVolumeKg"] as const) metrics[field] ??= 0;
    } else if (presentation === "workbook") {
      for (const field of Object.keys(metrics) as (keyof typeof metrics)[]) if (metrics[field] === 0) metrics[field] = null;
      if (Object.values(metrics).every(value => value === null)) continue;
    }
    if (previous && presentation === "csv") {
      for (const field of ["totalSets", "totalReps", "totalVolumeKg"] as const) {
        metrics[field] = previous[field] === null && metrics[field] === null ? null : (previous[field] ?? 0) + (metrics[field] ?? 0);
      }
      for (const field of ["bestSetReps", "heaviestKg", "e1rmKg"] as const) {
        metrics[field] = previous[field] === null && metrics[field] === null ? null : Math.max(previous[field] ?? 0, metrics[field] ?? 0);
      }
      metrics.durationSec ??= previous.durationSec;
    } else if (previous && presentation === "workbook") {
      // Old worksheet mapping overwrote supplied nonzero cells only.
      for (const field of Object.keys(metrics) as (keyof typeof metrics)[]) metrics[field] ??= previous[field];
    }
    records.set(key, { date: day.date, exercise: day.displayName, family: legacyExerciseFamily(day.displayName), ...metrics });
  }
  return [...records.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** All sources supply facts; this function alone composes the existing dashboard. */
export function buildDashboard(input: AggregateImport | AggregateImport[], presentation?: LegacyPresentation): DashboardData {
  const imports = Array.isArray(input) ? input : [input];
  if (imports.length !== 1) throw new Error("Import one history at a time until additive reconciliation is available.");
  for (const data of imports) assertValidImport(data);
  const records = legacyPresentationRecords(imports, presentation);
  if (records.length > 250_000 || new Set(records.map(record => record.exercise)).size > 5_000) throw new Error("Export exceeds the supported record or exercise limit.");
  const consistency = calculateConsistencySummary(records);
  const { dates, first, last, months, gaps, journeyDays, averageSessionsPerMonth, averageSessionsPerWeek } = consistency;
  if (journeyDays > 30 * 366 + 1) throw new Error("Export exceeds the supported date span.");
  const { exercises, achievements } = calculateExerciseSummaries(records);
  const { attendance, longestActiveWeekStreak } = calculateAttendance(records);
  const { muscleWindows, muscles, muscleHeatmap } = calculateSourceMuscles(imports.flatMap(data => data.muscleDays), first, last);
  const complete = months.filter(month => month.coverage === "complete");
  return {
    generatedAt: new Date().toISOString(),
    coverage: { firstDate: first, lastDate: last, journeyDays, totalSessions: dates.length, averageSessionsPerMonth, averageSessionsPerWeek, exerciseCount: exercises.length, longestActiveWeekStreak },
    monthly: months,
    busiestMonths: [...complete].sort((a, b) => b.sessions - a.sessions).slice(0, 5),
    quietestMonths: [...complete].sort((a, b) => a.sessions - b.sessions).slice(0, 5),
    gaps, attendance, exercises, muscleWindows, muscles, muscleHeatmap, achievements,
    methodology: { strength: "Weighted exercise progress defaults to the heaviest recorded load.", muscles: "Muscle balance uses muscle-group set equivalents. These are exposure signals, not diagnoses.", caveat: "Confirm sudden load changes against the exercise setup." },
  };
}
