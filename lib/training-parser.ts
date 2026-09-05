/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";
import { MAX_IMPORT_BYTES } from "./import-limits.mjs";
import { calculateConsistencySummary } from "./analytics/consistency.ts";
import { calculateExerciseSummaries } from "./analytics/exercises.ts";
import { calculateAttendance } from "./analytics/attendance.ts";
import { calculateSourceMuscles } from "./analytics/muscles.ts";
import { buildDashboard } from "./analytics/build-dashboard.ts";
import { createMacroFactorImport } from "./import/adapters/macrofactor.ts";
import { validateCanonicalExerciseDays } from "./import/validation.ts";

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
const MAX_RECORDS = 250_000;
const MAX_UNIQUE_EXERCISES = 5_000;
const MAX_DATE_SPAN_DAYS = 30 * 366;
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
  if (/Missing required CSV column/i.test(message)) return "This CSV is missing a required Date, Exercise, or Reps column.";
  if (/Unsupported weight unit/i.test(message)) return "This CSV uses an unsupported weight unit. Use kilograms (kg) or pounds (lb).";
  if (/Export exceeds the supported/i.test(message)) return "This export is too large or spans too much history to process safely in the browser.";
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
      const rawHeaders = csvRows[0]?.map((header) => String(header ?? "").trim()) ?? []; const headers = rawHeaders.map(clean); const index = (name: string) => headers.findIndex((header) => header.toLowerCase() === clean(name).toLowerCase());
      const dateCol = index("Date"), exerciseCol = index("Exercise"), repsCol = index("Reps"), workoutDurationCol = index("Workout Duration"), durationCol = index("Duration");
      const weightKgCol = rawHeaders.findIndex((header) => /^weight\s*\(kg\)$/i.test(header));
      const weightLbCol = rawHeaders.findIndex((header) => /^weight\s*\((?:lb|lbs|pounds)\)$/i.test(header));
      const unsupportedWeight = rawHeaders.find((header) => /^weight\s*\(/i.test(header) && !/^weight\s*\((?:kg|lb|lbs|pounds)\)$/i.test(header));
      if (dateCol < 0 || exerciseCol < 0 || repsCol < 0) throw new Error("Missing required CSV column.");
      if (unsupportedWeight) throw new Error(`Unsupported weight unit: ${unsupportedWeight}`);
      const weightCol = weightKgCol >= 0 ? weightKgCol : weightLbCol;
      const pounds = weightKgCol < 0 && weightLbCol >= 0;
      for (const row of csvRows.slice(1)) { const date = key(row[dateCol]); const exercise = canonical(row[exerciseCol]); if (!date || !exercise) continue; const id = `${date}|${exercise}`; const item = map.get(id) ?? { date, source: "MacroFactor", exercise, family: family(exercise), totalSets: 0, totalReps: 0, bestSetReps: 0, heaviestKg: 0, totalVolumeKg: 0, e1rmKg: null, durationSec: null }; const weight = n(row[weightCol]) * (pounds ? 0.45359237 : 1); const reps = n(row[repsCol]); item.totalSets += 1; item.totalReps += reps; item.bestSetReps = Math.max(item.bestSetReps, reps); item.heaviestKg = Math.max(item.heaviestKg, weight); item.totalVolumeKg += weight * reps; item.durationSec = n(row[durationCol]) || n(row[workoutDurationCol]) || item.durationSec; map.set(id, item); }
    } else {
      merge("Exercises - Total Sets", "totalSets"); merge("Exercises - Total Reps", "totalReps"); merge("Exercises - Best Set Reps", "bestSetReps"); merge("Exercises - Heaviest Weight", "heaviestKg"); merge("Exercises - Total Volume", "totalVolumeKg"); merge("Exercises - 1-RM", "e1rmKg"); merge("Exercises - Total Duration", "durationSec");
    }
    const records = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (records.length > MAX_RECORDS || new Set(records.map((record) => record.exercise)).size > MAX_UNIQUE_EXERCISES) throw new Error("Export exceeds the supported record or exercise limit.");
    const consistency = calculateConsistencySummary(records.map((record) => ({ date: record.date, totalSets: record.totalSets })));
    const dates = consistency.dates;
    if (Date.parse(`${dates.at(-1)}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`) > MAX_DATE_SPAN_DAYS * DAY) throw new Error("Export exceeds the supported date span.");
    const sessions = dates.map((date) => { const day = records.filter((x) => x.date === date); return { date, source: "MacroFactor", workout: "MacroFactor workout day", durationMin: null, totalSets: day.reduce((s, x) => s + n(x.totalSets), 0), totalReps: day.reduce((s, x) => s + n(x.totalReps), 0) || null, volumeKg: day.reduce((s, x) => s + n(x.totalVolumeKg), 0) || null }; });
    const first = consistency.first, last = consistency.last; const months = consistency.months; const gaps = consistency.gaps;
    const { exercises, achievements } = calculateExerciseSummaries(records);
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
    const muscleDays = muscleRows.flatMap((row) => row.values.map((value) => ({ importId: fileName, source: "macrofactor" as const, date: row.date, rawMuscleName: value.muscle, setEquivalents: value.sets })));
    const { muscleWindows, muscles, muscleHeatmap } = calculateSourceMuscles(muscleDays, first, last);
    const { attendance, longestActiveWeekStreak } = calculateAttendance(records.map((record) => ({ date: record.date, totalSets: record.totalSets, totalVolumeKg: record.totalVolumeKg })));
    const complete = months.filter((x) => x.coverage === "complete"); const payload = { generatedAt: new Date().toISOString(), coverage: { firstDate: first, lastDate: last, journeyDays: Math.round((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY) + 1, totalSessions: sessions.length, averageSessionsPerMonth: r(sessions.length / months.length), averageSessionsPerWeek: r(sessions.length / (((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY + 1) / 7)), exerciseCount: exercises.length, longestActiveWeekStreak: longestActiveWeekStreak }, monthly: months, busiestMonths: [...complete].sort((a, b) => b.sessions - a.sessions).slice(0, 5), quietestMonths: [...complete].sort((a, b) => a.sessions - b.sessions).slice(0, 5), gaps, attendance, exercises, muscleWindows, muscles, muscleHeatmap, achievements, methodology: { strength: "Weighted exercise progress defaults to the heaviest recorded load.", muscles: "Muscle balance uses muscle-group set equivalents. These are exposure signals, not diagnoses.", caveat: "Confirm sudden load changes against the exercise setup." } };
    const importData = createMacroFactorImport(payload, fileName);
    const issues = validateCanonicalExerciseDays(importData.exerciseDays);
    if (issues.length) throw new Error("MacroFactor export contains invalid normalized records.");
    return buildDashboard(importData);
}
