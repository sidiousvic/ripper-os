import * as XLSX from "xlsx";
import { MAX_IMPORT_BYTES } from "../import-limits.mjs";
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

export function inspectInput(fileBytes: Uint8Array, fileName: string) {
  if (!/\.(xlsx|csv)$/i.test(fileName)) throw new Error("Choose a MacroFactor .xlsx or .csv export.");
  if (fileBytes.byteLength > MAX_IMPORT_BYTES) throw new Error("The export is larger than the 25 MB import limit.");
  const xlsx = fileName.toLowerCase().endsWith(".xlsx");
  if (xlsx && !hasSafeZipDirectory(fileBytes)) throw new Error("Invalid workbook archive.");
  if (!xlsx && (fileBytes.includes(0) || !new TextDecoder("utf-8", { fatal: true }).decode(fileBytes).trim())) throw new Error("Invalid CSV file.");
  const workbook = XLSX.read(fileBytes, { type: "array", cellDates: false, raw: !xlsx });
  if (!workbook.SheetNames.length || workbook.SheetNames.length > 60) throw new Error("Unsupported workbook structure.");
  for (const name of workbook.SheetNames) {
    const ref = workbook.Sheets[name]?.["!ref"];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    if (range.e.r > 100_000 || range.e.c > 500) throw new Error("Workbook is too large to process safely.");
  }
  return workbook;
}
