import { clearSyncedActions, getPendingActions, markActionSynced, type PendingAction } from "./db";

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export async function syncPendingActions(): Promise<SyncResult> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { success: false, syncedCount: 0, failedCount: 0, errors: ["Offline"] };
  }

  const pendingActions = await getPendingActions();
  const unsyncedActions = pendingActions.filter((action) => !action.synced);

  if (unsyncedActions.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  const errors: string[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  for (const action of unsyncedActions) {
    try {
      await syncAction(action);
      await markActionSynced(action.id);
      syncedCount++;
    } catch (error) {
      failedCount++;
      errors.push(`Failed to sync ${action.type}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
    errors,
  };
}

async function syncAction(action: PendingAction): Promise<void> {
  const baseUrl = window.location.origin;
  const portalPath = process.env.NEXT_PUBLIC_SUPABASE_URL ? "/api/portal" : "/api/demo/portal";
  const response = await fetch(`${baseUrl}${portalPath}`, {
    body: JSON.stringify({ action: action.type, payload: action.payload }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Sync failed with status ${response.status}`);
  }
}

export function setupAutoSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => {
    void syncPendingActions().then(() => clearSyncedActions());
  };

  handleOnline();
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}
