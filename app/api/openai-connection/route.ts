import OpenAI from "openai";

export const runtime = "nodejs";

// This checks the exact model used for insights without making a generation
// request. It authenticates the supplied key but does not store or return it.
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-openai-api-key")?.trim();
  if (!apiKey) return Response.json({ error: "Enter an OpenAI API key first." }, { status: 400 });

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
    await client.models.retrieve(model);
    return Response.json({ ok: true });
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? error.status : 502;
    if (status === 401 || status === 403) return Response.json({ error: "This API key could not be authenticated or does not have access to the insights model." }, { status });
    if (status === 404) return Response.json({ error: "This API key cannot access the model configured for Ripper OS insights." }, { status });
    return Response.json({ error: "OpenAI could not verify this connection right now. Check the key and try again." }, { status: status && status < 500 ? status : 502 });
  }
}
