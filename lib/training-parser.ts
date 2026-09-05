/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import * as XLSX from "xlsx";
import { MAX_IMPORT_BYTES } from "./import-limits.mjs";

const DAY = 86400000;
const epoch = Date.UTC(1899, 11, 30);
const n = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : 0;
const r = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const key = (v: unknown) => { const d = v instanceof Date ? v : typeof v === "number" ? new Date(epoch + Math.round(v) * DAY) : new Date(`${String(v ?? "").replaceAll("/", "-").slice(0, 10)}T00:00:00Z`); return Number.isNaN(d.valueOf()) ? null : d.toISOString().slice(0, 10); };
const clean = (v: unknown) => String(v ?? "").replace(/ \((kg|sets|reps|sec)\)$/i, "").trim();
const family = (name: string) => { const s = name.toLowerCase(); if (s.includes("raise") || s.includes("overhead press")) return "Shoulders"; if (s.includes("bench") || s.includes("push") || s.includes("fly")) return "Chest"; if (s.includes("dip") || s.includes("triceps")) return "Triceps"; if (s.includes("pull") || s.includes("chin") || s.includes("row")) return "Back"; if (s.includes("curl") && !s.includes("leg curl")) return "Biceps"; if (s.includes("squat") || s.includes("lunge") || s.includes("leg extension")) return "Quads"; if (s.includes("deadlift") || s.includes("swing") || s.includes("hip thrust") || s.includes("leg curl")) return "Posterior chain"; if (s.includes("calf")) return "Calves"; if (s.includes("crunch") || s.includes("plank")) return "Core"; return "Other"; };
const aliases = new Map([["Wide Grip Pull Up", "Wide Grip Pull-Up"], ["Bench Dips", "Bench Dip"], ["Jumping Rope", "Jump Rope"]]);
const canonical = (v: unknown) => { const name = clean(v).split(" ∈ ")[0].trim(); return aliases.get(name) ?? name; };
const MAX_XLSX_EXPANDED_SIZE = 150 * 1024 * 1024;
const readU16 = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8);
const readU32 = (bytes: Uint8Array, offset: number) => (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
const hasSafeZipDirectory = (bytes: Uint8Array) => {
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) if (readU32(bytes, offset) === 0x06054b50) { eocd = offset; break; }
  if (eocd < 0) return false;
  const entries = readU16(bytes, eocd + 10); const directorySize = readU32(bytes, eocd + 12); let offset = readU32(bytes, eocd + 16);
  if (!entries || entries > 80 || offset + directorySize > bytes.length) return false;
  let expanded = 0;
  for (let index = 0; index < entries; index += 1) {
    if (readU32(bytes, offset) !== 0x02014b50 || offset + 46 > bytes.length) return false;
    expanded += readU32(bytes, offset + 24);
    if (expanded > MAX_XLSX_EXPANDED_SIZE) return false;
    offset += 46 + readU16(bytes, offset + 28) + readU16(bytes, offset + 30) + readU16(bytes, offset + 32);
  }
  return true;
};
export const safeParseMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (/No workout sessions/i.test(message)) return "No workout sessions were found in this MacroFactor export.";
  if (/Missing required MacroFactor sheet/i.test(message)) return "This workbook is missing a required MacroFactor workout sheet.";
  return "Could not parse this export. Confirm it is a supported MacroFactor CSV or XLSX file and try again.";
};

