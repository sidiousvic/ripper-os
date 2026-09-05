export const TRAINING_SNAPSHOT_KEY = "ripper-os-training-data-v3";

/**
 * Persistence must never prevent the current dashboard from updating.
 * @param {string} serialized
 * @param {() => Pick<Storage, "setItem" | "removeItem">} getStorage
 * @returns {"saved" | "too-large" | "unavailable"}
 */
export function saveTrainingSnapshot(serialized, getStorage) {
  try {
    const storage = getStorage();
    if (serialized.length > 4_000_000) {
      storage.removeItem(TRAINING_SNAPSHOT_KEY);
      return "too-large";
    }
    try { storage.setItem(TRAINING_SNAPSHOT_KEY, serialized); }
    catch {
      // Remove the previous export so a failed replacement cannot restore it
      // on refresh. Retry once after freeing its storage allocation.
      storage.removeItem(TRAINING_SNAPSHOT_KEY);
      storage.setItem(TRAINING_SNAPSHOT_KEY, serialized);
    }
    return "saved";
  } catch { return "unavailable"; }
}
