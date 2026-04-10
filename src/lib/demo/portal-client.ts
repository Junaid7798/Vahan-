"use client";

import { addPendingAction, type PendingAction } from "@/lib/offline/db";

const portalPath = process.env.NEXT_PUBLIC_SUPABASE_URL ? "/api/portal" : "/api/demo/portal";

const queueableActions: PendingAction["type"][] = [
  "create_inquiry",
  "create_resale",
  "create_reservation",
  "send_chat_message",
];

export interface PortalActionResult {
  queued: boolean;
}

function isQueueableAction(action: string): action is PendingAction["type"] {
  return queueableActions.includes(action as PendingAction["type"]);
}

async function queuePendingPortalAction(action: PendingAction["type"], payload: object): Promise<PortalActionResult> {
  await addPendingAction({
    createdAt: Date.now(),
    id: crypto.randomUUID(),
    payload,
    synced: false,
    type: action,
  });

  return { queued: true };
}

async function requestPortal(method: "PATCH" | "POST", action: string, payload: object): Promise<PortalActionResult> {
  const shouldQueue = method === "POST" && isQueueableAction(action);
  if (shouldQueue && typeof navigator !== "undefined" && !navigator.onLine) {
    return queuePendingPortalAction(action, payload);
  }

  try {
    const response = await fetch(portalPath, {
      body: JSON.stringify({ action, payload }),
      headers: { "Content-Type": "application/json" },
      method,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Request failed.");
    }

    return { queued: false };
  } catch (error) {
    if (shouldQueue && error instanceof TypeError) {
      return queuePendingPortalAction(action, payload);
    }

    throw error;
  }
}

export function postPortalAction(action: string, payload: object) {
  return requestPortal("POST", action, payload);
}

export function patchPortalAction(action: string, payload: object) {
  return requestPortal("PATCH", action, payload);
}
