import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPendingActions, markActionSynced } from "@/lib/offline/db";
import { syncPendingActions } from "@/lib/offline/sync";

vi.mock("@/lib/offline/db", () => ({
  clearSyncedActions: vi.fn(),
  getPendingActions: vi.fn(),
  markActionSynced: vi.fn(),
}));

describe("syncPendingActions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("replays queued portal actions through the portal endpoint", async () => {
    vi.mocked(getPendingActions).mockResolvedValue([
      {
        createdAt: Date.now(),
        id: "pending-1",
        payload: { listingId: "listing-1", subject: "Need details" },
        synced: false,
        type: "create_inquiry",
      },
    ]);

    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncPendingActions();

    expect(result).toEqual({
      errors: [],
      failedCount: 0,
      success: true,
      syncedCount: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${window.location.origin}/api/demo/portal`,
      expect.objectContaining({
        body: JSON.stringify({
          action: "create_inquiry",
          payload: { listingId: "listing-1", subject: "Need details" },
        }),
        method: "POST",
      }),
    );
    expect(markActionSynced).toHaveBeenCalledWith("pending-1");
  });
});
