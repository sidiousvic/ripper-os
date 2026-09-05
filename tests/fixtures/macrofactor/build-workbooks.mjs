import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const fixtureRoot = new URL("./", import.meta.url);
const minimalSheets = new Set([
  "Exercises - Total Sets",
  "Exercises - Total Reps",
  "Exercises - Heaviest Weight",
]);

/** Build only synthetic test workbooks; never reads a personal export. */
export function buildWorkbookFixtures() {
  const matrix = JSON.parse(readFileSync(new URL("workbook-matrix.json", fixtureRoot), "utf8"));
  return new Map([false, true].map((minimal) => {
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: "Synthetic MacroFactor regression fixture",
      Author: "Ripper OS test fixtures",
      CreatedDate: new Date("2026-01-01T00:00:00Z"),
      ModifiedDate: new Date("2026-01-01T00:00:00Z"),
    };
    for (const [name, rows] of Object.entries(matrix)) {
      if (minimal && !minimalSheets.has(name)) continue;
      const cells = rows.map((row, index) => index === 0 ? row : [
        new Date(`${row[0]}T00:00:00Z`), ...row.slice(1),
      ]);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(cells, { UTC: true }), name);
    }
    return [minimal ? "optional-sheets-omitted.xlsx" : "six-months.xlsx", XLSX.write(workbook, {
      type: "buffer", bookType: "xlsx", compression: true,
    })];
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [name, bytes] of buildWorkbookFixtures()) {
    writeFileSync(new URL(name, fixtureRoot), bytes);
    console.log(`Generated ${name} (${bytes.length} bytes)`);
  }
}
