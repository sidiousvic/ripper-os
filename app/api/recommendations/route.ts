import OpenAI from "openai";

export const runtime = "nodejs";

const instructions = `You are Ripper OS, a careful training-data analyst. Use only the supplied MacroFactor summary. Return valid JSON with exactly this shape: {"recommendations":[{"title":string,"summary":string,"evidence":string[],"actions":string[],"priority":"high"|"medium"|"low","caveat":string}]}. Provide 3 to 5 practical programming opportunities. Every evidence item must quote a supplied metric or explicitly say that evidence is unavailable. Do not diagnose, prescribe treatment, or invent measurements. Mention uncertainty when the data is sparse. Keep recommendations concise.`;

export async function POST(request: Request) {
  const requestKey = request.headers.get("x-openai-api-key")?.trim();
  const apiKey = requestKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Connect OpenAI or configure OPENAI_API_KEY on this server." }, { status: 503 });
  let summary: unknown;
  try { summary = await request.json(); } catch { return Response.json({ error: "Request body must be JSON." }, { status: 400 }); }
  const client = new OpenAI({ apiKey });
  try {
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL ?? "gpt-5-mini", store: false, instructions, input: JSON.stringify(summary) });
    const parsed = JSON.parse(response.output_text);
    if (!parsed || !Array.isArray(parsed.recommendations)) throw new Error("The model returned an invalid recommendation shape.");
    return Response.json({ ...parsed, generatedAt: new Date().toISOString(), model: process.env.OPENAI_MODEL ?? "gpt-5-mini" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Recommendation generation failed." }, { status: 502 });
  }
}
