import assert from "node:assert/strict";
import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lockfile = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
assert.equal(packageJson.version, lockfile.version, "package and lockfile versions must match");
assert.equal(packageJson.version, lockfile.packages[""].version, "root lock package version must match");
const refName = process.env.GITHUB_REF_NAME ?? "";
if (refName.startsWith("v")) assert.equal(refName, `v${packageJson.version}`, "tag must match package version");
console.log(`Release metadata: v${packageJson.version}`);
