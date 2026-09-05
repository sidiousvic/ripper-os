/// <reference types="vite/client" />
import TrainingWorker from "./training-parser.worker?worker";

// Vinext rewrites import.meta.url to file:// even in client modules. Vite's
// worker import emits a served URL without depending on import.meta.url.
export function createTrainingWorker() {
  return new TrainingWorker();
}
