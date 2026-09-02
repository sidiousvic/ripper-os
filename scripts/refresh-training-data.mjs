import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [gymversePath, macroFactorPath, outputPath] = process.argv.slice(2).filter((value) => value !== "--");
if (!gymversePath || !macroFactorPath || !outputPath) {
  throw new Error("Usage: export_training_web_data.mjs <gymverse.xlsx> <macrofactor.xlsx> <output.json>");
}

const DAY = 86_400_000;
const excelEpoch = Date.UTC(1899, 11, 30);
const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
const toDate = (value) => {
  if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  if (typeof value === "number" && Number.isFinite(value)) return new Date(excelEpoch + Math.round(value) * DAY);
  if (typeof value === "string") {
    const parsed = new Date(`${value.replaceAll("/", "-").slice(0, 10)}T00:00:00Z`);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }
  return null;
};
const dateKey = (value) => toDate(value)?.toISOString().slice(0, 10) ?? null;
const dateFromKey = (value) => new Date(`${value}T00:00:00Z`);
const numOrNull = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
const num = (value) => numOrNull(value) ?? 0;
const cleanMetric = (value) => String(value ?? "").replace(/ \((kg|sets|reps|sec)\)$/i, "").trim();
const headersOf = (header) => Object.fromEntries(header.map((value, index) => [String(value), index]));
const rowsFrom = (workbook, name) => workbook.worksheets.getItem(name).getUsedRange(true).values;
const sortByDate = (a, b) => a.date.localeCompare(b.date);

const canonicalAliases = new Map([
  ["Bench Dips", "Bench Dip"],
  ["Wide Grip Pull Up", "Wide Grip Pull-Up"],
  ["Jumping Rope", "Jump Rope"],
  ["Standing Dumbbell Bicep Curl", "Standing Dumbbell Biceps Curl"],
]);
const canonicalExercise = (name) => canonicalAliases.get(cleanMetric(name)) ?? cleanMetric(name);
const exerciseFamily = (name) => {
  const s = canonicalExercise(name).toLowerCase();
  if (s.includes("lateral raise")) return "Shoulders";
  if (s.includes("overhead press")) return "Shoulders";
  if (s.includes("bench press") || s.includes("push-up") || s === "push up" || s.includes("fly")) return "Chest";
  if (s.includes("dip") || s.includes("skull crusher") || s.includes("triceps") || s.includes("kick back")) return "Triceps";
  if (s.includes("pull-up") || s.includes("chin-up") || s.includes("row")) return "Back";
  if (s.includes("curl") && !s.includes("leg curl") && !s.includes("neck curl") && !s.includes("wrist curl")) return "Biceps";
  if (s.includes("squat") || s.includes("lunge") || s.includes("step up") || s.includes("leg extension")) return "Quads";
  if (s.includes("deadlift") || s.includes("swing") || s.includes("hip thrust") || s.includes("leg curl") || s.includes("nordic")) return "Posterior chain";
  if (s.includes("calf")) return "Calves";
  if (s.includes("raise") && (s.includes("leg") || s.includes("knee"))) return "Core";
  if (s.includes("crunch") || s.includes("rollout") || s.includes("ab wheel") || s.includes("plank")) return "Core";
  if (s.includes("shrug")) return "Traps";
  if (s.includes("neck")) return "Neck";
  if (s.includes("wrist") || s.includes("deadhang")) return "Grip";
  if (s.includes("rope")) return "Conditioning";
  return "Other";
};
const defaultMetric = (name, records) => {
  const s = name.toLowerCase();
  if (records.some((record) => num(record.durationSec) > 0) && (s.includes("rope") || s.includes("hang") || s.includes("plank"))) return "durationSec";
  if (s.includes("push up") || s.includes("push-up") || s.includes("pull-up") || s.includes("chin-up") || s.includes("dip")) return "bestSetReps";
  if (records.some((record) => num(record.heaviestKg) > 0)) return "heaviestKg";
  if (records.some((record) => num(record.bestSetReps) > 0)) return "bestSetReps";
  return "totalSets";
};

