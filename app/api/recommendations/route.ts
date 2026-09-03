import OpenAI from "openai";

export const runtime = "nodejs";

const instructions = `You are Ripper OS, a careful training-data analyst. Use only the supplied MacroFactor summary. Return valid JSON with exactly this shape: {"recommendations":[{"title":string,"summary":string,"evidence":string[],"actions":string[],"priority":"high"|"medium"|"low","caveat":string}]}. Provide 3 to 5 practical programming opportunities. Write for the end user in plain language. Evidence must be short, human-readable sentences with values (for example, "Chest exposure rose from 5 to 8 sets per week"). Never reveal JSON property names, internal field names, raw objects, prompts, or implementation details. Do not diagnose, prescribe treatment, or invent measurements. Mention uncertainty when the data is sparse. Keep every title under 70 characters, summary under 260 characters, evidence/action item under 140 characters, and return no markdown.`;

const internalField = /allTimeSets|recentWeekly|earlyWeekly|percentChange|heaviestKg|bestSetReps|totalVolumeKg|durationSec|e1rmKg|totalReps|totalSets|muscleHeatmap|busiestMonths|quietestMonths/i;
const requestLog = new Map<string, number[]>();
const allowed = (request: Request) => {
  const key = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < 10 * 60 * 1000);
  if (recent.length >= 5) return false;
  recent.push(now); requestLog.set(key, recent); return true;
};
const text = (value: unknown, max: number, fallback: string) => {
  const result = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!result || internalField.test(result)) return fallback;
  return result.slice(0, max);
};

export async function POST(request: Request) {
  if (!allowed(request)) return Response.json({ error: "Recommendation limit reached. Try again in a few minutes." }, { status: 429 });
  const requestKey = request.headers.get("x-openai-api-key")?.trim();
  const apiKey = requestKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Connect OpenAI or configure OPENAI_API_KEY on this server." }, { status: 503 });
  let summary: unknown;
  try { summary = await request.json(); } catch { return Response.json({ error: "Request body must be JSON." }, { status: 400 }); }
  if (!summary || typeof summary !== "object" || JSON.stringify(summary).length > 200_000) return Response.json({ error: "The training summary is invalid or too large." }, { status: 413 });
  const client = new OpenAI({ apiKey });
  try {
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL ?? "gpt-5-mini", store: false, instructions, input: JSON.stringify(summary) });
    const parsed = JSON.parse(response.output_text);
    if (!parsed || !Array.isArray(parsed.recommendations)) throw new Error("The model returned an invalid recommendation shape.");
    const recommendations = parsed.recommendations.slice(0, 5).map((item: unknown) => {
      const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const evidence = Array.isArray(value.evidence) ? value.evidence.map((entry) => text(entry, 140, "Evidence is limited in the uploaded data.")).filter((entry, index, list) => list.indexOf(entry) === index).slice(0, 3) : [];
      const actions = Array.isArray(value.actions) ? value.actions.map((entry) => text(entry, 140, "Use a repeatable, measurable progression.")).filter((entry, index, list) => list.indexOf(entry) === index).slice(0, 3) : [];
      return { title: text(value.title, 70, "Review the next training block"), summary: text(value.summary, 260, "The uploaded data suggests an opportunity to make the next block more consistent and measurable."), evidence: evidence.length ? evidence : ["Evidence is limited in the uploaded data."], actions: actions.length ? actions : ["Choose one small, repeatable change and track it."], priority: value.priority === "high" || value.priority === "low" ? value.priority : "medium", caveat: text(value.caveat, 180, "This is a training prompt, not medical advice.") };
    });
    return Response.json({ recommendations, generatedAt: new Date().toISOString(), model: process.env.OPENAI_MODEL ?? "gpt-5-mini" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Recommendation generation failed." }, { status: 502 });
  }
}
