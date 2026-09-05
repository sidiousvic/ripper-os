import { isCalendarDate } from "./validation.ts";

export const isBlank = (value: unknown) => value === null || value === undefined || typeof value === "string" && !value.trim();
export function nonNegativeNumber(value: unknown): number | null {
  if (isBlank(value)) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
export function strongTimestamp(value: unknown): { date: string; localTimestamp: string } | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match || !isCalendarDate(match[1]) || +match[2] > 23 || +match[3] > 59 || +match[4] > 59) return null;
  return { date: match[1], localTimestamp: value.trim() };
}
/** Strong workout duration grammar observed in the approved export: 2h, 45m, 1h 20m. */
export function strongDuration(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(?:(\d+)h)?(?: ?(\d+)m)?$/.exec(value.trim());
  if (!match || !match[1] && !match[2]) return null;
  const seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60;
  return Number.isFinite(seconds) ? seconds : null;
}