const gymverse = await SpreadsheetFile.importXlsx(await FileBlob.load(gymversePath));
const macroFactor = await SpreadsheetFile.importXlsx(await FileBlob.load(macroFactorPath));

const gymSessionRows = rowsFrom(gymverse, "Sessions");
const gymSessionHeaders = headersOf(gymSessionRows[0]);
const gymExerciseRows = rowsFrom(gymverse, "Exercise Daily");
const gymExerciseHeaders = headersOf(gymExerciseRows[0]);
const gymSetRows = rowsFrom(gymverse, "Sets");
const gymSetHeaders = headersOf(gymSetRows[0]);

const gymBestReps = new Map();
for (const row of gymSetRows.slice(1)) {
  const date = dateKey(row[gymSetHeaders.Date]);
  const exercise = canonicalExercise(row[gymSetHeaders["Exercise Canonical"]]);
  const reps = num(row[gymSetHeaders.Reps]);
  if (!date || !exercise || !reps) continue;
  const key = `${date}|${exercise}`;
  gymBestReps.set(key, Math.max(gymBestReps.get(key) ?? 0, reps));
}

const exerciseRecords = [];
const gymRepsByDate = new Map();
for (const row of gymExerciseRows.slice(1)) {
  const date = dateKey(row[gymExerciseHeaders.Date]);
  const exercise = canonicalExercise(row[gymExerciseHeaders.Exercise]);
  if (!date || !exercise) continue;
  const totalReps = num(row[gymExerciseHeaders["Total Reps"]]);
  gymRepsByDate.set(date, (gymRepsByDate.get(date) ?? 0) + totalReps);
  const heaviestKg = numOrNull(row[gymExerciseHeaders["Heaviest Weight (kg)"]]);
  const bestSetReps = gymBestReps.get(`${date}|${exercise}`) ?? null;
  exerciseRecords.push({
    date,
    source: "Gymverse",
    exercise,
    family: exerciseFamily(exercise),
    totalSets: numOrNull(row[gymExerciseHeaders["Total Sets"]]),
    totalReps: totalReps || null,
    bestSetReps,
    heaviestKg,
    totalVolumeKg: numOrNull(row[gymExerciseHeaders["Total Load Volume (kg)"]]),
    e1rmKg: heaviestKg && bestSetReps ? round(heaviestKg * (1 + bestSetReps / 30), 1) : null,
    durationSec: numOrNull(row[gymExerciseHeaders["Total Duration (sec)"]]),
  });
}

const sessions = gymSessionRows.slice(1).map((row) => {
  const date = dateKey(row[gymSessionHeaders.Date]);
  return {
    date,
    source: "Gymverse",
    workout: String(row[gymSessionHeaders.Workout] ?? "Workout"),
    durationMin: num(row[gymSessionHeaders["Duration (sec)"]]) ? round(num(row[gymSessionHeaders["Duration (sec)"]]) / 60, 1) : null,
    totalSets: numOrNull(row[gymSessionHeaders.Sets]),
    totalReps: gymRepsByDate.get(date) ?? null,
    volumeKg: numOrNull(row[gymSessionHeaders["Calculated Load Volume (kg)"]]),
  };
}).filter((row) => row.date);

