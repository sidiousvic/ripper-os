"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Check,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Layers3,
  KeyRound,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import demoData from "./training-data.json";

type MetricKey = "heaviestKg" | "e1rmKg" | "bestSetReps" | "totalVolumeKg" | "totalReps" | "totalSets" | "durationSec";
type ProgressRecord = {
  date: string;
  heaviestKg: number | null;
  e1rmKg: number | null;
  bestSetReps: number | null;
  totalVolumeKg: number | null;
  totalReps: number | null;
  totalSets: number | null;
  durationSec: number | null;
};
type Exercise = {
  name: string;
  family: string;
  defaultMetric: MetricKey;
  availableMetrics: MetricKey[];
  firstDate: string;
  lastDate: string;
  sessions: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  progress: ProgressRecord[];
};
type Recommendation = { title: string; summary: string; evidence: string[]; actions: string[]; priority: "high" | "medium" | "low"; caveat: string };
type AiInsight = { sustainedPractice: string; nextYearRule: string; sectionInsights: Record<string, string> };
type UploadPayload = typeof demoData & { error?: string; recommendations?: Recommendation[]; sustainedPractice?: string; nextYearRule?: string; sectionInsights?: Record<string, string> };

let data = demoData;
let exercises = data.exercises as Exercise[];
const emptyExercise: Exercise = { name: "No exercise selected", family: "—", defaultMetric: "totalSets", availableMetrics: ["totalSets"], firstDate: "1970-01-01", lastDate: "1970-01-01", sessions: 0, totalSets: 0, totalReps: 0, totalVolumeKg: 0, progress: [] };
const sessionDataKey = "ripper-os-training-data-v3";
const metricMeta: Record<MetricKey, { label: string; short: string; unit: string }> = {
  heaviestKg: { label: "Heaviest load", short: "Load", unit: "kg" },
  e1rmKg: { label: "Estimated 1RM", short: "e1RM", unit: "kg" },
  bestSetReps: { label: "Best-set reps", short: "Best reps", unit: "reps" },
  totalVolumeKg: { label: "Session volume", short: "Volume", unit: "kg" },
  totalReps: { label: "Session reps", short: "Reps", unit: "reps" },
  totalSets: { label: "Working sets", short: "Sets", unit: "sets" },
  durationSec: { label: "Session duration", short: "Duration", unit: "sec" },
};

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en", options ?? { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
const formatMonth = (value: string) => formatDate(`${value}-01`, { month: "short", year: "2-digit" });
const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
const metricValue = (record: ProgressRecord, metric: MetricKey) => Number(record[metric] ?? 0);
const metricSeries = (exercise: Exercise, metric: MetricKey) => exercise.progress
  .filter((record) => metricValue(record, metric) > 0)
  .map((record) => ({ ...record, value: metricValue(record, metric) }));

// Make the first movement feel like a meaningful headline, not merely the first
// alphabetical or most-frequent record. A stable, well-practised lift with the
// clearest change in its primary metric wins; frequency only breaks close ties.
const featuredExercise = (items: Exercise[]) => items
  .map((exercise) => {
    const series = metricSeries(exercise, exercise.defaultMetric);
    if (series.length < 3 || exercise.sessions < 3) return { exercise, score: -1 };
    const values = series.map((point) => point.value);
    const first = values[0];
    const latest = values.at(-1) ?? first;
    const range = Math.max(...values) - Math.min(...values);
    const scale = Math.max(Math.abs(first), 1);
    const growth = Math.max(0, (latest - first) / scale);
    const variation = range / scale;
    return { exercise, score: Math.min(growth, 3) * 3 + Math.min(variation, 3) + Math.min(exercise.sessions, 20) / 100 };
  })
  .sort((a, b) => b.score - a.score || b.exercise.sessions - a.exercise.sessions)[0]?.exercise ?? items[0];

function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span className={positive ? "delta positive" : "delta negative"}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value).toFixed(0)}{suffix}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="sparkline-empty">Not enough history yet</div>;
  const width = 220;
  const height = 54;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - 5 - ((value - min) / spread) * (height - 10);
    return `${x},${y}`;
  }).join(" ");
  const [lastX, lastY] = points.split(" ").at(-1)?.split(",") ?? [0, 0];
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Exercise progression sparkline">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill="currentColor" />
    </svg>
  );
}

function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <article className="stat-card panel">
      <div className="icon-box">{icon}</div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="stat-value">{value}</p>
        <p className="muted small">{note}</p>
      </div>
    </article>
  );
}

