import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DemoBiometricMetric, DemoMetricStatus } from "@aida/shared";

export const LATEST_BIOMETRICS_STORAGE_KEY = "aida.syncedHealth.v1";

/** Ingested during the last device sync (simulated when full HealthKit/REST are not connected). */
export type HealthSyncRunStats = {
  /** Distinct sleep sessions in the import window. */
  sleepEvents: number;
  /** All samples / events (heart rate, steps, HRV, etc.) merged for this sync. */
  totalEvents: number;
  /** Uncompressed payload size Aida would store or forward. */
  bytesIn: number;
};

export type SyncedHealthState = {
  metrics: DemoBiometricMetric[];
  lastSourceId: string;
  lastSourceLabel: string;
  lastSyncAt: string;
  lastSyncStats?: HealthSyncRunStats;
};

const DETAIL_TEMPLATES: { attention: string[]; stable: string[] } = {
  attention: [
    "Spiking vs. your 7-day baseline",
    "Worth a quick recheck",
    "Outside your usual range",
    "Swings more than the last few syncs",
    "Jittery compared to this morning's sample",
  ],
  stable: [
    "Within your expected range",
    "Holding steady with recent days",
    "On track for today",
    "Consistent with last sync",
  ],
};

function rInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Plausible per-sync ingest stats for the confirmation UI. */
export function buildSyncRunStats(): HealthSyncRunStats {
  return {
    sleepEvents: rInt(2, 12),
    totalEvents: rInt(1_400, 52_000),
    bytesIn: rInt(220_000, 4_800_000),
  };
}

export function formatIngestedBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function lineForStatus(status: DemoMetricStatus) {
  return status === "attention" ? pick(DETAIL_TEMPLATES.attention) : pick(DETAIL_TEMPLATES.stable);
}

/** Shuffle [0, n) and use first two for guaranteed unstable slots. */
function twoRandomIndices(n: number): [number, number] {
  const a = rInt(0, n - 1);
  let b = rInt(0, n - 1);
  while (b === a) b = rInt(0, n - 1);
  return [a, b];
}

function statusForIndex(i: number, forced: Set<number>): DemoMetricStatus {
  if (forced.has(i)) return "attention";
  return Math.random() < 0.1 ? "attention" : "stable";
}

/**
 * Random sample vitals. **At least 2 of 5** are always `attention` (unstable).
 * Unstable values get extra random jitter on each sync.
 */
export function buildRandomBiometricMetrics(): DemoBiometricMetric[] {
  const [i1, i2] = twoRandomIndices(5);
  const forcedAttention = new Set([i1, i2]);

  const baseRhr = rInt(56, 86);
  const baseSleep = rInt(40, 88);
  const baseHrv = rInt(16, 58);
  const baseSteps = rInt(2_200, 14_200);
  const baseSpo2 = rInt(95, 99);

  // Order for home grid: 2 col (RHR, HRV) → (SpO2, Sleep) → full-width Steps. SpO2 is not left alone after Steps.
  const rows = [
    { id: "resting-heart-rate", label: "Resting heart rate", shortLabel: "Resting HR", unit: "bpm" as const, base: baseRhr, fmt: (n: number) => String(n) },
    { id: "heart-rate-variability", label: "HRV", shortLabel: "HRV", unit: "ms" as const, base: baseHrv, fmt: (n: number) => String(n) },
    { id: "blood-oxygen", label: "Blood oxygen", shortLabel: "SpO2", unit: "%" as const, base: baseSpo2, fmt: (n: number) => String(n) },
    { id: "sleep-score", label: "Sleep score", shortLabel: "Sleep", unit: "/100" as const, base: baseSleep, fmt: (n: number) => String(n) },
    { id: "steps", label: "Steps", shortLabel: "Steps", unit: undefined, base: baseSteps, fmt: (n: number) => n.toLocaleString("en-US"), wide: true as const },
  ] as const;

  return rows.map((row, i): DemoBiometricMetric => {
    const st = statusForIndex(i, forcedAttention);
    let v = row.base;
    if (st === "attention") {
      if (row.id === "steps") v = Math.max(500, v + rInt(-3_200, 3_200));
      else if (row.id === "blood-oxygen") v = Math.max(88, Math.min(99, v + rInt(-4, 0)));
      else v = v + rInt(-14, 14);
    } else {
      v = v + rInt(-3, 3);
    }
    if (row.id === "resting-heart-rate") v = Math.max(48, Math.min(104, v));
    if (row.id === "sleep-score") v = Math.max(22, Math.min(99, v));
    if (row.id === "heart-rate-variability") v = Math.max(8, Math.min(80, v));

    const base: DemoBiometricMetric = {
      id: row.id,
      label: row.label,
      shortLabel: row.shortLabel,
      value: row.fmt(v),
      unit: row.unit,
      detail: lineForStatus(st),
      summaryDetail: lineForStatus(st),
      status: st,
    };
    if (row.id === "steps") {
      return { ...base, wide: true };
    }
    return base;
  });
}

export async function loadSyncedHealth(): Promise<SyncedHealthState | null> {
  const raw = await AsyncStorage.getItem(LATEST_BIOMETRICS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SyncedHealthState;
  } catch {
    return null;
  }
}

/** @deprecated Same as {@link loadSyncedHealth} (alias for clarity in docs). */
export const loadLatestBiometrics = loadSyncedHealth;

export async function saveSyncedHealth(state: SyncedHealthState) {
  await AsyncStorage.setItem(LATEST_BIOMETRICS_STORAGE_KEY, JSON.stringify(state));
}

/** @deprecated Same as {@link saveSyncedHealth} (alias for clarity in docs). */
export const saveLatestBiometrics = saveSyncedHealth;

/** Same data path for every vendor; label identifies the device in the UI and API. */
export async function saveSyncedFromSource(
  sourceId: string,
  sourceDisplayName: string,
): Promise<SyncedHealthState> {
  const state: SyncedHealthState = {
    metrics: buildRandomBiometricMetrics(),
    lastSourceId: sourceId,
    lastSourceLabel: sourceDisplayName,
    lastSyncAt: new Date().toISOString(),
    lastSyncStats: buildSyncRunStats(),
  };
  await saveSyncedHealth(state);
  return state;
}

export const DEVICE_SYNC_SOURCES = [
  { id: "apple", label: "Apple Health sync" },
  { id: "garmin", label: "Garmin Watch sync" },
  { id: "oura", label: "Oura Ring sync" },
  { id: "whoop", label: "Whoop sync" },
] as const;

/** Short message for Alert after a device sync (unstable first). */
export function formatDeviceSyncMessage(state: SyncedHealthState): string {
  const unstable = state.metrics.filter((m) => m.status === "attention");
  const head = `${unstable.length} of ${state.metrics.length} vitals are outside range this sync.`;
  const body = unstable
    .map((m) => `• ${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ""} — ${m.detail}`)
    .join("\n");
  return body ? `${head}\n\n${body}` : head;
}
