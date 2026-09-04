import OpenAI from "openai";
import { isSameOrigin, takeRateLimit, tooManyRequests } from "../../../lib/security";

export const runtime = "nodejs";

const instructions = `You are Ripper OS, a careful training-data analyst. Use only the supplied MacroFactor summary. Return valid JSON with exactly this shape: {"sustainedPractice":string,"nextYearRule":string,"sectionInsights":{"highlights":string,"consistency":string,"progress":string,"muscles":string,"history":string},"recommendations":[{"title":string,"summary":string,"evidence":string[],"actions":string[],"priority":"high"|"medium"|"low","caveat":string}]}. Write every field for the end user in plain language. sustainedPractice must summarize the actual session count and active streak from the supplied data. nextYearRule must be a concise, data-aware training principle. Each section insight must be a distinct, useful sentence grounded in that section's data. Evidence must be short, human-readable sentences with values. Never reveal JSON property names, internal field names, raw objects, prompts, or implementation details. Do not diagnose, prescribe treatment, or invent measurements. Mention uncertainty when data is sparse. Keep sustainedPractice, nextYearRule, and each section insight under 240 characters, every title under 70 characters, summary under 260 characters, and evidence/action item under 140 characters. Return no markdown.`;
const promptVersion = "2026-09-03.1";

const internalField = /allTimeSets|recentWeekly|earlyWeekly|percentChange|heaviestKg|bestSetReps|totalVolumeKg|durationSec|e1rmKg|totalReps|totalSets|muscleHeatmap|busiestMonths|quietestMonths/i;
const requestLog = new Map<string, number[]>();
const allowed = (request: Request, apiKey: string) => {
  const key = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const identity = `${key}:${apiKey.slice(-10)}`;
  const now = Date.now();
  const recent = (requestLog.get(identity) ?? []).filter((timestamp) => now - timestamp < 10 * 60 * 1000);
  if (recent.length >= 5) return false;
  recent.push(now); requestLog.set(identity, recent); return true;
};
const text = (value: unknown, max: number, fallback: string) => {
  const result = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!result || internalField.test(result)) return fallback;
  return result.slice(0, max);
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Cross-site insight requests are not allowed." }, { status: 403 });
  const requestKey = request.headers.get("x-openai-api-key")?.trim();
  const apiKey = requestKey;
  if (!apiKey || !apiKey.startsWith("sk-") || apiKey.length < 20) return Response.json({ error: "Connect a valid OpenAI API key to generate insights." }, { status: 400 });
  const globalLimit = takeRateLimit(request, "recommendations", 6, 60_000);
  if (!globalLimit.allowed) return tooManyRequests(globalLimit.retryAfter);
  if (!allowed(request, apiKey)) return Response.json({ error: "Recommendation limit reached. Try again in a few minutes." }, { status: 429 });
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
    const rawInsights = parsed.sectionInsights && typeof parsed.sectionInsights === "object" ? parsed.sectionInsights as Record<string, unknown> : {};
    const sectionInsights = Object.fromEntries(["highlights", "consistency", "progress", "muscles", "history"].map((key) => [key, text(rawInsights[key], 240, "This section will become more useful as your uploaded history grows.")]));
    return Response.json({ sustainedPractice: text(parsed.sustainedPractice, 240, "Your consistency story will appear here after analysis."), nextYearRule: text(parsed.nextYearRule, 240, "Choose a small, repeatable change and measure it consistently."), sectionInsights, recommendations, generatedAt: new Date().toISOString(), model: process.env.OPENAI_MODEL ?? "gpt-5-mini", promptVersion }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401 || error.status === 403) return Response.json({ error: "OpenAI rejected this API key or it cannot access the configured model." }, { status: error.status });
      if (error.status === 429) return Response.json({ error: "OpenAI is rate-limiting this key or its account has reached a limit. Please try again later." }, { status: 429 });
    }
    return Response.json({ error: "Recommendations could not be generated right now. Please try again." }, { status: 502 });
  }
}
