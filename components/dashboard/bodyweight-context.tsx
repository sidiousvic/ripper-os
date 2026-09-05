"use client";

import type { BodyweightMeasurement } from "../../lib/domain/bodyweight";
import { lookupBodyweight } from "../../lib/analytics/bodyweight";

export default function BodyweightContext({ measurements, date, externalLoadKg }: { measurements: BodyweightMeasurement[]; date: string; externalLoadKg: number | null }) {
  if (externalLoadKg === null || externalLoadKg <= 0) return null;
  const result = lookupBodyweight(measurements, date);
  if (result.status !== "found") return <p className="muted small">Bodyweight context unavailable for this date.</p>;
  const ratio = externalLoadKg / result.measurement.kg;
  return <div className="callout"><strong>Bodyweight context</strong><span>{ratio.toFixed(2)}× external load / bodyweight</span><small>{result.measurement.kind} measurement from {result.measurement.date}{result.ageDays ? ` · ${result.ageDays} days old` : " · same day"}</small></div>;
}
