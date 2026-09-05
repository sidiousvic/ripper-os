import { parseImport } from "./import/parse-import.ts";
import { safeParseMessage } from "./training-parser";

self.onmessage = async (event: MessageEvent<{ file: File; options?: import("./import/adapters/strong.ts").StrongNormalizationOptions }>) => {
  try {
    const { file, options } = event.data;
    const data = parseImport(new Uint8Array(await file.arrayBuffer()), file.name, options);
    self.postMessage({ ok: true, data });
  } catch (error) {
    self.postMessage({ ok: false, error: safeParseMessage(error) });
  }
};
