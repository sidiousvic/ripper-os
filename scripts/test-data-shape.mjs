import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../app/training-data.json", import.meta.url)));
for (const key of ["coverage", "monthly", "gaps", "attendance", "exercises", "muscles", "achievements"]) assert.ok(key in data, `missing ${key}`);
assert.equal(typeof data.coverage.totalSessions, "number");
assert.ok(Array.isArray(data.exercises));
console.log("training-data shape: ok");
