import { beforeEach, describe, expect, it, vi } from "vitest";
import { addPendingAction } from "@/lib/offline/db";
import { postPortalAction } from "@/lib/demo/portal-client";

vi.mock("@/lib/offline/db", () => ({
  addPendingAction: vi.fn(),
}));

describe("portal client offline queue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("queues supported portal actions when the browser is offline", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const result = await postPortalAction("create_inquiry", { listingId: "listing-1" });

    expect(result).toEqual({ queued: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(addPendingAction).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { listingId: "listing-1" },
        synced: false,
        type: "create_inquiry",
      }),
    );
  });
});
