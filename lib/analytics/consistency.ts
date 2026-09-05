const DAY = 86400000;

export type DailyActivity = { date: string; totalSets: number | null };

const finite = (value: number | null) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

export function calculateConsistencySummary(days: DailyActivity[]) {
  const dates = [...new Set(days.filter((day) => finite(day.totalSets) > 0).map((day) => day.date))].sort();
  if (!dates.length) throw new Error("No workout sessions were found in this training export.");
  const first = dates[0];
  const last = dates.at(-1)!;
  const months: { month: string; sessions: number; cumulative: number; coverage: string }[] = [];
  let cumulative = 0;
  for (const cursor = new Date(`${first.slice(0, 7)}-01T00:00:00Z`); cursor.toISOString().slice(0, 7) <= last.slice(0, 7); cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
    const month = cursor.toISOString().slice(0, 7);
    const sessions = dates.filter((date) => date.startsWith(month)).length;
    cumulative += sessions;
    months.push({ month, sessions, cumulative, coverage: month === first.slice(0, 7) || month === last.slice(0, 7) ? "partial" : "complete" });
  }
  const gaps = dates.slice(1).map((to, index) => {
    const daysBetween = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${dates[index]}T00:00:00Z`)) / DAY);
    return { from: dates[index], to, daysBetween, daysOff: Math.max(0, daysBetween - 1) };
  }).sort((a, b) => b.daysBetween - a.daysBetween).slice(0, 12);
  return {
    dates,
    first,
    last,
    months,
    gaps,
    journeyDays: Math.round((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY) + 1,
    averageSessionsPerMonth: round(dates.length / months.length),
    averageSessionsPerWeek: round(dates.length / (((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY + 1) / 7)),
  };
}
