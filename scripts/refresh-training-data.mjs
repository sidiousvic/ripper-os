import fs from "node:fs/promises";
import path from "node:path";
import { parseImport } from "../lib/import/parse-import.ts";

const [inputPath, outputPath] = process.argv.slice(2).filter((value) => value !== "--");
if (!inputPath || !outputPath) {
  throw new Error("Usage: npm run refresh:data -- <training-export.xlsx|csv> <output.json>");
}

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const resolvedOutput = path.resolve(outputPath);
if (resolvedOutput === path.join(repositoryRoot, "app", "training-data.json")) {
  throw new Error("Do not write personal training history into app/training-data.json. Choose a temporary local output path.");
}

const bytes = new Uint8Array(await fs.readFile(inputPath));
const result = parseImport(bytes, path.basename(inputPath));
if (result.status === "needs-input") {
  throw new Error(`This export needs import choices before it can be refreshed: ${result.needs.join(", ")}. Use the browser import flow first.`);
}

await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
await fs.writeFile(resolvedOutput, JSON.stringify(result.dashboard, null, 2));
console.log(JSON.stringify({
  outputPath: resolvedOutput,
  source: result.source,
  firstDate: result.dashboard.coverage.firstDate,
  lastDate: result.dashboard.coverage.lastDate,
  trainingDays: result.dashboard.coverage.totalSessions,
  exercises: result.dashboard.coverage.exerciseCount,
}, null, 2));
