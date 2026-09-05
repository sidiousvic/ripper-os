export function createTrainingWorker() {
  return new Worker(new URL("./training-parser.worker.ts", import.meta.url), { type: "module" });
}