const macroExerciseMap = new Map();
const mergeMacroMetric = (sheetName, field) => {
  const rows = rowsFrom(macroFactor, sheetName);
  const headers = rows[0].map(cleanMetric);
  for (const row of rows.slice(1)) {
    const date = dateKey(row[0]);
    if (!date) continue;
    for (let col = 1; col < headers.length; col += 1) {
      const value = numOrNull(row[col]);
      if (value === null || value === 0) continue;
      const exercise = canonicalExercise(headers[col]);
      const key = `${date}|${exercise}`;
      if (!macroExerciseMap.has(key)) {
        macroExerciseMap.set(key, {
          date,
          source: "MacroFactor",
          exercise,
          family: exerciseFamily(exercise),
          totalSets: null,
          totalReps: null,
          bestSetReps: null,
          heaviestKg: null,
          totalVolumeKg: null,
          e1rmKg: null,
          durationSec: null,
        });
      }
      macroExerciseMap.get(key)[field] = value;
    }
  }
};
mergeMacroMetric("Exercises - Total Sets", "totalSets");
mergeMacroMetric("Exercises - Total Reps", "totalReps");
mergeMacroMetric("Exercises - Best Set Reps", "bestSetReps");
mergeMacroMetric("Exercises - Heaviest Weight", "heaviestKg");
mergeMacroMetric("Exercises - Total Volume", "totalVolumeKg");
mergeMacroMetric("Exercises - 1-RM", "e1rmKg");
mergeMacroMetric("Exercises - Total Duration", "durationSec");
exerciseRecords.push(...macroExerciseMap.values());

const macroByDate = new Map();
for (const record of macroExerciseMap.values()) {
  if (!macroByDate.has(record.date)) macroByDate.set(record.date, { totalSets: 0, totalReps: 0, volumeKg: 0 });
  const totals = macroByDate.get(record.date);
  totals.totalSets += num(record.totalSets);
  totals.totalReps += num(record.totalReps);
  totals.volumeKg += num(record.totalVolumeKg);
}
for (const [date, totals] of macroByDate) {
  if (!totals.totalSets) continue;
  sessions.push({
    date,
    source: "MacroFactor",
    workout: "MacroFactor workout day",
    durationMin: null,
    totalSets: totals.totalSets,
    totalReps: totals.totalReps || null,
    volumeKg: totals.volumeKg || null,
  });
}
sessions.sort(sortByDate);
exerciseRecords.sort((a, b) => a.date.localeCompare(b.date) || a.exercise.localeCompare(b.exercise));

const firstDate = sessions[0].date;
const lastDate = sessions.at(-1).date;
const firstMonth = firstDate.slice(0, 7);
const lastMonth = lastDate.slice(0, 7);
const monthCursor = new Date(`${firstMonth}-01T00:00:00Z`);
const monthly = [];
let cumulative = 0;
while (monthCursor.toISOString().slice(0, 7) <= lastMonth) {
  const month = monthCursor.toISOString().slice(0, 7);
  const count = sessions.filter((session) => session.date.startsWith(month)).length;
  cumulative += count;
  monthly.push({ month, sessions: count, cumulative, coverage: month === firstMonth || month === lastMonth ? "partial" : "complete" });
  monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1);
}

const uniqueDates = [...new Set(sessions.map((session) => session.date))].sort();
const gaps = [];
for (let index = 1; index < uniqueDates.length; index += 1) {
  const from = uniqueDates[index - 1];
  const to = uniqueDates[index];
  const daysBetween = Math.round((dateFromKey(to) - dateFromKey(from)) / DAY);
  gaps.push({ from, to, daysBetween, daysOff: Math.max(0, daysBetween - 1) });
}
gaps.sort((a, b) => b.daysBetween - a.daysBetween || a.from.localeCompare(b.from));

const mondayKey = (value) => {
  const date = dateFromKey(value);
  const offset = (date.getUTCDay() + 6) % 7;
  return new Date(date.valueOf() - offset * DAY).toISOString().slice(0, 10);
};
const sessionsByWeek = new Map();
for (const date of uniqueDates) {
  const week = mondayKey(date);
  if (!sessionsByWeek.has(week)) sessionsByWeek.set(week, []);
  sessionsByWeek.get(week).push(date);
}
const firstMonday = dateFromKey(mondayKey(firstDate));
const lastMonday = dateFromKey(mondayKey(lastDate));
const attendance = [];
let activeWeekStreak = 0;
let longestWeekStreak = 0;
for (let cursor = new Date(firstMonday); cursor <= lastMonday; cursor = new Date(cursor.valueOf() + 7 * DAY)) {
  const week = cursor.toISOString().slice(0, 10);
  const dates = new Set(sessionsByWeek.get(week) ?? []);
  const days = Array.from({ length: 7 }, (_, day) => dates.has(new Date(cursor.valueOf() + day * DAY).toISOString().slice(0, 10)) ? 1 : 0);
  attendance.push({ week, days, sessions: days.reduce((sum, value) => sum + value, 0) });
  if (days.some(Boolean)) {
    activeWeekStreak += 1;
    longestWeekStreak = Math.max(longestWeekStreak, activeWeekStreak);
  } else {
    activeWeekStreak = 0;
  }
}

