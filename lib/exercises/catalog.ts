export interface CanonicalExercise {
  id: string;
  displayName: string;
  aliases: string[];
  equipment?: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "unknown";
  movementPattern?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  unilateral?: boolean;
  bodyweightComponent?: boolean;
  tags?: string[];
}

export const exerciseCatalog: CanonicalExercise[] = [
  { id: "barbell_bench_press", displayName: "Barbell Bench Press", aliases: ["Bench Press (Barbell)"], equipment: "barbell", movementPattern: "horizontal-push", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"] },
  { id: "dumbbell_incline_bench_press", displayName: "Dumbbell Incline Bench Press", aliases: ["Incline Bench Press (Dumbbell)"], equipment: "dumbbell", movementPattern: "incline-push", primaryMuscles: ["chest"], secondaryMuscles: ["front delts", "triceps"] },
  { id: "barbell_back_squat", displayName: "Barbell Back Squat", aliases: ["Squat (Barbell)", "Back Squat (Barbell)"], equipment: "barbell", movementPattern: "squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "posterior chain"] },
  { id: "barbell_front_squat", displayName: "Barbell Front Squat", aliases: ["Front Squat (Barbell)"], equipment: "barbell", movementPattern: "squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "posterior chain"] },
  { id: "barbell_deadlift", displayName: "Barbell Deadlift", aliases: ["Deadlift (Barbell)"], equipment: "barbell", movementPattern: "deadlift", primaryMuscles: ["posterior chain"], secondaryMuscles: ["back"] },
  { id: "barbell_romanian_deadlift", displayName: "Barbell Romanian Deadlift", aliases: ["Romanian Deadlift (Barbell)"], equipment: "barbell", movementPattern: "hinge", primaryMuscles: ["posterior chain"], secondaryMuscles: ["back"] },
];

export const canonicalById = new Map(exerciseCatalog.map(exercise => [exercise.id, exercise]));