function SectionHeading({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow accent">{kicker}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function SectionInsight({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="callout ai-insight section-insight"><Sparkles size={17} /><p><strong>AI insight</strong> {text}</p></div>;
}

function ChartTooltip({ active, payload, label, unit = "", comparisonUnit = "" }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>; label?: string; unit?: string; comparisonUnit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p>{label?.length === 7 ? formatMonth(label) : label ? formatDate(label) : ""}</p>
      {payload.filter((item) => item.value != null).map((item) => (
        <div key={`${item.name}-${item.dataKey}`} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: item.color }} />
          <span>{item.name}</span>
        <strong>{formatNumber(Number(item.value))}{(item.dataKey === "comparisonValue" ? comparisonUnit : unit) ? ` ${item.dataKey === "comparisonValue" ? comparisonUnit : unit}` : ""}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [dataVersion, redraw] = useState(0);
  const [uploadState, setUploadState] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [recommendationState, setRecommendationState] = useState<string>("");
  const [openAIKey, setOpenAIKey] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [connectionState, setConnectionState] = useState("");
  const [aiConsentOpen, setAiConsentOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [loadedExportOpen, setLoadedExportOpen] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [lastExportName, setLastExportName] = useState("");
  const [lastExportAt, setLastExportAt] = useState("");
  const [selectedExerciseName, setSelectedExerciseName] = useState(() => featuredExercise(exercises)?.name ?? "");
  const selectedExercise = exercises.find((exercise) => exercise.name === selectedExerciseName) ?? featuredExercise(exercises) ?? emptyExercise;
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(selectedExercise.defaultMetric);
  const [comparisonMetric, setComparisonMetric] = useState<MetricKey | "">("");
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("All");
  const [exerciseSort, setExerciseSort] = useState<"recent" | "used">("recent");
  const [visibleCount, setVisibleCount] = useState(24);
  const [attendanceYear, setAttendanceYear] = useState(Number(data.coverage.lastDate.slice(0, 4)));
  const hasUploadedData = data !== demoData;

  // Restore only the normalized dashboard snapshot; raw workbook data and API keys are never stored.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      localStorage.removeItem("ripper-os-training-data");
      const saved = localStorage.getItem(sessionDataKey);
      if (!saved) return;
      const snapshot = JSON.parse(saved);
      data = snapshot.data;
      exercises = data.exercises as Exercise[];
      setLastExportName(snapshot.fileName ?? ""); setLastExportAt(snapshot.uploadedAt ?? "");
      setRecommendations(snapshot.recommendations ?? []); setAiInsight(snapshot.aiInsight ?? null);
      const featured = featuredExercise(exercises);
      setSelectedExerciseName(featured?.name ?? "");
      setSelectedMetric(featured?.defaultMetric ?? "totalSets");
      setAttendanceYear(Number(data.coverage.lastDate.slice(0, 4)));
      redraw((value) => value + 1);
    } catch { localStorage.removeItem(sessionDataKey); }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadState("Parsing MacroFactor export…");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/parse", { method: "POST", body: form });
      const payload = await response.json() as unknown as UploadPayload;
      if (!response.ok) throw new Error(payload.error ?? "Could not parse the workbook.");
      data = payload;
      exercises = data.exercises as Exercise[];
      const uploadedAt = new Date().toISOString();
      const snapshot = { data: payload, fileName: file.name, uploadedAt, recommendations: [], aiInsight: null };
      const serialized = JSON.stringify(snapshot);
      if (serialized.length <= 4_000_000) localStorage.setItem(sessionDataKey, serialized);
      else setUploadState(`Loaded ${file.name}; this rendered snapshot is too large for browser storage.`);
      setLastExportName(file.name); setLastExportAt(uploadedAt);
      const featured = featuredExercise(exercises);
      setSelectedExerciseName(featured?.name ?? "");
      setSelectedMetric(featured?.defaultMetric ?? "totalSets");
      setAttendanceYear(Number(data.coverage.lastDate.slice(0, 4)));
      setUploadState("");
      setRecommendations([]);
      setAiInsight(null);
      setRecommendationError("");
      redraw((value) => value + 1);
    } catch (error) {
      setUploadState(error instanceof Error ? error.message : "Could not parse the workbook.");
    } finally {
      event.target.value = "";
    }
  };

  const clearUploadedData = () => {
    localStorage.removeItem(sessionDataKey);
    data = demoData;
    exercises = data.exercises as Exercise[];
    setRecommendations([]);
    setAiInsight(null);
    setRecommendationError("");
    setLastExportName(""); setLastExportAt("");
    setUploadState("");
    setRecommendationState("");
    setSelectedExerciseName("");
    setSelectedMetric("totalSets");
    setAttendanceYear(Number(data.coverage.lastDate.slice(0, 4)));
    redraw((value) => value + 1);
  };

  const generateRecommendations = async () => {
    if (recommendationState.startsWith("Generating")) return;
    setAiConsentOpen(true);
  };

  const verifyOpenAIConnection = async () => {
    const apiKey = keyDraft.trim();
    if (!apiKey) { setConnectionState("Enter an API key to continue."); return; }
    setConnectionState("Verifying OpenAI connection…");
    try {
      const response = await fetch("/api/openai-connection", { method: "POST", headers: { "x-openai-api-key": apiKey } });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "OpenAI could not verify this connection.");
      setOpenAIKey(apiKey);
      setKeyDraft("");
      setConnectionState("");
      setConnectOpen(false);
    } catch (error) {
      setConnectionState(error instanceof Error ? error.message : "OpenAI could not verify this connection.");
    }
  };

  const requestRecommendations = async () => {
    setAiConsentOpen(false);
    setRecommendationError("");
    setRecommendationState("Generating recommendations…");
    try {
      const summary = { coverage: data.coverage, muscles: data.muscles, gaps: data.gaps, achievements: data.achievements, busiestMonths: data.busiestMonths, quietestMonths: data.quietestMonths };
      const headers: HeadersInit = { "content-type": "application/json" };
      if (openAIKey) headers["x-openai-api-key"] = openAIKey;
      const response = await fetch("/api/recommendations", { method: "POST", headers, body: JSON.stringify(summary) });
      const payload = await response.json() as unknown as UploadPayload;
      if (!response.ok) throw new Error(payload.error ?? "Recommendation generation failed.");
      setRecommendations(payload.recommendations ?? []);
      setAiInsight({ sustainedPractice: payload.sustainedPractice ?? "", nextYearRule: payload.nextYearRule ?? "", sectionInsights: payload.sectionInsights ?? {} });
      const saved = localStorage.getItem(sessionDataKey);
      if (saved) localStorage.setItem(sessionDataKey, JSON.stringify({ ...JSON.parse(saved), recommendations: payload.recommendations ?? [], aiInsight: { sustainedPractice: payload.sustainedPractice ?? "", nextYearRule: payload.nextYearRule ?? "", sectionInsights: payload.sectionInsights ?? {} } }));
      setRecommendationState("Recommendations updated from this dataset.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Recommendation generation failed.";
      setRecommendationState("");
      setRecommendationError(/^Recommendation limit reached|^Too many requests/i.test(message)
        ? "Ripper OS is temporarily rate-limiting requests to protect your connected API key. Please wait a few minutes, then try again."
        : /OpenAI is rate-limiting|account has reached a limit/i.test(message)
          ? "OpenAI returned a usage or rate limit for this key. This is separate from Ripper OS; check the key’s OpenAI project limits, billing, and regional network access."
          : "Recommendations could not be generated right now. Check your OpenAI connection and try again.");
    }
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExerciseName(exercise.name);
    setSelectedMetric(exercise.defaultMetric);
    setComparisonMetric("");
    document.getElementById("exercise-focus")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const families = useMemo(() => ["All", ...Array.from(new Set(exercises.map((exercise) => exercise.family))).sort()], [dataVersion]);
  const filteredExercises = useMemo(() => exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (family === "All" || exercise.family === family);
  }).sort((a, b) => exerciseSort === "recent" ? b.lastDate.localeCompare(a.lastDate) || b.sessions - a.sessions : b.totalSets - a.totalSets || b.sessions - a.sessions), [search, family, exerciseSort, dataVersion]);

  const selectedSeries = metricSeries(selectedExercise, selectedMetric);
  const latestWindowStart = new Date(new Date(`${data.coverage.lastDate}T00:00:00Z`).valueOf() - (27 * 86_400_000)).toISOString().slice(0, 10);
  const recentFirstIndex = selectedSeries.findIndex((record) => record.date >= latestWindowStart);
  const recentStartPercent = recentFirstIndex < 0 ? 100 : (recentFirstIndex / Math.max(selectedSeries.length - 1, 1)) * 100;
  const recentFadeStart = Math.max(0, recentStartPercent - 5);
  const recentFadeEnd = Math.min(100, recentStartPercent + 5);
  const comparisonMeta = comparisonMetric ? metricMeta[comparisonMetric] : null;
  const comparisonSeries = comparisonMetric ? metricSeries(selectedExercise, comparisonMetric) : [];
  const comparisonByDate = new Map(comparisonSeries.map((record) => [record.date, record.value]));
  const selectedChartData = selectedSeries.map((record) => ({ ...record, primaryValue: record.value, comparisonValue: comparisonByDate.get(record.date) ?? null }));
  const selectedFirst = selectedSeries[0]?.value ?? 0;
  const selectedLatest = selectedSeries.at(-1)?.value ?? 0;
  const selectedPeak = Math.max(...selectedSeries.map((record) => record.value), 0);
  const selectedChange = selectedFirst ? ((selectedLatest / selectedFirst) - 1) * 100 : 0;
  const selectedMeta = metricMeta[selectedMetric];

  const monthlyChart = data.monthly.map((item) => ({ ...item, label: formatMonth(item.month) }));
  const maxRecentMuscle = Math.max(...data.muscles.flatMap((muscle) => [muscle.earlyWeekly, muscle.recentWeekly]), 1);
  const firstAttendanceYear = Number(data.coverage.firstDate.slice(0, 4));
  const lastAttendanceYear = Number(data.coverage.lastDate.slice(0, 4));
  const attendanceYears = Array.from({ length: lastAttendanceYear - firstAttendanceYear + 1 }, (_, index) => firstAttendanceYear + index);
  const attendanceYearIndex = attendanceYears.indexOf(attendanceYear);
  const attendanceWeeks = data.attendance.map((week) => ({
    ...week,
    days: week.days.map((active, index) => {
      const date = new Date(new Date(`${week.week}T00:00:00Z`).valueOf() + index * 86_400_000).toISOString().slice(0, 10);
      return { active, date, inYear: date.startsWith(String(attendanceYear)) };
    }),
  })).filter((week) => week.days.some((day) => day.inYear));

  return (
    <main className={data.coverage.totalSessions > 0 ? "" : "empty-dashboard"}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Ripper OS home">
          <span className="brand-mark"><Image src="/brand/ripper-os-logo.png" alt="" width={38} height={38} priority /></span>
          <span>Ripper OS</span>
        </a>
        <nav aria-label="Dashboard sections">
          <a href="#progress">Progress</a>
          <a href="#consistency">Consistency</a>
          {data.muscles.length > 0 && <a href="#muscles">Muscles</a>}
          <a href="#next">Insights</a>
          <a href="/about">About</a>
        </nav>
        <a className="data-pill donate-button" href="https://donate.stripe.com/bJe8wQ18J4so1wSdrKfjG00" target="_blank" rel="noreferrer">Donate</a>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <h1><b style={{marginBottom: "30px", fontFamily: "BiauKaiHK"}}>RIPPER <span>OS</span></b>.<br /><span className="hero-training">Training, <span>Analyzed.</span></span></h1>
          <p>Upload your training data and Ripper OS organizes it into progress, consistency, muscle balance, highlights, and next opportunities. It&apos;s like Spotify Wrapped for training.</p>
          <div className="hero-actions" aria-label="Dashboard actions">
            {hasUploadedData ? <button className="button upload-button is-ready" onClick={() => setLoadedExportOpen(true)}><Check size={17} aria-hidden="true" />MacroFactor export uploaded</button> : <label className="button upload-button"><CircleDot size={17} aria-hidden="true" />Upload MacroFactor export<input type="file" accept=".xlsx,.csv" onChange={handleUpload} /></label>}
            <button className={`button upload-button ${openAIKey ? "is-ready" : ""}`} onClick={() => { setKeyDraft(openAIKey); setConnectionState(""); setConnectOpen(true); }}><KeyRound size={17} aria-hidden="true" />{openAIKey ? "OpenAI connected" : "Connect OpenAI"}</button>
            {hasUploadedData && <button className="button upload-button" onClick={() => setClearConfirmOpen(true)}><Trash2 size={17} aria-hidden="true" />Clear uploaded data</button>}
            {hasUploadedData && <a className="button primary" href="#progress">Explore all exercises <ChevronRight size={17} /></a>}
            {hasUploadedData && <button className="button ai-action" onClick={generateRecommendations} disabled={recommendationState.startsWith("Generating")}><Sparkles size={16} /> Generate AI insights</button>}
          </div>
          <p className="export-guide-link"><a href="/about">How to export my MacroFactor data</a></p>
          {uploadState && <p className="upload-status" role="status">{uploadState}</p>}
        </div>
      </section>

      <section className="stats shell data-dependent" aria-label="Key training statistics">
        <StatCard icon={<CalendarDays size={20} />} label="Average month" value={`${data.coverage.averageSessionsPerMonth}`} note="sessions per observed month" />
        <StatCard icon={<Gauge size={20} />} label="Weekly rhythm" value={`${data.coverage.averageSessionsPerWeek}×`} note="sessions per week, all time" />
        <StatCard icon={<Flame size={20} />} label="Longest run" value={`${data.coverage.longestActiveWeekStreak} wk`} note="consecutive active weeks" />
        <StatCard icon={<Layers3 size={20} />} label="Exercise library" value={`${data.coverage.exerciseCount}`} note="movements available to explore" />
      </section>

      <section className={`section shell data-dependent ${data.achievements.length ? "" : "no-achievements"}`} id="highlights">
        <SectionHeading
          kicker="The headline gains"
          title="Your strongest measurable achievements"
            description="The cleanest comparisons use the same exercise and the same primary metric. These four have enough history to tell a compelling story."
        />
        <SectionInsight text={aiInsight?.sectionInsights.highlights} />
        <div className="achievement-grid">
          {data.achievements.map((achievement, index) => {
            const unit = metricMeta[achievement.metric as MetricKey].unit;
            return (
              <article className="achievement-card panel" key={achievement.exercise}>
                <div className="achievement-rank">0{index + 1}</div>
                <div className="achievement-icon"><TrendingUp size={22} /></div>
                <p className="eyebrow">{metricMeta[achievement.metric as MetricKey].label}</p>
                <h3>{achievement.exercise}</h3>
                <div className="achievement-numbers">
                  <span>{formatNumber(achievement.first.value)} {unit}</span>
                  <ChevronRight size={15} />
                  <strong>{formatNumber(achievement.latest.value)} {unit}</strong>
                </div>
                <div className="achievement-bottom">
                  <Delta value={achievement.percentChange} />
                  <span>peak {formatNumber(achievement.peak.value)} {unit}</span>
                </div>
              </article>
            );
          })}
        </div>
        {aiInsight && <div className="callout ai-insight">
          <Sparkles size={18} />
          <p><strong>The bigger achievement is sustained practice.</strong> {aiInsight.sustainedPractice}</p>
        </div>}
      </section>

      <section className="section shell data-dependent" id="consistency">
        <SectionHeading
          kicker="Consistency"
          title="The months that built the year"
          description="Partial opening and current months are visible in the chart but excluded from the busiest and quietest rankings."
        />
        <SectionInsight text={aiInsight?.sectionInsights.consistency} />
        <div className="two-column wide-left">
          <article className="panel chart-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">Session cadence</p><h3>Monthly sessions + cumulative journey</h3></div>
              <div className="legend-inline"><span><i className="legend-bar" /> Sessions</span><span><i className="legend-line" /> Cumulative</span></div>
            </div>
            <div className="chart-area tall">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={280} debounce={50}>
                <ComposedChart data={monthlyChart} margin={{ top: 12, right: 4, left: -24, bottom: 16 }}>
                  <CartesianGrid stroke="#1c3425" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: "#789080", fontSize: 16 }} axisLine={false} tickLine={false} tickMargin={12} interval={2} />
                  <YAxis yAxisId="sessions" tick={{ fill: "#789080", fontSize: 16 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="cumulative" orientation="right" tick={{ fill: "#789080", fontSize: 16 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(67, 255, 126, .04)" }} />
                  <Bar yAxisId="sessions" dataKey="sessions" name="Sessions" fill="#3fe277" radius={[5, 5, 1, 1]} maxBarSize={24} />
                  <Line yAxisId="cumulative" type="monotone" dataKey="cumulative" name="Cumulative" stroke="#c7ff4a" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="panel ranking-panel">
            <div className="panel-heading"><div><p className="eyebrow">Ranked months</p><h3>Busy & quiet</h3></div></div>
            <div className="rank-block">
              <p className="rank-title">Busiest complete months</p>
              {data.busiestMonths.slice(0, 3).map((month, index) => (
                <div className="rank-row" key={month.month}><span className="rank-number">{index + 1}</span><span>{formatMonth(month.month)}</span><strong>{month.sessions}</strong></div>
              ))}
            </div>
            <div className="rank-divider" />
            <div className="rank-block">
              <p className="rank-title">Quietest complete months</p>
              {data.quietestMonths.slice(0, 3).map((month, index) => (
                <div className="rank-row" key={month.month}><span className="rank-number">{index + 1}</span><span>{formatMonth(month.month)}</span><strong>{month.sessions}</strong></div>
              ))}
            </div>
          </article>
        </div>

        <div className="two-column equal consistency-lower">
          <article className="panel calendar-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">Attendance map</p><h3>{attendanceYear} training days</h3></div>
              <div className="calendar-pager" aria-label="Choose attendance year">
                <button aria-label="Previous year" disabled={attendanceYearIndex <= 0} onClick={() => setAttendanceYear(attendanceYears[attendanceYearIndex - 1])}><ChevronLeft size={15} /></button>
                <span>{attendanceYear} · {attendanceYearIndex + 1}/{attendanceYears.length}</span>
                <button aria-label="Next year" disabled={attendanceYearIndex >= attendanceYears.length - 1} onClick={() => setAttendanceYear(attendanceYears[attendanceYearIndex + 1])}><ChevronRight size={15} /></button>
              </div>
            </div>
            <div className="calendar-scroll">
              <div className="calendar-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
              <div className="attendance-grid" style={{ gridTemplateColumns: `repeat(${attendanceWeeks.length}, minmax(0, 1fr))` }}>
                {attendanceWeeks.flatMap((week) => week.days.map((day, index) => (
                  <span key={`${week.week}-${index}`} className={day.inYear ? day.active ? `attendance-cell active level-${day.active}` : "attendance-cell" : "attendance-cell outside"} data-tooltip={`${formatDate(day.date)}: ${day.active ? `training load ${day.active}/3` : "rest"}`} title={`${formatDate(day.date)}: ${day.active ? `training load ${day.active}/3` : "rest"}`} aria-label={`${formatDate(day.date)}: ${day.active ? `training load ${day.active}/3` : "rest"}`} />
                )))}
              </div>
            </div>
            <div className="calendar-legend"><span>Less load</span><i /><i className="mid" /><i className="high" /><span>More load</span></div>
          </article>
          <article className="panel gap-panel">
            <div className="panel-heading"><div><p className="eyebrow">Longest pauses</p><h3>Your top five gaps</h3></div></div>
            <div className="gap-list">
              {data.gaps.slice(0, 5).map((gap, index) => (
                <div className="gap-row" key={`${gap.from}-${gap.to}`}>
                  <span className="rank-number">{index + 1}</span>
                  <div><strong>{gap.daysBetween} days between sessions</strong><span>{formatDate(gap.from, { day: "numeric", month: "short" })} → {formatDate(gap.to, { day: "numeric", month: "short", year: "numeric" })}</span></div>
                  <b>{gap.daysOff}<small> days off</small></b>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section explorer-section data-dependent" id="progress">
        <div className="shell">
          <SectionHeading
            kicker="Exercise explorer"
            title={`Progress charts for all ${data.coverage.exerciseCount} exercises`}
            description="Search or filter your complete movement library. Weighted movements default to heaviest load; bodyweight exercises default to best-set reps; timed work defaults to duration."
            action={<span className="data-pill"><CircleDot size={13} /> {data.coverage.exerciseCount} complete histories</span>}
          />
          <SectionInsight text={aiInsight?.sectionInsights.progress} />

          <article className="panel focus-panel" id="exercise-focus">
            <div className="focus-top">
              <div>
                <p className="eyebrow">Selected movement</p>
                <h3>{selectedExercise.name}</h3>
                <div className="record-tags">
                  <span>{selectedExercise.sessions} sessions</span>
                  <span>{formatNumber(selectedExercise.totalSets, 0)} sets</span>
                </div>
              </div>
              <div className="metric-controls">
              <label className="metric-select">View metric
                <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}>
                  {selectedExercise.availableMetrics.map((metric) => <option value={metric} key={metric}>{metricMeta[metric].label}</option>)}
                </select>
              </label>
              <label className="metric-select">Compare with
                <select value={comparisonMetric} onChange={(event) => setComparisonMetric(event.target.value as MetricKey | "")}>
                  <option value="">None</option>
                  {selectedExercise.availableMetrics.filter((metric) => metric !== selectedMetric).map((metric) => <option value={metric} key={metric}>{metricMeta[metric].label}</option>)}
                </select>
              </label>
              </div>
            </div>
            <div className="focus-metrics">
              <div><span>Starting</span><strong>{formatNumber(selectedFirst)} <small>{selectedMeta.unit}</small></strong></div>
              <div><span>Latest</span><strong>{formatNumber(selectedLatest)} <small>{selectedMeta.unit}</small></strong></div>
              <div><span>All-time peak</span><strong>{formatNumber(selectedPeak)} <small>{selectedMeta.unit}</small></strong></div>
              <div><span>First → latest</span><strong><Delta value={selectedChange} /></strong></div>
            </div>
            <div className="legend-inline focus-legend"><span><i className="legend-history" /> {selectedMeta.label}</span>{comparisonMeta && <span><i className="legend-latest" /> {comparisonMeta.label}</span>}</div>
            <div className="chart-area focus-chart">
              {selectedSeries.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={300} debounce={50}>
                  <LineChart data={selectedChartData} margin={{ top: 20, right: 8, left: -12, bottom: 16 }}>
                    <defs><linearGradient id="exercise-line-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset={`${recentFadeStart}%`} stopColor="#3fe277" /><stop offset={`${recentFadeEnd}%`} stopColor="#c7ff4a" /></linearGradient></defs>
                    <CartesianGrid stroke="#1c3425" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, { month: "short", year: "2-digit" })} tick={{ fill: "#789080", fontSize: 16 }} axisLine={false} tickLine={false} tickMargin={12} minTickGap={42} />
                    <YAxis tick={{ fill: "#789080", fontSize: 16 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    {comparisonMeta && <YAxis yAxisId="comparison" orientation="right" tick={{ fill: "#c7ff4a", fontSize: 14 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />}
                    <Tooltip content={<ChartTooltip unit={selectedMeta.unit} comparisonUnit={comparisonMeta?.unit} />} cursor={{ stroke: "#31523b", strokeDasharray: "3 3" }} />
                    <Line type="monotone" dataKey="primaryValue" name={selectedMeta.label} stroke="url(#exercise-line-gradient)" strokeWidth={3.5} connectNulls dot={{ r: 2.5, fill: "#07100a", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    {comparisonMeta && <Line yAxisId="comparison" type="monotone" dataKey="comparisonValue" name={comparisonMeta.label} stroke="#c7ff4a" strokeWidth={2.5} strokeDasharray="5 4" connectNulls dot={{ r: 2, fill: "#07100a", strokeWidth: 2 }} activeDot={{ r: 5 }} />}
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="empty-state">Only one measurable point is available for this metric.</div>}
            </div>
          </article>

          <div className="explorer-toolbar">
            <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(24); }} placeholder={`Search ${data.coverage.exerciseCount} exercises…`} /></label>
            <label className="sort-select">Order by<select value={exerciseSort} onChange={(event) => setExerciseSort(event.target.value as "recent" | "used")}><option value="recent">Most recent</option><option value="used">Most used</option></select></label>
            <div className="family-filter" aria-label="Filter by exercise family">
              {families.map((item) => <button className={family === item ? "active" : ""} onClick={() => { setFamily(item); setVisibleCount(24); }} key={item}>{item}</button>)}
            </div>
          </div>

          <div className="exercise-grid">
            {filteredExercises.slice(0, visibleCount).map((exercise) => {
              const series = metricSeries(exercise, exercise.defaultMetric);
              const first = series[0]?.value ?? 0;
              const latest = series.at(-1)?.value ?? 0;
              const change = first ? ((latest / first) - 1) * 100 : 0;
              const meta = metricMeta[exercise.defaultMetric];
              const cardio = /rope|run|walk|bike|cycling|cardio|rowing|rower/i.test(exercise.name);
              const bodyweight = !cardio && !exercise.availableMetrics.includes("heaviestKg");
              return (
                <button className={selectedExercise.name === exercise.name ? "exercise-card panel selected" : "exercise-card panel"} onClick={() => selectExercise(exercise)} key={exercise.name}>
                  <div className="exercise-card-top"><span>{cardio ? <><HeartPulse size={14} aria-hidden="true" /> Cardio</> : bodyweight ? <><Dumbbell size={14} aria-hidden="true" /> Bodyweight</> : exercise.family}</span><ChevronRight size={16} /></div>
                  <h4>{exercise.name}</h4>
                  <Sparkline values={series.map((record) => record.value)} />
                  <div className="exercise-card-bottom">
                    <div><span>{meta.short}</span><strong>{formatNumber(latest)} {meta.unit}</strong></div>
                    {series.length > 1 ? <Delta value={change} /> : <span className="muted small">1 point</span>}
                  </div>
                </button>
              );
            })}
          </div>
          {filteredExercises.length > visibleCount && <button className="button load-more" onClick={() => setVisibleCount(filteredExercises.length)}>Show all {filteredExercises.length} exercises</button>}
          {filteredExercises.length > 24 && visibleCount >= filteredExercises.length && <button className="button load-more" onClick={() => setVisibleCount(24)}>Show first 24</button>}
        </div>
      </section>

      <section className={`section shell data-dependent ${data.muscles.length ? "" : "no-muscles"}`} id="muscles">
        <SectionHeading
          kicker="Muscle balance"
          title="Your program changed shape"
          description={`Early window used is ${formatDate(data.muscleWindows.early[0])} to ${formatDate(data.muscleWindows.early[1])}. Recent window is ${formatDate(data.muscleWindows.recent[0])} to ${formatDate(data.muscleWindows.recent[1])}. Values are set-equivalents per week.`}
        />
        <SectionInsight text={aiInsight?.sectionInsights.muscles} />
        <div className="two-column equal single-column">
          <article className="panel muscle-bars-panel">
            <div className="panel-heading"><div><p className="eyebrow">Early vs recent</p><h3>Weekly exposure by muscle</h3></div><div className="legend-inline"><span><i className="legend-early" /> Early</span><span><i className="legend-recent" /> Recent</span></div></div>
            <div className="muscle-bars">
              {data.muscles.map((muscle) => (
                <div className="muscle-row" key={muscle.muscle}>
                  <span>{muscle.muscle}</span>
                  <div className="muscle-tracks" aria-label={`${muscle.muscle}: early ${muscle.earlyWeekly}, recent ${muscle.recentWeekly} set-equivalents per week`}>
                    <i className="early" style={{ width: `${Math.min(100, (muscle.earlyWeekly / maxRecentMuscle) * 100)}%` }} />
                    <i className="recent" style={{ width: `${Math.min(100, (muscle.recentWeekly / maxRecentMuscle) * 100)}%` }} />
                  </div>
                  <strong><small>E {muscle.earlyWeekly}</small><b>R {muscle.recentWeekly}</b></strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {data.muscleHeatmap.weeks.length > 0 && data.muscleHeatmap.rows.length > 0 && <section className="section shell data-dependent muscle-heatmap-section" aria-labelledby="muscle-heatmap-title">
        <SectionHeading
          kicker="Training exposure"
          title={data.muscleHeatmap.weeks.length >= 13 ? "Your last 13 weeks at a glance" : "Your training exposure so far"}
          description={`Each square shows the recorded set-equivalents for one muscle group in one training week. Brighter squares mean more exposure. ${data.muscleHeatmap.weeks.length < 13 ? `This export covers ${data.muscleHeatmap.weeks.length} ${data.muscleHeatmap.weeks.length === 1 ? "week" : "weeks"}.` : ""}`}
        />
        <article className="panel heatmap-panel">
          <div className="panel-heading"><div><p className="eyebrow">Weekly pattern</p><h3 id="muscle-heatmap-title">Muscle exposure heatmap</h3></div><span className="muted small">set-equivalents</span></div>
          <div className="muscle-heatmap-scroll" tabIndex={0} aria-label="Scrollable muscle exposure heatmap">
            <div className="muscle-heatmap">
              <div className="heatmap-header"><span />{data.muscleHeatmap.weeks.map((week) => <i key={week}>{formatDate(week, { month: "short", day: "numeric" })}</i>)}</div>
              {data.muscleHeatmap.rows.map((row) => (
                <div className="heatmap-row" key={row.muscle}>
                  <span>{row.muscle}</span>
                  {row.weeks.map((value, index) => {
                    const level = value === 0 ? 0 : value < 3 ? 1 : value < 6 ? 2 : value < 10 ? 3 : 4;
                    return <i className={`heat-${level}`} title={`${row.muscle}: ${value} sets, week of ${formatDate(data.muscleHeatmap.weeks[index])}`} aria-label={`${row.muscle}: ${value} set-equivalents, week of ${formatDate(data.muscleHeatmap.weeks[index])}`} key={`${row.muscle}-${index}`} />;
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="footnote">Set exposure helps spot programming imbalances, but it does not diagnose overtraining or recovery status.</p>
        </article>
      </section>}

      <section className="section shell data-dependent" id="history">
        <SectionHeading
          kicker="Workhorses"
          title="The exercises you practiced most"
          description="Working sets are the clearest measure of repeated practice. Click any movement to open its complete progress chart."
        />
        <SectionInsight text={aiInsight?.sectionInsights.history} />
        <article className="panel leaderboard">
          <div className="leaderboard-head"><span>#</span><span>Exercise</span><span>Sessions</span><span>Working sets</span><span>Total reps</span></div>
          {exercises.slice(0, 12).map((exercise, index) => {
            const cardio = /rope|run|walk|bike|cycling|cardio|rowing|rower/i.test(exercise.name);
            const bodyweight = !cardio && !exercise.availableMetrics.includes("heaviestKg");
            return <button className="leaderboard-row" onClick={() => selectExercise(exercise)} key={exercise.name}>
              <span className="rank-number">{index + 1}</span>
              <span className="leader-name"><i>{cardio ? <HeartPulse size={15} aria-label="Cardio exercise" /> : bodyweight ? <Dumbbell size={15} aria-label="Bodyweight exercise" /> : <Dumbbell size={15} aria-hidden="true" />}</i><b>{exercise.name}</b><small>{exercise.family}</small></span>
              <strong>{exercise.sessions}</strong>
              <strong>{formatNumber(exercise.totalSets, 0)}</strong>
              <strong>{formatNumber(exercise.totalReps, 0)}</strong>
            </button>;
          })}
        </article>
      </section>

      <section className="section next-section data-dependent" id="next">
        <div className="shell">
          <SectionHeading
            kicker="Where to go next"
            title="The clearest opportunities in the data"
            description="Generate an AI interpretation after uploading your MacroFactor export. Only calculated summary metrics are sent; raw workbook rows are not. These are programming prompts, not diagnoses."
            action={<button className="button ai-action" onClick={generateRecommendations} disabled={recommendationState.startsWith("Generating")}><Sparkles size={16} /> Generate recommendations</button>}
          />
          {recommendations.length > 0 && <div className="callout ai-insight" aria-live="polite"><Sparkles size={20} /><div><p className="eyebrow accent">AI insight</p><p>These recommendations were generated from the currently loaded MacroFactor summary. They are programming prompts, not diagnoses.</p></div></div>}
          {recommendationState && !recommendations.length && <div className="callout ai-insight" role="status"><Sparkles size={20} /><div><p className="eyebrow accent">AI insight</p><p>{recommendationState}</p></div></div>}
          <div className="next-grid">
            {recommendations.map((item, index) => <article className="next-card panel" key={`${item.title}-${index}`}><span>0{index + 1}</span><div className="next-icon"><Target size={21} /></div><h3>{item.title}</h3><p>{item.summary}</p><p className="muted small">{item.evidence.join(" · ")}</p><ul className="next-actions">{item.actions.map((action) => <li key={action}>{action}</li>)}</ul></article>)}
            {!recommendations.length && data !== demoData && !recommendationState && <div className="callout ai-insight"><Sparkles size={20} /><div><p className="eyebrow accent">AI insight</p><p>Upload complete. Generate recommendations when you want an AI interpretation; your plotted data works without an OpenAI account.</p></div></div>}
            {!recommendations.length && data === demoData && <div className="callout ai-insight"><Sparkles size={20} /><div><p className="eyebrow accent">Ready when you are</p><p>Upload your MacroFactor export to populate the charts. AI recommendations will remain optional.</p></div></div>}
          </div>
          {aiInsight && <div className="principle panel"><div className="principle-icon"><Dumbbell size={25} /></div><div><p className="eyebrow accent">A simple next-year rule</p><h3>{aiInsight.nextYearRule}</h3><p>Generated from the current uploaded training summary.</p></div></div>}
        </div>
      </section>

      {connectOpen && <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConnectOpen(false); }}>
        <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="connect-title">
          <p className="eyebrow accent">Power Ripper OS with AI</p>
          <h2 id="connect-title">Connect OpenAI</h2>
          <p>Charts and upload processing work without an OpenAI account. Add an OpenAI API key only if you want personalized recommendations.</p>
          <input className="connect-key-input" type="password" value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder="sk-…" autoFocus autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-form-type="other" spellCheck={false} aria-label="OpenAI API key" />
          <p className="muted small">This key is kept in memory for this session only. It is never saved to browser storage. API usage is billed separately from ChatGPT.</p>
          {connectionState && <p className="connect-status" role="status">{connectionState}</p>}
          <div className="connect-actions"><button className="button secondary" onClick={() => { setOpenAIKey(""); setKeyDraft(""); setConnectionState(""); setConnectOpen(false); }}>Disconnect</button><button className="button primary" onClick={verifyOpenAIConnection} disabled={connectionState === "Verifying OpenAI connection…"}>{connectionState === "Verifying OpenAI connection…" ? "Verifying…" : "Connect"}</button></div>
        </section>
      </div>}

      {loadedExportOpen && <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoadedExportOpen(false); }}>
        <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="loaded-export-title">
          <p className="eyebrow accent">Current export</p>
          <h2 id="loaded-export-title">MacroFactor data is loaded</h2>
          <p className="loaded-export-name">{lastExportName || "MacroFactor export"}</p>
          {lastExportAt && <p className="muted small">Loaded {new Date(lastExportAt).toLocaleString()}</p>}
          <div className="connect-actions"><button className="button secondary" onClick={() => setLoadedExportOpen(false)}>Close</button><label className="button primary upload-button">Replace export<input type="file" accept=".xlsx,.csv" onChange={(event) => { setLoadedExportOpen(false); handleUpload(event); }} /></label></div>
        </section>
      </div>}

      {aiConsentOpen && <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAiConsentOpen(false); }}>
        <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="ai-consent-title">
          <p className="eyebrow accent">Power Ripper OS with AI</p>
          <h2 id="ai-consent-title">Generate recommendations?</h2>
          <p>Only calculated summary metrics are sent for this request. Raw workbook rows stay in this browser. OpenAI API usage may incur charges and is billed separately from ChatGPT.</p>
          <div className="connect-actions"><button className="button secondary" onClick={() => setAiConsentOpen(false)}>Cancel</button><button className="button primary" onClick={requestRecommendations}>Generate</button></div>
        </section>
      </div>}

      {recommendationError && <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecommendationError(""); }}>
        <section className="connect-dialog panel" role="alertdialog" aria-modal="true" aria-labelledby="recommendation-error-title">
          <p className="eyebrow accent">Power Ripper OS with AI</p>
          <h2 id="recommendation-error-title">Recommendations unavailable</h2>
          <p>{recommendationError}</p>
          <div className="connect-actions"><button className="button secondary" onClick={() => setRecommendationError("")}>Close</button><button className="button ai-action" onClick={() => { setRecommendationError(""); generateRecommendations(); }}>Try again</button></div>
        </section>
      </div>}

      {clearConfirmOpen && <div className="connect-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setClearConfirmOpen(false); }}>
        <section className="connect-dialog panel" role="dialog" aria-modal="true" aria-labelledby="clear-title">
          <p className="eyebrow accent">Session data</p>
          <h2 id="clear-title">Clear uploaded data?</h2>
          <p>This removes the current MacroFactor summary from this browser session. You can upload it again at any time.</p>
          <div className="connect-actions"><button className="button secondary" onClick={() => setClearConfirmOpen(false)}>Cancel</button><button className="button primary" onClick={() => { setClearConfirmOpen(false); clearUploadedData(); }}>Clear data</button></div>
        </section>
      </div>}

      {recommendationState.startsWith("Generating") && <div className="ai-loading-toast" role="status" aria-live="polite"><Sparkles size={18} /><div><p className="eyebrow accent">AI INSIGHTS</p><p>Generating recommendations…</p></div></div>}

      <footer className="shell footer">
        <div className="sidiousware-lockup">
          <Image src="/brand/sidiousware-logo.png" alt="Sidiousware" width={330} height={191} />
        </div>
        <p><a href="https://github.com/sidiousvic/ripper-os/issues/new?title=Bug%3A%20&body=%23%23%20What%20happened%3F%0A%0A%23%23%20How%20can%20we%20reproduce%20it%3F%0A%0A%23%23%20Browser%20and%20device%0A" target="_blank" rel="noreferrer">Report a bug 🪲</a></p>
      </footer>
    </main>
  );
}
