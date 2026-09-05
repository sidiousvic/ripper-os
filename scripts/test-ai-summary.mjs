import assert from "node:assert/strict";
import { buildAiSummary } from "../lib/ai/summary.ts";
const result = buildAiSummary({ coverage: { totalSessions: 2, secret: "x" }, gaps: [], raw: "private" });
assert.deepEqual(result.coverage, { totalSessions: 2 }); assert.equal("raw" in result, false); console.log("AI summary allowlist checks passed.");