/** Pure local parser. Called only inside the browser worker; no network access. */
export function parseTrainingFile(fileBytes: Uint8Array, fileName: string) {
  if (!/\.(xlsx|csv)$/i.test(fileName)) throw new Error("Choose a MacroFactor .xlsx or .csv export.");
  if (fileBytes.byteLength > MAX_IMPORT_BYTES) throw new Error("The export is larger than the 25 MB import limit.");
  const xlsx = fileName.toLowerCase().endsWith(".xlsx");
    if (xlsx && !hasSafeZipDirectory(fileBytes)) throw new Error("Invalid workbook archive.");
    if (!xlsx && (fileBytes.includes(0) || !new TextDecoder("utf-8", { fatal: true }).decode(fileBytes.slice(0, Math.min(fileBytes.length, 8192))).trim())) throw new Error("Invalid CSV file.");
    const wb = XLSX.read(fileBytes, { type: "array", cellDates: true });
    if (!wb.SheetNames.length || wb.SheetNames.length > 60) throw new Error("Unsupported workbook structure.");
    for (const sheetName of wb.SheetNames) { const ref = wb.Sheets[sheetName]?.["!ref"]; if (!ref) continue; const range = XLSX.utils.decode_range(ref); if (range.e.r > 100_000 || range.e.c > 500) throw new Error("Workbook is too large to process safely."); }
    const rows = (name: string, required = false) => { const sheet = wb.Sheets[name]; if (!sheet) { if (required) throw new Error(`Missing required MacroFactor sheet: ${name}`); return []; } return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, UTC: true, defval: null }) as unknown[][]; };
    const map = new Map<string, any>();
    const merge = (sheet: string, field: string) => { const values = rows(sheet); const headers = values[0]?.map(clean) ?? []; for (const row of values.slice(1)) { const date = key(row[0]); if (!date) continue; for (let c = 1; c < headers.length; c += 1) { const value = n(row[c]); if (!value) continue; const exercise = canonical(headers[c]); const id = `${date}|${exercise}`; const item = map.get(id) ?? { date, source: "MacroFactor", exercise, family: family(exercise), totalSets: null, totalReps: null, bestSetReps: null, heaviestKg: null, totalVolumeKg: null, e1rmKg: null, durationSec: null }; item[field] = value; map.set(id, item); } } };
    if (fileName.toLowerCase().endsWith(".csv")) {
      const csvRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, UTC: true, defval: null }) as unknown[][];
      const headers = csvRows[0]?.map(clean) ?? []; const index = (name: string) => headers.findIndex((header) => header.toLowerCase() === clean(name).toLowerCase());
      const dateCol = index("Date"), exerciseCol = index("Exercise"), weightCol = index("Weight (kg)"), repsCol = index("Reps"), workoutDurationCol = index("Workout Duration"), durationCol = index("Duration");
      for (const row of csvRows.slice(1)) { const date = key(row[dateCol]); const exercise = canonical(row[exerciseCol]); if (!date || !exercise) continue; const id = `${date}|${exercise}`; const item = map.get(id) ?? { date, source: "MacroFactor", exercise, family: family(exercise), totalSets: 0, totalReps: 0, bestSetReps: 0, heaviestKg: 0, totalVolumeKg: 0, e1rmKg: null, durationSec: null }; const weight = n(row[weightCol]); const reps = n(row[repsCol]); item.totalSets += 1; item.totalReps += reps; item.bestSetReps = Math.max(item.bestSetReps, reps); item.heaviestKg = Math.max(item.heaviestKg, weight); item.totalVolumeKg += weight * reps; item.durationSec = n(row[durationCol]) || n(row[workoutDurationCol]) || item.durationSec; map.set(id, item); }
    } else {
      merge("Exercises - Total Sets", "totalSets"); merge("Exercises - Total Reps", "totalReps"); merge("Exercises - Best Set Reps", "bestSetReps"); merge("Exercises - Heaviest Weight", "heaviestKg"); merge("Exercises - Total Volume", "totalVolumeKg"); merge("Exercises - 1-RM", "e1rmKg"); merge("Exercises - Total Duration", "durationSec");
    }
    const records = [...map.values()].sort((a, b) => a.date.localeCompare(b.date)); const dates = [...new Set(records.filter((x) => n(x.totalSets) > 0).map((x) => x.date))].sort(); if (!dates.length) throw new Error("No workout sessions were found in this MacroFactor export.");
    const sessions = dates.map((date) => { const day = records.filter((x) => x.date === date); return { date, source: "MacroFactor", workout: "MacroFactor workout day", durationMin: null, totalSets: day.reduce((s, x) => s + n(x.totalSets), 0), totalReps: day.reduce((s, x) => s + n(x.totalReps), 0) || null, volumeKg: day.reduce((s, x) => s + n(x.totalVolumeKg), 0) || null }; });
    const first = dates[0], last = dates.at(-1)!; const months: any[] = []; let cumulative = 0; for (const d = new Date(`${first.slice(0, 7)}-01T00:00:00Z`); d.toISOString().slice(0, 7) <= last.slice(0, 7); d.setUTCMonth(d.getUTCMonth() + 1)) { const month = d.toISOString().slice(0, 7); const count = sessions.filter((x) => x.date.startsWith(month)).length; cumulative += count; months.push({ month, sessions: count, cumulative, coverage: month === first.slice(0, 7) || month === last.slice(0, 7) ? "partial" : "complete" }); }
    const gaps = dates.slice(1).map((to, i) => { const daysBetween = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${dates[i]}T00:00:00Z`)) / DAY); return { from: dates[i], to, daysBetween, daysOff: Math.max(0, daysBetween - 1) }; }).sort((a, b) => b.daysBetween - a.daysBetween).slice(0, 12);
    const exercises = [...new Set(records.map((x) => x.exercise))].map((name) => { const history = records.filter((x) => x.exercise === name); const availableMetrics = ["heaviestKg", "e1rmKg", "bestSetReps", "totalVolumeKg", "totalReps", "totalSets", "durationSec"].filter((k) => history.some((x) => n(x[k]) > 0)); const cardio = /rope|run|walk|bike|cycling|cardio|rowing|rower/i.test(name); const metric = cardio && availableMetrics.includes("durationSec") ? "durationSec" : !cardio && availableMetrics.includes("heaviestKg") ? "heaviestKg" : availableMetrics.includes("bestSetReps") ? "bestSetReps" : availableMetrics.includes("totalReps") ? "totalReps" : "totalSets"; return { name, family: family(name), defaultMetric: metric, availableMetrics, firstDate: history[0].date, lastDate: history.at(-1).date, sessions: new Set(history.map((x) => x.date)).size, totalSets: r(history.reduce((s, x) => s + n(x.totalSets), 0)), totalReps: r(history.reduce((s, x) => s + n(x.totalReps), 0)), totalVolumeKg: r(history.reduce((s, x) => s + n(x.totalVolumeKg), 0)), progress: history.map(({ source, ...x }) => x) }; }).sort((a, b) => b.totalSets - a.totalSets || a.name.localeCompare(b.name));
    const achievements = exercises.filter((x) => x.progress.length > 1).map((x) => { const firstPoint = x.progress[0], latest = x.progress.at(-1), value = (p: any) => r(n(p[x.defaultMetric])); const peak = x.progress.reduce((best, point) => value(point) > value(best) ? point : best, firstPoint); const percentChange = value(firstPoint) ? r((value(peak) / value(firstPoint) - 1) * 100, 0) : 0; return { exercise: x.name, metric: x.defaultMetric, first: { date: firstPoint.date, value: value(firstPoint) }, latest: { date: latest.date, value: value(latest) }, peak: { date: peak.date, value: value(peak) }, percentChange }; }).filter((achievement) => achievement.percentChange > 0).slice(0, 4);
    // MacroFactor's muscle sheet is a dated set-equivalent ledger. Keep the two
    // comparison windows separate: previously these were both derived from the
    // all-time total, which made every pair of lines the same length.
    const muscleValues = fileName.toLowerCase().endsWith(".csv") ? [["Date"]] : rows("Muscle Groups - Sets");
    const muscleHeaders = muscleValues[0]?.map(clean) ?? [];
    const muscleRows = muscleValues.slice(1).flatMap((row) => {
      const date = key(row[0]);
      if (!date) return [];
      return [{ date, values: muscleHeaders.slice(1).map((muscle, index) => ({ muscle, sets: n(row[index + 1]) })) }];
    });
    const firstMs = Date.parse(`${first}T00:00:00Z`);
    const lastMs = Date.parse(`${last}T00:00:00Z`);
    // Use up to eight weeks per side, but never overlap the comparison windows.
    // A short export should compare its first and last portions, not largely the
    // same days twice.
    const windowSpan = Math.min(8 * 7 * DAY, Math.max(DAY, Math.floor((lastMs - firstMs + DAY) / 2)));
    const earlyStart = first;
    const earlyEnd = new Date(Math.min(lastMs, firstMs + windowSpan - DAY)).toISOString().slice(0, 10);
    const recentStart = new Date(Math.max(firstMs, lastMs - windowSpan + DAY)).toISOString().slice(0, 10);
    const recentEnd = last;
    const weeksIn = (start: string, end: string) => Math.max(1, (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`) + DAY) / (7 * DAY));
    const totalFor = (muscle: string, start?: string, end?: string) => muscleRows.reduce((total, row) => {
      if ((start && row.date < start) || (end && row.date > end)) return total;
      return total + (row.values.find((value) => value.muscle === muscle)?.sets ?? 0);
    }, 0);
    const muscles = muscleHeaders.slice(1).map((muscle) => {
      const earlyWeekly = r(totalFor(muscle, earlyStart, earlyEnd) / weeksIn(earlyStart, earlyEnd));
      const recentWeekly = r(totalFor(muscle, recentStart, recentEnd) / weeksIn(recentStart, recentEnd));
      return { muscle, allTimeSets: r(totalFor(muscle)), earlyWeekly, recentWeekly, change: earlyWeekly ? r(((recentWeekly / earlyWeekly) - 1) * 100, 0) : recentWeekly ? 100 : 0 };
    }).filter((muscle) => muscle.allTimeSets > 0);
    const heatmapStart = new Date(Math.max(firstMs, lastMs - 12 * 7 * DAY));
    heatmapStart.setUTCDate(heatmapStart.getUTCDate() - ((heatmapStart.getUTCDay() + 6) % 7));
    const heatmapWeeks: string[] = [];
    for (let cursor = heatmapStart.valueOf(); cursor <= lastMs; cursor += 7 * DAY) heatmapWeeks.push(new Date(cursor).toISOString().slice(0, 10));
    const muscleHeatmap = {
      weeks: heatmapWeeks,
      rows: muscles.map(({ muscle }) => ({
        muscle,
        weeks: heatmapWeeks.map((week) => totalFor(muscle, week, new Date(Date.parse(`${week}T00:00:00Z`) + 6 * DAY).toISOString().slice(0, 10))),
      })),
    };
    const monday = (value: string) => { const d = new Date(`${value}T00:00:00Z`); return new Date(d.valueOf() - ((d.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10); };
    const weekMap = new Map<string, Set<string>>(); for (const date of dates) { const week = monday(date); if (!weekMap.has(week)) weekMap.set(week, new Set()); weekMap.get(week)!.add(date); }
    const dailySets = new Map<string, number>(); const dailyLoad = new Map<string, number>(); for (const record of records) { dailySets.set(record.date, (dailySets.get(record.date) ?? 0) + n(record.totalSets)); dailyLoad.set(record.date, (dailyLoad.get(record.date) ?? 0) + n(record.totalVolumeKg)); }
    const maxDailyLoad = Math.max(...dailyLoad.values(), 0);
    const attendance: any[] = []; const firstWeek = new Date(`${monday(first)}T00:00:00Z`); const lastWeek = new Date(`${monday(last)}T00:00:00Z`); let currentStreak = 0; let longestStreak = 0;
    for (let cursor = firstWeek; cursor <= lastWeek; cursor = new Date(cursor.valueOf() + 7 * DAY)) { const week = cursor.toISOString().slice(0, 10); const active = weekMap.get(week) ?? new Set<string>(); const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(cursor.valueOf() + index * DAY).toISOString().slice(0, 10); const sets = dailySets.get(date) ?? 0; const load = dailyLoad.get(date) ?? 0; const ratio = maxDailyLoad ? load / maxDailyLoad : 0; return sets ? maxDailyLoad ? ratio >= .66 ? 3 : ratio >= .33 ? 2 : 1 : sets >= 16 ? 3 : sets >= 8 ? 2 : 1 : 0; }); attendance.push({ week, days, sessions: active.size }); if (active.size) { currentStreak += 1; longestStreak = Math.max(longestStreak, currentStreak); } else currentStreak = 0; }
    const complete = months.filter((x) => x.coverage === "complete"); const payload = { generatedAt: new Date().toISOString(), coverage: { firstDate: first, lastDate: last, journeyDays: Math.round((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY) + 1, totalSessions: sessions.length, averageSessionsPerMonth: r(sessions.length / months.length), averageSessionsPerWeek: r(sessions.length / (((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY + 1) / 7)), exerciseCount: exercises.length, longestActiveWeekStreak: longestStreak }, monthly: months, busiestMonths: [...complete].sort((a, b) => b.sessions - a.sessions).slice(0, 5), quietestMonths: [...complete].sort((a, b) => a.sessions - b.sessions).slice(0, 5), gaps, attendance, exercises, muscleWindows: { early: [earlyStart, earlyEnd], recent: [recentStart, recentEnd] }, muscles, muscleHeatmap, achievements, methodology: { strength: "Weighted exercise progress defaults to the heaviest recorded load.", muscles: "Muscle balance uses muscle-group set equivalents. These are exposure signals, not diagnoses.", caveat: "Confirm sudden load changes against the exercise setup." } };
    return payload;
}
