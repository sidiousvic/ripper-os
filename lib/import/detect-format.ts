import * as XLSX from "xlsx";
import type { InspectedInput } from "./inspect-input.ts";

type Source = "macrofactor" | "strong";
export type DetectionResult = { format: Source | "unknown" } | { format: "ambiguous"; candidates: Source[] };
const normalized = (value: unknown) => String(value ?? "").replace(/^\uFEFF/, "").trim().toLowerCase();
export function detectFormat(input: InspectedInput): DetectionResult {
  const candidates: Source[] = [];
  if (input.inputKind === "xlsx") {
    if (input.SheetNames.includes("Exercises - Total Sets") && input.SheetNames.some(name => ["Exercises - Total Reps", "Exercises - Heaviest Weight"].includes(name))) candidates.push("macrofactor");
  } else {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(input.Sheets[input.SheetNames[0]], { header: 1, raw: true });
    const headers = new Set((rows[0] ?? []).map(normalized));
    const has = (names: string[]) => names.every(name => headers.has(name));
    if (has(["date", "exercise", "reps"])) candidates.push("macrofactor");
    if (has(["date", "workout name", "duration", "exercise name", "set order", "weight", "reps"])) candidates.push("strong");
  }
  return candidates.length > 1 ? { format: "ambiguous", candidates } : { format: candidates[0] ?? "unknown" };
}
