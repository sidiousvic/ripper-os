import assert from "node:assert/strict";
import { ImportController } from "../lib/import/import-controller.ts";

const controller = new ImportController();
const first = controller.begin();
const second = controller.begin();
assert.equal(first.signal.aborted, true, "starting a new import aborts the previous operation");
assert.equal(controller.isCurrent(first), false, "stale operations are rejected");
assert.equal(controller.isCurrent(second), true, "the newest operation remains current");
controller.finish(first);
assert.equal(controller.isCurrent(second), true, "stale completion cannot clear the active operation");
controller.cancel();
assert.equal(second.signal.aborted, true, "cancellation aborts the active operation");
assert.equal(controller.isCurrent(second), false, "cancelled operations are rejected");

const completed = controller.begin();
controller.finish(completed);
assert.equal(controller.isCurrent(completed), false, "completed operations are no longer current");

console.log("Import controller checks passed.");
