"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Dumbbell,
  Flame,
  Gauge,
  Layers3,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import data from "./training-data.json";

type MetricKey = "heaviestKg" | "e1rmKg" | "bestSetReps" | "totalVolumeKg" | "totalReps" | "totalSets" | "durationSec";
type ProgressRecord = {
  date: string;
  source: "Gymverse" | "MacroFactor";
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
  sources: string[];
  firstDate: string;
  lastDate: string;
  sessions: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  progress: ProgressRecord[];
};

const exercises = data.exercises as Exercise[];
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

function ChartTooltip({ active, payload, label, unit = "" }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p>{label?.length === 7 ? formatMonth(label) : label ? formatDate(label) : ""}</p>
      {payload.filter((item) => item.value != null).map((item) => (
        <div key={`${item.name}-${item.dataKey}`} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: item.color }} />
          <span>{item.name}</span>
          <strong>{formatNumber(Number(item.value))}{unit ? ` ${unit}` : ""}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [selectedExerciseName, setSelectedExerciseName] = useState("Dumbbell Fly");
  const selectedExercise = exercises.find((exercise) => exercise.name === selectedExerciseName) ?? exercises[0];
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(selectedExercise.defaultMetric);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("All");
  const [visibleCount, setVisibleCount] = useState(24);

  const selectExercise = (exercise: Exercise) => {
    setSelectedExerciseName(exercise.name);
    setSelectedMetric(exercise.defaultMetric);
    document.getElementById("exercise-focus")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const families = useMemo(() => ["All", ...Array.from(new Set(exercises.map((exercise) => exercise.family))).sort()], []);
  const filteredExercises = useMemo(() => exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (family === "All" || exercise.family === family);
  }), [search, family]);

  const selectedSeries = metricSeries(selectedExercise, selectedMetric);
  const selectedChartData = selectedSeries.map((record) => ({
    ...record,
    gymverse: record.source === "Gymverse" ? record.value : null,
    macroFactor: record.source === "MacroFactor" ? record.value : null,
  }));
  const selectedFirst = selectedSeries[0]?.value ?? 0;
  const selectedLatest = selectedSeries.at(-1)?.value ?? 0;
  const selectedPeak = Math.max(...selectedSeries.map((record) => record.value), 0);
  const selectedChange = selectedFirst ? ((selectedLatest / selectedFirst) - 1) * 100 : 0;
  const selectedMeta = metricMeta[selectedMetric];

  const monthlyChart = data.monthly.map((item) => ({ ...item, label: formatMonth(item.month) }));
  const maxRecentMuscle = Math.max(...data.muscles.map((muscle) => muscle.recentWeekly), 1);
  const cadenceDelta = ((data.eras[1].sessionsPerWeek / data.eras[0].sessionsPerWeek) - 1) * 100;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Training Journey home">
          <span className="brand-mark"><Dumbbell size={19} /></span>
          <span>Training Journey</span>
        </a>
        <nav aria-label="Dashboard sections">
          <a href="#progress">Progress</a>
          <a href="#consistency">Consistency</a>
          <a href="#muscles">Muscles</a>
          <a href="#next">Next steps</a>
        </nav>
        <span className="data-pill"><CircleDot size={13} /> Updated {formatDate(data.coverage.lastDate, { day: "numeric", month: "short", year: "numeric" })}</span>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="status-label"><Sparkles size={15} /> Gymverse + MacroFactor, unified</div>
          <h1>A year and a half,<br /><span>made visible.</span></h1>
          <p>Your complete strength story—from the first logged set to your latest session—organized into progress, consistency, muscle balance, and the clearest next opportunities.</p>
          <div className="hero-actions">
            <a className="button primary" href="#progress">Explore all exercises <ChevronRight size={17} /></a>
            <a className="button secondary" href="#next">See where to go next</a>
          </div>
        </div>
        <div className="hero-visual panel" aria-label="Training journey overview">
          <div className="hero-visual-top">
            <div>
              <p className="eyebrow">Recorded training days</p>
              <p className="hero-number">{data.coverage.totalSessions}</p>
            </div>
            <Delta value={cadenceDelta} />
          </div>
          <div className="journey-line" aria-hidden="true">
            <span className="journey-start" />
            <span className="journey-switch" />
            <span className="journey-end" />
          </div>
          <div className="journey-labels">
            <span><b>{formatDate(data.coverage.firstDate, { month: "short", year: "numeric" })}</b> First Gymverse session</span>
            <span><b>Jun 2026</b> Moved to MacroFactor</span>
            <span><b>{formatDate(data.coverage.lastDate, { month: "short", year: "numeric" })}</b> Latest export</span>
          </div>
          <div className="hero-foot">
            <span>{data.coverage.journeyDays} days observed</span>
            <span>{data.coverage.exerciseCount} exercises mapped</span>
          </div>
        </div>
      </section>

      <section className="stats shell" aria-label="Key training statistics">
        <StatCard icon={<CalendarDays size={20} />} label="Average month" value={`${data.coverage.averageSessionsPerMonth}`} note="sessions across 18 observed months" />
        <StatCard icon={<Gauge size={20} />} label="Weekly rhythm" value={`${data.coverage.averageSessionsPerWeek}×`} note="sessions per week, all time" />
        <StatCard icon={<Flame size={20} />} label="Longest run" value={`${data.coverage.longestActiveWeekStreak} wk`} note="consecutive active weeks" />
        <StatCard icon={<Layers3 size={20} />} label="Exercise library" value={`${data.coverage.exerciseCount}`} note="movements available to explore" />
      </section>

      <section className="section shell" id="highlights">
        <SectionHeading
          kicker="The headline gains"
          title="Your strongest measurable achievements"
          description="The cleanest cross-era comparisons use the same exercise and the same primary metric. These four have enough history to tell a compelling story."
        />
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
        <div className="callout">
          <Sparkles size={18} />
          <p><strong>The bigger achievement is sustained practice.</strong> You logged {data.coverage.totalSessions} sessions and maintained a {data.coverage.longestActiveWeekStreak}-week active streak. Your MacroFactor-era cadence is {data.eras[1].sessionsPerWeek} sessions/week, up from {data.eras[0].sessionsPerWeek} in the Gymverse era.</p>
        </div>
      </section>

      <section className="section shell" id="consistency">
        <SectionHeading
          kicker="Consistency"
          title="The months that built the year"
          description="Partial opening and current months are visible in the chart but excluded from the busiest and quietest rankings."
        />
        <div className="two-column wide-left">
          <article className="panel chart-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">Session cadence</p><h3>Monthly sessions + cumulative journey</h3></div>
              <div className="legend-inline"><span><i className="legend-bar" /> Sessions</span><span><i className="legend-line" /> Cumulative</span></div>
            </div>
            <div className="chart-area tall">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyChart} margin={{ top: 12, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#1c3425" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: "#789080", fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis yAxisId="sessions" tick={{ fill: "#789080", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="cumulative" orientation="right" tick={{ fill: "#789080", fontSize: 11 }} axisLine={false} tickLine={false} />
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
            <div className="panel-heading"><div><p className="eyebrow">Attendance map</p><h3>Every recorded training day</h3></div><span className="muted small">Apr 2025 → Sep 2026</span></div>
            <div className="calendar-scroll">
              <div className="calendar-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
              <div className="attendance-grid">
                {data.attendance.flatMap((week) => week.days.map((active, index) => (
                  <span key={`${week.week}-${index}`} className={active ? "attendance-cell active" : "attendance-cell"} title={`${formatDate(new Date(new Date(`${week.week}T00:00:00Z`).valueOf() + index * 86_400_000).toISOString().slice(0, 10))}: ${active ? "trained" : "rest"}`} />
                )))}
              </div>
            </div>
            <div className="calendar-legend"><span>Less</span><i /><i className="mid" /><i className="high" /><span>Training day</span></div>
          </article>
          <article className="panel gap-panel">
            <div className="panel-heading"><div><p className="eyebrow">Longest pauses</p><h3>Not just #1—the top five gaps</h3></div></div>
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

      <section className="section explorer-section" id="progress">
        <div className="shell">
          <SectionHeading
            kicker="Exercise explorer"
            title={`Progress charts for all ${data.coverage.exerciseCount} exercises`}
            description="Search or filter your complete movement library. Weighted movements default to heaviest load; bodyweight exercises default to best-set reps; timed work defaults to duration."
            action={<span className="data-pill"><CircleDot size={13} /> Both eras connected</span>}
          />

          <article className="panel focus-panel" id="exercise-focus">
            <div className="focus-top">
              <div>
                <p className="eyebrow">Selected movement · {selectedExercise.family}</p>
                <h3>{selectedExercise.name}</h3>
                <div className="source-tags">
                  {selectedExercise.sources.map((source) => <span className={source === "Gymverse" ? "source gymverse" : "source macro"} key={source}>{source}</span>)}
                  <span>{selectedExercise.sessions} sessions</span>
                  <span>{formatNumber(selectedExercise.totalSets, 0)} sets</span>
                </div>
              </div>
              <label className="metric-select">View metric
                <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}>
                  {selectedExercise.availableMetrics.map((metric) => <option value={metric} key={metric}>{metricMeta[metric].label}</option>)}
                </select>
              </label>
            </div>
            <div className="focus-metrics">
              <div><span>Starting</span><strong>{formatNumber(selectedFirst)} <small>{selectedMeta.unit}</small></strong></div>
              <div><span>Latest</span><strong>{formatNumber(selectedLatest)} <small>{selectedMeta.unit}</small></strong></div>
              <div><span>All-time peak</span><strong>{formatNumber(selectedPeak)} <small>{selectedMeta.unit}</small></strong></div>
              <div><span>First → latest</span><strong><Delta value={selectedChange} /></strong></div>
            </div>
            <div className="chart-area focus-chart">
              {selectedSeries.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedChartData} margin={{ top: 20, right: 8, left: -12, bottom: 2 }}>
                    <CartesianGrid stroke="#1c3425" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, { month: "short", year: "2-digit" })} tick={{ fill: "#789080", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={42} />
                    <YAxis tick={{ fill: "#789080", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTooltip unit={selectedMeta.unit} />} cursor={{ stroke: "#31523b", strokeDasharray: "3 3" }} />
                    <ReferenceLine x="2026-06-10" stroke="#5b7462" strokeDasharray="4 5" label={{ value: "MacroFactor era", position: "insideTopRight", fill: "#789080", fontSize: 11 }} />
                    <Line type="monotone" dataKey="gymverse" name="Gymverse" stroke="#3fe277" strokeWidth={3} connectNulls dot={{ r: 2.5, fill: "#07100a", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="macroFactor" name="MacroFactor" stroke="#c7ff4a" strokeWidth={3} connectNulls dot={{ r: 2.5, fill: "#07100a", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Legend iconType="circle" wrapperStyle={{ color: "#8da295", fontSize: 12, paddingTop: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="empty-state">Only one measurable point is available for this metric.</div>}
            </div>
          </article>

          <div className="explorer-toolbar">
            <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(24); }} placeholder="Search 76 exercises…" /></label>
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
              return (
                <button className={selectedExercise.name === exercise.name ? "exercise-card panel selected" : "exercise-card panel"} onClick={() => selectExercise(exercise)} key={exercise.name}>
                  <div className="exercise-card-top"><span>{exercise.family}</span><ChevronRight size={16} /></div>
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

      <section className="section shell" id="muscles">
        <SectionHeading
          kicker="Muscle balance"
          title="Your program changed shape"
          description={`Early window: ${formatDate(data.muscleWindows.early[0], { month: "short", year: "numeric" })}–${formatDate(data.muscleWindows.early[1], { month: "short", year: "numeric" })}. Recent window: ${formatDate(data.muscleWindows.recent[0], { month: "short", year: "numeric" })}–${formatDate(data.muscleWindows.recent[1], { month: "short", year: "numeric" })}. Values are set-equivalents per week.`}
        />
        <div className="two-column equal">
          <article className="panel muscle-bars-panel">
            <div className="panel-heading"><div><p className="eyebrow">Early vs recent</p><h3>Weekly exposure by muscle</h3></div><div className="legend-inline"><span><i className="legend-early" /> Early</span><span><i className="legend-recent" /> Recent</span></div></div>
            <div className="muscle-bars">
              {data.muscles.map((muscle) => (
                <div className="muscle-row" key={muscle.muscle}>
                  <span>{muscle.muscle}</span>
                  <div className="muscle-tracks">
                    <i className="early" style={{ width: `${Math.min(100, (muscle.earlyWeekly / maxRecentMuscle) * 100)}%` }} />
                    <i className="recent" style={{ width: `${Math.min(100, (muscle.recentWeekly / maxRecentMuscle) * 100)}%` }} />
                  </div>
                  <strong>{muscle.recentWeekly}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="panel heatmap-panel">
            <div className="panel-heading"><div><p className="eyebrow">Last 13 weeks</p><h3>Muscle exposure heatmap</h3></div><span className="muted small">set-equivalents</span></div>
            <div className="muscle-heatmap-scroll">
              <div className="muscle-heatmap">
                <div className="heatmap-header"><span />{data.muscleHeatmap.weeks.map((week) => <i key={week}>{formatDate(week, { month: "short", day: "numeric" })}</i>)}</div>
                {data.muscleHeatmap.rows.map((row) => (
                  <div className="heatmap-row" key={row.muscle}>
                    <span>{row.muscle}</span>
                    {row.weeks.map((value, index) => {
                      const level = value === 0 ? 0 : value < 3 ? 1 : value < 6 ? 2 : value < 10 ? 3 : 4;
                      return <i className={`heat-${level}`} title={`${row.muscle}: ${value} sets, week of ${formatDate(data.muscleHeatmap.weeks[index])}`} key={`${row.muscle}-${index}`} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="footnote">Set exposure helps spot programming imbalances, but it does not diagnose overtraining or recovery status.</p>
          </article>
        </div>
      </section>

      <section className="section shell" id="history">
        <SectionHeading
          kicker="Workhorses"
          title="The exercises you practiced most"
          description="Working sets are the clearest measure of repeated practice across both apps. Click any movement to open its complete progress chart."
        />
        <article className="panel leaderboard">
          <div className="leaderboard-head"><span>#</span><span>Exercise</span><span>Sessions</span><span>Working sets</span><span>Total reps</span><span>Era</span></div>
          {exercises.slice(0, 12).map((exercise, index) => (
            <button className="leaderboard-row" onClick={() => selectExercise(exercise)} key={exercise.name}>
              <span className="rank-number">{index + 1}</span>
              <span className="leader-name"><i><Dumbbell size={15} /></i><b>{exercise.name}</b><small>{exercise.family}</small></span>
              <strong>{exercise.sessions}</strong>
              <strong>{formatNumber(exercise.totalSets, 0)}</strong>
              <strong>{formatNumber(exercise.totalReps, 0)}</strong>
              <span className={exercise.sources.length === 2 ? "era both" : exercise.sources[0] === "Gymverse" ? "era gymverse" : "era macro"}>{exercise.sources.length === 2 ? "Both" : exercise.sources[0]}</span>
            </button>
          ))}
        </article>
      </section>

      <section className="section next-section" id="next">
        <div className="shell">
          <SectionHeading
            kicker="Where to go next"
            title="The clearest opportunities in the data"
            description="These are programming prompts, not diagnoses. The best next block is one you can recover from, perform consistently, and measure with stable technique."
          />
          <div className="next-grid">
            <article className="next-card panel"><span>01</span><div className="next-icon"><Target size={21} /></div><h3>Build a lower-body floor</h3><p>Recent quad exposure is <strong>0.8 sets/week</strong>; calves and tibialis are at <strong>0</strong>. Add two repeatable lower-body anchors and progress them for 8–12 weeks.</p><div className="next-tags"><i>Quads</i><i>Calves</i><i>Tibialis</i></div></article>
            <article className="next-card panel"><span>02</span><div className="next-icon"><TrendingUp size={21} /></div><h3>Restore chest and lat balance</h3><p>Recent chest exposure is <strong>2.7 sets/week</strong> and lats are <strong>2.3</strong>, well below your earlier pattern. Reintroduce one press and one vertical pull as tracked anchors.</p><div className="next-tags"><i>Chest</i><i>Lats</i></div></article>
            <article className="next-card panel"><span>03</span><div className="next-icon"><Gauge size={21} /></div><h3>Watch shoulder overlap</h3><p>Front delts lead recent exposure at <strong>11.4 sets/week</strong>. Keep the strong lateral-delt progress, but count pressing overlap before adding more front-delt work.</p><div className="next-tags"><i>Front delts</i><i>Side delts</i><i>Rear delts</i></div></article>
            <article className="next-card panel"><span>04</span><div className="next-icon"><CalendarDays size={21} /></div><h3>Protect the rhythm</h3><p>Your best sustainable target is <strong>10–12 sessions/month</strong>. Plan deloads or travel weeks so breaks do not accidentally become another 10–14-day gap.</p><div className="next-tags"><i>Cadence</i><i>Recovery</i></div></article>
          </div>
          <div className="principle panel"><div className="principle-icon"><Dumbbell size={25} /></div><div><p className="eyebrow accent">A simple next-year rule</p><h3>Keep six anchor movements stable long enough to measure.</h3><p>Choose one horizontal press, one vertical press, one vertical pull, one row, one knee-dominant lift, and one hip hinge. Track load, reps, and reps-in-reserve consistently; rotate accessories around them.</p></div></div>
        </div>
      </section>

      <footer className="shell footer">
        <div className="brand"><span className="brand-mark"><Dumbbell size={18} /></span><span>Training Journey</span></div>
        <p>Built from your Gymverse screenshots and MacroFactor exercise history. No nutrition data included.</p>
        <p className="muted">{data.methodology.caveat}</p>
      </footer>
    </main>
  );
}
