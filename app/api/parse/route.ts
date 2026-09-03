import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Upload a MacroFactor .xlsx file." }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xlsx")) return Response.json({ error: "Only .xlsx MacroFactor exports are supported." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ error: "The workbook is larger than the 25 MB upload limit." }, { status: 413 });

  const dir = await mkdir(path.join(os.tmpdir(), "ripper-os"), { recursive: true }).then(() => path.join(os.tmpdir(), "ripper-os"));
  const id = randomUUID();
  const inputPath = path.join(dir, `${id}.xlsx`);
  const outputPath = path.join(dir, `${id}.json`);
  try {
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await run(process.execPath, [path.join(process.cwd(), "scripts/refresh-training-data.mjs"), inputPath, outputPath], { timeout: 30_000 });
    return new Response(await readFile(outputPath), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse the workbook.";
    return Response.json({ error: message.replaceAll(inputPath, "uploaded file") }, { status: 422 });
  } finally {
    await Promise.all([rm(inputPath, { force: true }), rm(outputPath, { force: true })]);
  }
}