const gymMuscleRows = rowsFrom(gymverse, "Muscle Daily");
const gymMuscleHeaders = headersOf(gymMuscleRows[0]);
const muscleRecords = gymMuscleRows.slice(1).map((row) => ({
  date: dateKey(row[gymMuscleHeaders.Date]),
  source: "Gymverse",
  muscle: String(row[gymMuscleHeaders.Muscle] ?? ""),
  sets: num(row[gymMuscleHeaders["Set Equivalent"]]),
})).filter((row) => row.date && row.muscle && row.sets);

const macroMuscleRows = rowsFrom(macroFactor, "Muscle Groups - Sets");
const macroMuscleHeaders = macroMuscleRows[0].map(cleanMetric);
for (const row of macroMuscleRows.slice(1)) {
  const date = dateKey(row[0]);
  if (!date) continue;
  for (let col = 1; col < macroMuscleHeaders.length; col += 1) {
    const sets = num(row[col]);
    if (sets) muscleRecords.push({ date, source: "MacroFactor", muscle: macroMuscleHeaders[col], sets });
  }
}

const earlyEnd = new Date(dateFromKey(firstDate).valueOf() + 55 * DAY).toISOString().slice(0, 10);
const recentStart = new Date(dateFromKey(lastDate).valueOf() - 55 * DAY).toISOString().slice(0, 10);
const muscleMap = new Map();
for (const record of muscleRecords) {
  if (!muscleMap.has(record.muscle)) muscleMap.set(record.muscle, { muscle: record.muscle, allTime: 0, early: 0, recent: 0 });
  const item = muscleMap.get(record.muscle);
  item.allTime += record.sets;
  if (record.date <= earlyEnd) item.early += record.sets;
  if (record.date >= recentStart) item.recent += record.sets;
}
const muscleSummary = [...muscleMap.values()].map((item) => ({
  muscle: item.muscle,
  allTimeSets: round(item.allTime),
  earlyWeekly: round(item.early / 8),
  recentWeekly: round(item.recent / 8),
  change: round(item.recent / 8 - item.early / 8),
})).sort((a, b) => b.recentWeekly - a.recentWeekly || a.muscle.localeCompare(b.muscle));

const heatmapWeeks = attendance.slice(-13).map((week) => week.week);
const muscleHeatmap = muscleSummary.map((item) => ({
  muscle: item.muscle,
  weeks: heatmapWeeks.map((week) => {
    const end = new Date(dateFromKey(week).valueOf() + 7 * DAY).toISOString().slice(0, 10);
    return round(muscleRecords.filter((record) => record.muscle === item.muscle && record.date >= week && record.date < end).reduce((sum, record) => sum + record.sets, 0));
  }),
}));

