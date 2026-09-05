import { parseTrainingFile, safeParseMessage } from "./training-parser";

self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const file = event.data;
    const data = parseTrainingFile(new Uint8Array(await file.arrayBuffer()), file.name);
    self.postMessage({ ok: true, data });
  } catch (error) {
    self.postMessage({ ok: false, error: safeParseMessage(error) });
  }
};
