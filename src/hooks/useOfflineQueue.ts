"use client";

import { useEffect, useState, useCallback } from "react";
import {
  addPendingAction,
  getPendingActions,
  type PendingAction,
} from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/sync";

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingCount(actions.filter((a) => !a.synced).length);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  const addAction = useCallback(
    async (type: PendingAction["type"], payload: unknown) => {
      const action: PendingAction = {
        id: crypto.randomUUID(),
        type,
        payload,
        createdAt: Date.now(),
        synced: false,
      };

      await addPendingAction(action);
      await refreshCount();

      if (isOnline()) {
        setIsSyncing(true);
        try {
          const { syncPendingActions } = await import("@/lib/offline/sync");
          await syncPendingActions();
        } finally {
          setIsSyncing(false);
          await refreshCount();
        }
      }

      return action;
    },
    [refreshCount]
  );

  return {
    pendingCount,
    isSyncing,
    addAction,
    refreshCount,
  };
}