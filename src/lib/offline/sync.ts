import { getPendingActions, markActionSynced, type PendingAction } from "./db";

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
  let response: Response;

  switch (action.type) {
    case "inquiry":
      response = await fetch(`${baseUrl}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });
      break;

    case "reservation":
      response = await fetch(`${baseUrl}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });
      break;

    case "resale":
      response = await fetch(`${baseUrl}/api/resale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });
      break;

    case "message":
      response = await fetch(`${baseUrl}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });
      break;

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }

  if (!response.ok) {
    throw new Error(`Sync failed with status ${response.status}`);
  }
}

export function setupAutoSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => {
    void syncPendingActions();
  };

  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}