const exerciseMap = new Map();
for (const record of exerciseRecords) {
  if (!exerciseMap.has(record.exercise)) exerciseMap.set(record.exercise, []);
  exerciseMap.get(record.exercise).push(record);
}
const exercises = [...exerciseMap.entries()].map(([name, records]) => {
  records.sort(sortByDate);
  const metric = defaultMetric(name, records);
  const availableMetrics = ["heaviestKg", "e1rmKg", "bestSetReps", "totalVolumeKg", "totalReps", "totalSets", "durationSec"]
    .filter((key) => records.some((record) => num(record[key]) > 0));
  return {
    name,
    family: exerciseFamily(name),
    defaultMetric: metric,
    availableMetrics,
    firstDate: records[0].date,
    lastDate: records.at(-1).date,
    sessions: new Set(records.map((record) => record.date)).size,
    totalSets: round(records.reduce((sum, record) => sum + num(record.totalSets), 0)),
    totalReps: round(records.reduce((sum, record) => sum + num(record.totalReps), 0)),
    totalVolumeKg: round(records.reduce((sum, record) => sum + num(record.totalVolumeKg), 0)),
    progress: records.map((record) => Object.fromEntries(Object.entries(record).filter(([key]) => key !== "source"))),
  };
}).sort((a, b) => b.totalSets - a.totalSets || a.name.localeCompare(b.name));

const progressChange = (exerciseName, metric) => {
  const exercise = exercises.find((item) => item.name === exerciseName);
  if (!exercise) return null;
  const values = exercise.progress.filter((record) => num(record[metric]) > 0);
  if (values.length < 2) return null;
  const first = values[0];
  const latest = values.at(-1);
  const peak = values.reduce((best, record) => num(record[metric]) > num(best[metric]) ? record : best, values[0]);
  return {
    exercise: exerciseName,
    metric,
    first: { date: first.date, value: round(first[metric], 1) },
    latest: { date: latest.date, value: round(latest[metric], 1) },
    peak: { date: peak.date, value: round(peak[metric], 1) },
    percentChange: round((latest[metric] / first[metric] - 1) * 100, 0),
  };
};

const completeMonths = monthly.filter((item) => item.coverage === "complete");
const busiestMonths = [...completeMonths].sort((a, b) => b.sessions - a.sessions || a.month.localeCompare(b.month)).slice(0, 5);
const quietestMonths = [...completeMonths].sort((a, b) => a.sessions - b.sessions || a.month.localeCompare(b.month)).slice(0, 5);

const output = {
  generatedAt: new Date().toISOString(),
  coverage: {
    firstDate,
    lastDate,
    journeyDays: Math.round((dateFromKey(lastDate) - dateFromKey(firstDate)) / DAY) + 1,
    totalSessions: sessions.length,
    averageSessionsPerMonth: round(sessions.length / monthly.length),
    averageSessionsPerWeek: round(sessions.length / (((dateFromKey(lastDate) - dateFromKey(firstDate)) / DAY + 1) / 7)),
    exerciseCount: exercises.length,
    longestActiveWeekStreak: longestWeekStreak,
  },
  monthly,
  busiestMonths,
  quietestMonths,
  gaps: gaps.slice(0, 12),
  attendance,
  exercises,
  muscleWindows: { early: [firstDate, earlyEnd], recent: [recentStart, lastDate] },
  muscles: muscleSummary,
  muscleHeatmap: { weeks: heatmapWeeks, rows: muscleHeatmap },
  achievements: [
    progressChange("Dumbbell Fly", "heaviestKg"),
    progressChange("Standing Dumbbell Lateral Raise", "heaviestKg"),
    progressChange("Standing Dumbbell Overhead Press", "heaviestKg"),
    progressChange("Wide Grip Pull-Up", "bestSetReps"),
  ].filter(Boolean),
  methodology: {
    strength: "Weighted exercise progress defaults to the heaviest recorded load. Bodyweight movements default to best-set reps. Estimated 1RM is shown when present or derivable.",
    muscles: "Muscle balance uses muscle-group set equivalents. These are exposure signals, not medical conclusions or proof of overtraining.",
    caveat: "Some movements may include bodyweight in the recorded resistance. Sudden load jumps should be interpreted only after confirming the exercise setup.",
  },
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({
  outputPath,
  sessions: sessions.length,
  exercises: exercises.length,
  exerciseRecords: exerciseRecords.length,
  muscles: muscleSummary.length,
  firstDate,
  lastDate,
}, null, 2));
