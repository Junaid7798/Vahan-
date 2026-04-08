import { DemoPortalActivityRecord, DemoPortalState } from "@/lib/demo/portal-types";

export function createPortalId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function addActivity(state: DemoPortalState, title: string, description: string) {
  const activity: DemoPortalActivityRecord = {
    id: createPortalId("activity"),
    title,
    description,
    createdAt: nowIso(),
  };

  return [activity, ...state.activities].slice(0, 20);
}

export function reorderWaitlistPositions(state: DemoPortalState, listingId: string) {
  const activeEntries = state.waitlist
    .filter((entry) => entry.listingId === listingId && entry.status === "active")
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  activeEntries.forEach((entry, index) => {
    entry.position = index + 1;
  });
}
