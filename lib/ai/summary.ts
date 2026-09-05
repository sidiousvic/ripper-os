type DataRecord = Record<string, unknown>;
const pick = (value: unknown, keys: string[]) => value && typeof value === "object" ? Object.fromEntries(keys.filter(key => key in (value as DataRecord)).map(key => [key, (value as DataRecord)[key]])) : {};
export function buildAiSummary(data: DataRecord) {
  const list = (value: unknown, keys: string[], limit: number) => Array.isArray(value) ? value.slice(0, limit).map((item: unknown) => pick(item, keys)) : [];
  return { coverage: pick(data.coverage, ["firstDate", "lastDate", "journeyDays", "totalSessions", "averageSessionsPerMonth", "averageSessionsPerWeek", "exerciseCount", "longestActiveWeekStreak"]), muscles: list(data.muscles, ["muscle", "allTimeSets", "earlyWeekly", "recentWeekly", "change"], 100), gaps: list(data.gaps, ["from", "to", "daysBetween", "daysOff"], 100), achievements: list(data.achievements, ["exercise", "metric", "first", "latest", "peak", "percentChange"], 100), busiestMonths: list(data.busiestMonths, ["month", "sessions"], 12), quietestMonths: list(data.quietestMonths, ["month", "sessions"], 12) };
}
