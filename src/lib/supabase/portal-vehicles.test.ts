import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import { createVehicle } from "@/lib/supabase/portal-vehicles";
import { removeVehicleMedia, uploadVehicleMedia } from "@/lib/supabase/portal-storage";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-activity", () => ({
  logPortalActivity: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-storage", () => ({
  removeVehicleMedia: vi.fn(),
  uploadVehicleMedia: vi.fn(),
}));

describe("createVehicle", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(logPortalActivity).mockResolvedValue(undefined);
    vi.mocked(removeVehicleMedia).mockResolvedValue(undefined);
  });

  it("rolls back the created listing and vehicle when media persistence fails", async () => {
    const deletedListings: string[] = [];
    const deletedVehicles: string[] = [];

    const client = {
      from: vi.fn((table: string) => {
        if (table === "vehicles") {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(async (_column: string, value: string) => {
                deletedVehicles.push(value);
                return { error: null };
              }),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "vehicle-1" }, error: null })),
              })),
            })),
          };
        }

        if (table === "vehicle_listings") {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(async (_column: string, value: string) => {
                deletedListings.push(value);
                return { error: null };
              }),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "listing-1" }, error: null })),
              })),
            })),
            select: vi.fn(async () => ({ data: [{ stock_id: "VH-200" }], error: null })),
          };
        }

        if (table === "vehicle_media") {
          return {
            insert: vi.fn(async () => ({ error: { message: "media insert failed" } })),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);
    vi.mocked(uploadVehicleMedia).mockResolvedValue([{ displayOrder: 0, storagePath: "listing-1/photo.jpg" }]);

    await expect(
      createVehicle(
        {
          make: "Honda",
          media: [{ displayOrder: 0, storagePath: "data:image/png;base64,AAAA" }],
          model: "City",
          status: "published",
          year: 2023,
        },
        "staff-1"
      )
    ).rejects.toThrow("media insert failed");

    expect(removeVehicleMedia).toHaveBeenCalledWith(["listing-1/photo.jpg"]);
    expect(deletedListings).toEqual(["listing-1"]);
    expect(deletedVehicles).toEqual(["vehicle-1"]);
    expect(logPortalActivity).not.toHaveBeenCalled();
  });
});
