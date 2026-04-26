import { saveSyncedFromSource, type SyncedHealthState } from "./synced-health-data";

/** Same storage pipeline as Upload device sync. Caller shows the bottom-sheet confirmation. */
export function syncAppleHealthFromProfile(): Promise<SyncedHealthState> {
  return saveSyncedFromSource("apple", "Apple Health sync");
}
