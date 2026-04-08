import { openDB, type IDBPDatabase } from "idb";

export interface OfflineVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  variant: string;
  color: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  location: string;
  status: "available" | "reserved" | "sold";
  images: string[];
  createdAt: number;
  synced: boolean;
}

export interface PendingAction {
  id: string;
  type: "inquiry" | "reservation" | "resale" | "message";
  payload: unknown;
  createdAt: number;
  synced: boolean;
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB("vehicle-portal-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("vehicles")) {
        const vehicleStore = db.createObjectStore("vehicles", { keyPath: "id" });
        vehicleStore.createIndex("by-synced", "synced");
        vehicleStore.createIndex("by-status", "status");
      }

      if (!db.objectStoreNames.contains("pending-actions")) {
        const actionStore = db.createObjectStore("pending-actions", { keyPath: "id" });
        actionStore.createIndex("by-synced", "synced");
        actionStore.createIndex("by-type", "type");
      }

      if (!db.objectStoreNames.contains("user-session")) {
        db.createObjectStore("user-session", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
}

export async function cacheVehicle(vehicle: OfflineVehicle): Promise<void> {
  const db = await getDB();
  await db.put("vehicles", { ...vehicle, synced: true });
}

export async function getCachedVehicles(): Promise<OfflineVehicle[]> {
  const db = await getDB();
  return db.getAll("vehicles");
}

export async function getCachedVehiclesByStatus(status: OfflineVehicle["status"]): Promise<OfflineVehicle[]> {
  const db = await getDB();
  const tx = db.transaction("vehicles", "readonly");
  const index = tx.store.index("by-status");
  return index.getAll(status);
}

export async function addPendingAction(action: PendingAction): Promise<void> {
  const db = await getDB();
  await db.put("pending-actions", action);
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDB();
  return db.getAll("pending-actions");
}

export async function getPendingActionsByType(type: PendingAction["type"]): Promise<PendingAction[]> {
  const db = await getDB();
  const tx = db.transaction("pending-actions", "readonly");
  const index = tx.store.index("by-type");
  return index.getAll(type);
}

export async function markActionSynced(id: string): Promise<void> {
  const db = await getDB();
  const action = await db.get("pending-actions", id);
  if (action) {
    await db.put("pending-actions", { ...action, synced: true });
  }
}

export async function clearSyncedActions(): Promise<void> {
  const db = await getDB();
  const actions = await db.getAll("pending-actions");
  const tx = db.transaction("pending-actions", "readwrite");
  
  for (const action of actions) {
    if (action.synced) {
      await tx.store.delete(action.id);
    }
  }
  await tx.done;
}

export async function saveUserSession(user: { id: string; email: string; role: string; approved: boolean }): Promise<void> {
  const db = await getDB();
  await db.put("user-session", { ...user, updatedAt: Date.now() });
}

export async function getUserSession(): Promise<{ id: string; email: string; role: string; approved: boolean } | null> {
  const db = await getDB();
  const sessions = await db.getAll("user-session");
  return sessions[0] || null;
}

export async function clearUserSession(): Promise<void> {
  const db = await getDB();
  await db.clear("user-session");
}