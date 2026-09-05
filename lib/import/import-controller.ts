export type ImportOperation = { id: number; signal: AbortSignal };

/** Owns one cancellable import at a time and rejects late results by identity. */
export class ImportController {
  private sequence = 0;
  private active: { id: number; controller: AbortController } | null = null;

  begin(): ImportOperation {
    this.active?.controller.abort();
    const operation = { id: ++this.sequence, controller: new AbortController() };
    this.active = operation;
    return { id: operation.id, signal: operation.controller.signal };
  }

  isCurrent(operation: ImportOperation) {
    return this.active?.id === operation.id && !operation.signal.aborted;
  }

  finish(operation: ImportOperation) {
    if (this.active?.id === operation.id) this.active = null;
  }

  cancel() {
    this.active?.controller.abort();
    this.active = null;
  }
}
