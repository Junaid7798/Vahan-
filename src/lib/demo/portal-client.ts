"use client";

async function requestPortal(method: "PATCH" | "POST", action: string, payload: object) {
  const response = await fetch("/api/demo/portal", {
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
