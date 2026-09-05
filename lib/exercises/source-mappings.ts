import type { TrainingSource } from "../domain/training.ts";

export type SourceMapping = { source: TrainingSource; rawName: string; exerciseId: string; comparable: boolean };
export const sourceMappings: SourceMapping[] = [
  { source: "macrofactor", rawName: "Barbell Bench Press", exerciseId: "barbell_bench_press", comparable: true },
  { source: "strong", rawName: "Bench Press (Barbell)", exerciseId: "barbell_bench_press", comparable: true },
  { source: "hevy", rawName: "Bench Press (Barbell)", exerciseId: "barbell_bench_press", comparable: true },
];
const macroFactorKnownNames = ["Push Up", "Standing Dumbbell Overhead Press", "Dumbbell Skull Crusher", "Dips", "Standing Dumbbell Shrug", "Dumbbell Bench Press", "Standing Dumbbell Biceps Curl", "Dumbbell Fly", "Incline Dumbbell Bench Press", "Incline Dumbbell Curl", "Single Arm Dumbbell Row", "Shadow Boxing", "Prone Tricep Kick Back, Single Arm", "Kneeling Ab Wheel", "Chin-Up", "Incline Hammer Curl", "Halos", "Dumbbell Deadlift", "Overhand Grip Pull Up", "Chest Supported Dumbbell Row", "Kettlebell Bent Over Row", "Kettlebell Swing", "Standing Single Arm Kettlebell Overhead Press", "Goblet Squat", "Standing Dumbbell Hammer Curl", "Dumbbell Incline Prone Reverse Fly", "Seated Dumbbell Overhead Press", "Dumbbell Tricep Kick Back, Incline Prone", "Incline Dumbbell Lateral Raise", "Dumbbell Romanian Deadlift", "Standing Neutral Grip Dumbbell Overhead Press", "Decline Push-Up", "Pause Dumbbell Bench Press", "Plank", "Plate-Weighted Neck Curl", "Single Arm Elbow-In Dumbbell Row", "Seated Dumbbell Curl", "Incline Prone Dumbbell Shrugs", "Dumbbell Pendlay Row", "Plate-Weighted Neck Extension", "Pause Triceps Dip", "Wall Squat", "Seated Dumbbell Shrug", "Seated Single Arm Dumbbell Overhead Triceps Extension", "Hanging Straight Leg Raise", "Kettlebell Hammer Curl", "Seated Dumbbell Hammer Curl", "Incline Dumbbell Fly", "Hamstring Sliders", "Football Drills", "Seated Dumbbell Overhead Press, Neutral Grip", "Dumbbell Lunge", "Dumbbell Walking Lunges", "Seated Dumbbell Overhead Triceps Extension", "Hanging Knee Raise", "Inverted Row, Overhand Grip", "Dumbbell Step Up", "Floor Back Extension", "Decline Dumbbell Pullover", "Standing Calf Raise, Weighted", "Deadhangs", "Preacher Dumbbell Wrist Curl", "Reverse Nordic Curl", "Seated Dumbbell Wrist Curl"];
const sourceSlug = (name: string) => name.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "unnamed";
for (const rawName of macroFactorKnownNames) sourceMappings.push({ source: "macrofactor", rawName, exerciseId: `macrofactor_${sourceSlug(rawName)}`, comparable: false });

export function sourceMappingKey(source: TrainingSource, rawName: string) {
  return `${source}:${rawName.trim().toLocaleLowerCase()}`;
}
export const sourceMappingByKey = new Map(sourceMappings.map(mapping => [sourceMappingKey(mapping.source, mapping.rawName), mapping]));
