import type { Exercise, MetricKey } from "./dashboard-types";

type ExerciseRecord = {
  date: string;
  exerciseId: string;
  comparisonKey: string;
  exercise: string;
  family: string;
  source?: string;
  heaviestKg: number | null;
  e1rmKg: number | null;
  bestSetReps: number | null;
  totalVolumeKg: number | null;
  totalReps: number | null;
  totalSets: number | null;
  durationSec: number | null;
};

const metrics: MetricKey[] = ["heaviestKg", "e1rmKg", "bestSetReps", "totalVolumeKg", "totalReps", "totalSets", "durationSec"];
const finite = (value: number | null) => typeof value === "number" && Number.isFinite(value) ? value : null;
const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

export function calculateExerciseSummaries(records: ExerciseRecord[]) {
  const exercises: Exercise[] = [...new Set(records.map((record) => `${record.exerciseId}|${record.comparisonKey}`))].map((seriesId) => {
    const history = records.filter((record) => `${record.exerciseId}|${record.comparisonKey}` === seriesId);
    const name = history[0].exercise;
    const availableMetrics = metrics.filter((metric) => history.some((record) => finite(record[metric]) !== null));
    const cardio = /rope|run|walk|bike|cycling|cardio|rowing|rower/i.test(name);
    const defaultMetric: MetricKey = cardio && availableMetrics.includes("durationSec") ? "durationSec" : !cardio && availableMetrics.includes("heaviestKg") ? "heaviestKg" : availableMetrics.includes("bestSetReps") ? "bestSetReps" : availableMetrics.includes("totalReps") ? "totalReps" : "totalSets";
    return {
      exerciseId: history[0].exerciseId,
      comparisonKey: history[0].comparisonKey,
      seriesId,
      name,
      family: history[0].family,
      defaultMetric,
      availableMetrics,
      firstDate: history[0].date,
      lastDate: history.at(-1)!.date,
      sessions: new Set(history.map((record) => record.date)).size,
      totalSets: round(history.reduce((sum, record) => sum + (finite(record.totalSets) ?? 0), 0)),
      totalReps: round(history.reduce((sum, record) => sum + (finite(record.totalReps) ?? 0), 0)),
      totalVolumeKg: round(history.reduce((sum, record) => sum + (finite(record.totalVolumeKg) ?? 0), 0)),
      progress: history.map((record) => {
        const progress = { ...record };
        delete progress.source;
        return progress;
      }),
    };
  }).sort((a, b) => b.totalSets - a.totalSets || a.name.localeCompare(b.name));

  const achievements = exercises.filter((exercise) => exercise.progress.length > 1).map((exercise) => {
    const value = (point: typeof exercise.progress[number]) => finite(point[exercise.defaultMetric]);
    const populated = exercise.progress.filter((point) => value(point) !== null);
    if (!populated.length) return null;
    const first = populated[0];
    const latest = populated.at(-1)!;
    const peak = populated.reduce((best, point) => (value(point)! > value(best)! ? point : best), populated[0]);
    const firstValue = value(first)!;
    const peakValue = value(peak)!;
    return {
      exercise: exercise.name,
      metric: exercise.defaultMetric,
      first: { date: first.date, value: firstValue },
      latest: { date: latest.date, value: value(latest)! },
      peak: { date: peak.date, value: peakValue },
      percentChange: firstValue ? round((peakValue / firstValue - 1) * 100, 0) : 0,
    };
  }).filter((achievement): achievement is NonNullable<typeof achievement> => Boolean(achievement)).filter((achievement) => achievement.percentChange > 0).slice(0, 4);

  return { exercises, achievements };
}
