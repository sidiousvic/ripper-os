import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Evaluated by both build configs, never shipped as runtime Node code.
export function getBuildInfo() {
  const hash = createHash("sha256");
  function add(path: string) {
    hash.update(path).update("\0").update(readFileSync(path)).update("\0");
  }
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) add(path);
    }
  }
  for (const directory of ["app", "lib", "public", "scripts"]) walk(directory);
  for (const file of ["package.json", "package-lock.json", "next.config.ts", "vite.config.ts", "tsconfig.json", "vercel.json"]) add(file);
  const version = JSON.parse(readFileSync("package.json", "utf8")).version as string;
  let commit = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
  if (commit === "unknown") {
    try { commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
    catch { /* Source archives may not include Git metadata. */ }
  }
  return { version, source: hash.digest("hex").slice(0, 10), commit };
}
