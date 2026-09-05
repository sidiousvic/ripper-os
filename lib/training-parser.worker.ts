import { parseImport } from "./import/parse-import.ts";
import { safeParseMessage } from "./training-parser";
import { sha256Bytes } from "./import/file-identity";

self.onmessage = async (event: MessageEvent<{ file: File; options?: import("./import/adapters/strong.ts").StrongNormalizationOptions }>) => {
  try {
    const { file, options } = event.data;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentHash = await sha256Bytes(bytes);
    const parsed = parseImport(bytes, file.name, options);
    const data = parsed.status === "ready" ? { ...parsed, importData: { ...parsed.importData, contentHash } } : parsed;
    self.postMessage({ ok: true, data });
  } catch (error) {
    self.postMessage({ ok: false, error: safeParseMessage(error) });
  }
};
