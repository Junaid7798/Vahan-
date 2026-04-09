"use client";

const portalPath = process.env.NEXT_PUBLIC_SUPABASE_URL ? "/api/portal" : "/api/demo/portal";

async function requestPortal(method: "PATCH" | "POST", action: string, payload: object) {
  const response = await fetch(portalPath, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Request failed.");
  }
}

export function postPortalAction(action: string, payload: object) {
  return requestPortal("POST", action, payload);
}

export function patchPortalAction(action: string, payload: object) {
  return requestPortal("PATCH", action, payload);
}
