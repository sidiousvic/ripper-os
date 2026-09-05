import type { StrongNormalizationOptions } from "./import/adapters/strong";
import type { ImportOutcome } from "./import/parse-import";
import { createTrainingWorker } from "./create-training-worker";
import { MAX_IMPORT_BYTES } from "./import-limits.mjs";

type WorkerRequest = { file: File; options?: StrongNormalizationOptions };
type ImportResult = { ok: true; data: ImportOutcome } | { ok: false; error: string };

// The File is cloned to a local worker, never uploaded. Terminating the worker
// cancels synchronous parsing as well as releasing its workbook memory.
export function importTrainingFile(file: File, signal: AbortSignal, options?: StrongNormalizationOptions): Promise<ImportOutcome> {
  if (signal.aborted) return Promise.reject(new DOMException("Import cancelled", "AbortError"));
  if (!/\.(xlsx|csv)$/i.test(file.name)) return Promise.reject(new Error("Choose a MacroFactor .xlsx or .csv export."));
  if (file.size > MAX_IMPORT_BYTES) return Promise.reject(new Error("The export is larger than the 25 MB import limit."));

  return new Promise((resolve, reject) => {
    const worker = createTrainingWorker();
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => { finish(); reject(new DOMException("Import cancelled", "AbortError")); };
    const timeout = setTimeout(() => {
      finish();
      reject(new Error("This export took too long to process on this device. Try a smaller export."));
    }, 30_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<ImportResult>) => {
      finish();
      if (event.data.ok) resolve(event.data.data);
      else reject(new Error(event.data.error));
    };
    worker.onerror = () => {
      finish();
      reject(new Error("This browser could not process the export. Try again or use another browser."));
    };
    try { worker.postMessage({ file, options } satisfies WorkerRequest); }
    catch (error) { finish(); reject(error); }
  });
}
