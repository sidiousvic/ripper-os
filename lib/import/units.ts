export function kilograms(value: number, unit: "kg" | "lb"): number {
  if (!Number.isFinite(value) || value < 0 || !["kg", "lb"].includes(unit)) throw new Error("Invalid load or mass unit.");
  const result = unit === "lb" ? value * 0.45359237 : value;
  if (!Number.isFinite(result)) throw new Error("Load conversion overflow.");
  return result;
}
export function meters(value: number, unit: "m" | "km" | "mi"): number {
  if (!Number.isFinite(value) || value < 0 || !["m", "km", "mi"].includes(unit)) throw new Error("Invalid distance or distance unit.");
  const result = value * ({ m: 1, km: 1000, mi: 1609.344 }[unit]);
  if (!Number.isFinite(result)) throw new Error("Distance conversion overflow.");
  return result;
}
