import type { DetailedImport } from "../domain/strength.ts";
import type { AggregateImport } from "../import/types.ts";
import { reconcileImports, type HistoryImport, type ReconcileResult } from "./reconcile-imports.ts";

export type { HistoryImport, ImportConflict } from "./reconcile-imports.ts";
export type CombineResult = ReconcileResult;

export function hasImportedContentHash(existing: HistoryImport[], contentHash?: string) {
  return Boolean(contentHash && existing.some((input) => input.contentHash === contentHash));
}

/** Reconcile only proven same-source identities; conflicts never mutate inputs. */
export function combineImports(existing: HistoryImport[], addition: AggregateImport | DetailedImport): CombineResult {
  return reconcileImports(existing, addition);
}
