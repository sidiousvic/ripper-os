const DAY = 86400000;

export type AttendanceRecord = { date: string; totalSets: number | null; totalVolumeKg: number | null };

const finite = (value: number | null) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const monday = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return new Date(date.valueOf() - ((date.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
};

export function calculateAttendance(records: AttendanceRecord[]) {
  const dates = [...new Set(records.filter((record) => finite(record.totalSets) > 0).map((record) => record.date))].sort();
  if (!dates.length) return { attendance: [], longestActiveWeekStreak: 0 };
  const weekMap = new Map<string, Set<string>>();
  for (const date of dates) {
    const week = monday(date);
    if (!weekMap.has(week)) weekMap.set(week, new Set());
    weekMap.get(week)!.add(date);
  }
  const dailySets = new Map<string, number>();
  const dailyLoad = new Map<string, number>();
  for (const record of records) {
    dailySets.set(record.date, (dailySets.get(record.date) ?? 0) + finite(record.totalSets));
    dailyLoad.set(record.date, (dailyLoad.get(record.date) ?? 0) + finite(record.totalVolumeKg));
  }
  const maxDailyLoad = Math.max(...dailyLoad.values(), 0);
  const firstWeek = new Date(`${monday(dates[0])}T00:00:00Z`);
  const lastWeek = new Date(`${monday(dates.at(-1)!)}T00:00:00Z`);
  const attendance: { week: string; days: number[]; sessions: number }[] = [];
  let currentStreak = 0;
  let longestStreak = 0;
  for (let cursor = firstWeek; cursor <= lastWeek; cursor = new Date(cursor.valueOf() + 7 * DAY)) {
    const week = cursor.toISOString().slice(0, 10);
    const active = weekMap.get(week) ?? new Set<string>();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(cursor.valueOf() + index * DAY).toISOString().slice(0, 10);
      const sets = dailySets.get(date) ?? 0;
      const load = dailyLoad.get(date) ?? 0;
      const ratio = maxDailyLoad ? load / maxDailyLoad : 0;
      return sets ? maxDailyLoad ? ratio >= .66 ? 3 : ratio >= .33 ? 2 : 1 : sets >= 16 ? 3 : sets >= 8 ? 2 : 1 : 0;
    });
    attendance.push({ week, days, sessions: active.size });
    if (active.size) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else currentStreak = 0;
  }
  return { attendance, longestActiveWeekStreak: longestStreak };
}
