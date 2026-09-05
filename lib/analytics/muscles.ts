import type { SourceMuscleDay } from "../domain/training";

const DAY = 86400000;
const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

export function calculateSourceMuscles(muscleDays: SourceMuscleDay[], first: string, last: string) {
  const firstMs = Date.parse(`${first}T00:00:00Z`);
  const lastMs = Date.parse(`${last}T00:00:00Z`);
  const windowSpan = Math.min(8 * 7 * DAY, Math.max(DAY, Math.floor((lastMs - firstMs + DAY) / 2)));
  const earlyStart = first;
  const earlyEnd = new Date(Math.min(lastMs, firstMs + windowSpan - DAY)).toISOString().slice(0, 10);
  const recentStart = new Date(Math.max(firstMs, lastMs - windowSpan + DAY)).toISOString().slice(0, 10);
  const recentEnd = last;
  const weeksIn = (start: string, end: string) => Math.max(1, (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`) + DAY) / (7 * DAY));
  const totalFor = (muscle: string, start?: string, end?: string) => muscleDays.reduce((total, row) => {
    if (row.rawMuscleName !== muscle || (start && row.date < start) || (end && row.date > end)) return total;
    return total + row.setEquivalents;
  }, 0);
  const names = [...new Set(muscleDays.map((row) => row.rawMuscleName))];
  const muscles = names.map((muscle) => {
    const earlyWeekly = round(totalFor(muscle, earlyStart, earlyEnd) / weeksIn(earlyStart, earlyEnd));
    const recentWeekly = round(totalFor(muscle, recentStart, recentEnd) / weeksIn(recentStart, recentEnd));
    return { muscle, allTimeSets: round(totalFor(muscle)), earlyWeekly, recentWeekly, change: earlyWeekly ? round((recentWeekly / earlyWeekly - 1) * 100, 0) : recentWeekly ? 100 : 0 };
  }).filter((muscle) => muscle.allTimeSets > 0);
  const heatmapStart = new Date(Math.max(firstMs, lastMs - 12 * 7 * DAY));
  heatmapStart.setUTCDate(heatmapStart.getUTCDate() - ((heatmapStart.getUTCDay() + 6) % 7));
  const heatmapWeeks: string[] = [];
  for (let cursor = heatmapStart.valueOf(); cursor <= lastMs; cursor += 7 * DAY) heatmapWeeks.push(new Date(cursor).toISOString().slice(0, 10));
  return {
    muscleWindows: { early: [earlyStart, earlyEnd] as [string, string], recent: [recentStart, recentEnd] as [string, string] },
    muscles,
    muscleHeatmap: {
      weeks: heatmapWeeks,
      rows: muscles.map(({ muscle }) => ({ muscle, weeks: heatmapWeeks.map((week) => totalFor(muscle, week, new Date(Date.parse(`${week}T00:00:00Z`) + 6 * DAY).toISOString().slice(0, 10))) })),
    },
  };
}
