/**
 * Filler copy for the post-sync bottom sheet. All numbers and descriptors are random each time.
 */
function rInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export type SyncConfirmationNarrative = {
  /** e.g. "27" for bold display */
  exerciseValue: string;
  exerciseUnit: string;
  /** e.g. "irregular" */
  sleepDescriptor: string;
  /** e.g. "12" */
  daySpan: string;
  dayLabel: "day" | "days";
  /** one flowing line for screen readers / alt */
  fullSentence: string;
};

const EXERCISE_UNITS = [
  "exercise sessions",
  "workouts",
  "activity blocks",
  "recorded activities",
] as const;

const SLEEP_DESCRIPTORS = [
  "Irregular",
  "Light",
  "Fragmented",
  "Stable",
  "Variable",
  "Deep-leaning",
  "Inconsistent",
  "Consistent",
] as const;

export function buildRandomSyncConfirmationNarrative(): SyncConfirmationNarrative {
  const n = rInt(3, 64);
  const exUnit = pick([...EXERCISE_UNITS]);
  const sleep = pick([...SLEEP_DESCRIPTORS]);
  const d = rInt(1, 30);
  const dayLabel = d === 1 ? "day" : "days";
  const exerciseValue = String(n);
  const daySpan = String(d);
  const fullSentence = `${n} ${exUnit}, ${sleep.toLowerCase()} sleep patterns, spanning across ${d} ${dayLabel}.`;
  return {
    exerciseValue,
    exerciseUnit: exUnit,
    sleepDescriptor: sleep,
    daySpan,
    dayLabel,
    fullSentence,
  };
}
