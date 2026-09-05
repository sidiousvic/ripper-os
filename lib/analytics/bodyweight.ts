import type { BodyweightMeasurement } from "../domain/bodyweight.ts";

export type BodyweightLookup =
  | { status: "found"; measurement: BodyweightMeasurement; ageDays: number }
  | { status: "missing"; reason: "no-measurement" | "stale" | "future-only" | "ambiguous" };

export function lookupBodyweight(measurements: BodyweightMeasurement[], date: string, maxAgeDays = 7): BodyweightLookup {
  const scale = measurements.filter((item) => item.kind === "scale").sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const sameDay = scale.filter((item) => item.date === date);
  if (sameDay.length > 1) return { status: "missing", reason: "ambiguous" };
  if (sameDay.length === 1) return { status: "found", measurement: sameDay[0], ageDays: 0 };
  const prior = scale.filter((item) => item.date < date).at(-1);
  if (!prior) return { status: "missing", reason: "future-only" };
  const ageDays = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${prior.date}T00:00:00Z`)) / 86_400_000);
  return ageDays <= maxAgeDays ? { status: "found", measurement: prior, ageDays } : { status: "missing", reason: "stale" };
}
