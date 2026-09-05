export type MetricKey = "heaviestKg" | "e1rmKg" | "bestSetReps" | "totalVolumeKg" | "totalReps" | "totalSets" | "durationSec";

export type ProgressRecord = {
  date: string;
  heaviestKg: number | null;
  e1rmKg: number | null;
  bestSetReps: number | null;
  totalVolumeKg: number | null;
  totalReps: number | null;
  totalSets: number | null;
  durationSec: number | null;
};

export type Exercise = {
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

export type Achievement = { exercise: string; metric: MetricKey; first: { date: string; value: number }; latest: { date: string; value: number }; peak: { date: string; value: number }; percentChange: number };
export type Monthly = { month: string; sessions: number; cumulative: number; coverage: string };
export type Gap = { from: string; to: string; daysBetween: number; daysOff: number };
export type Attendance = { week: string; days: number[]; sessions: number };
export type Muscle = { muscle: string; allTimeSets: number; earlyWeekly: number; recentWeekly: number; change: number };

export type DashboardData = {
  generatedAt: string | null;
  coverage: { firstDate: string; lastDate: string; journeyDays: number; totalSessions: number; averageSessionsPerMonth: number; averageSessionsPerWeek: number; exerciseCount: number; longestActiveWeekStreak: number };
  monthly: Monthly[];
  busiestMonths: Monthly[];
  quietestMonths: Monthly[];
  gaps: Gap[];
  attendance: Attendance[];
  exercises: Exercise[];
  muscleWindows: { early: [string, string]; recent: [string, string] };
  muscles: Muscle[];
  muscleHeatmap: { weeks: string[]; rows: { muscle: string; weeks: number[] }[] };
  achievements: Achievement[];
  methodology: Record<string, string>;
};
