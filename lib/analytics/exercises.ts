import type { Exercise, MetricKey } from "./dashboard-types";

type ExerciseRecord = {
  date: string;
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
const finite = (value: number | null) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

export function calculateExerciseSummaries(records: ExerciseRecord[]) {
  const exercises: Exercise[] = [...new Set(records.map((record) => record.exercise))].map((name) => {
    const history = records.filter((record) => record.exercise === name);
    const availableMetrics = metrics.filter((metric) => history.some((record) => finite(record[metric]) > 0));
    const cardio = /rope|run|walk|bike|cycling|cardio|rowing|rower/i.test(name);
    const defaultMetric: MetricKey = cardio && availableMetrics.includes("durationSec") ? "durationSec" : !cardio && availableMetrics.includes("heaviestKg") ? "heaviestKg" : availableMetrics.includes("bestSetReps") ? "bestSetReps" : availableMetrics.includes("totalReps") ? "totalReps" : "totalSets";
    return {
      name,
      family: history[0].family,
      defaultMetric,
      availableMetrics,
      firstDate: history[0].date,
      lastDate: history.at(-1)!.date,
      sessions: new Set(history.map((record) => record.date)).size,
      totalSets: round(history.reduce((sum, record) => sum + finite(record.totalSets), 0)),
      totalReps: round(history.reduce((sum, record) => sum + finite(record.totalReps), 0)),
      totalVolumeKg: round(history.reduce((sum, record) => sum + finite(record.totalVolumeKg), 0)),
      progress: history.map((record) => {
        const progress = { ...record };
        delete progress.source;
        return progress;
      }),
    };
  }).sort((a, b) => b.totalSets - a.totalSets || a.name.localeCompare(b.name));

  const achievements = exercises.filter((exercise) => exercise.progress.length > 1).map((exercise) => {
    const first = exercise.progress[0];
    const latest = exercise.progress.at(-1)!;
    const value = (point: typeof first) => round(finite(point[exercise.defaultMetric]));
    const peak = exercise.progress.reduce((best, point) => value(point) > value(best) ? point : best, first);
    const firstValue = value(first);
    const peakValue = value(peak);
    return {
      exercise: exercise.name,
      metric: exercise.defaultMetric,
      first: { date: first.date, value: firstValue },
      latest: { date: latest.date, value: value(latest) },
      peak: { date: peak.date, value: peakValue },
      percentChange: firstValue ? round((peakValue / firstValue - 1) * 100, 0) : 0,
    };
  }).filter((achievement) => achievement.percentChange > 0).slice(0, 4);

  return { exercises, achievements };
}
