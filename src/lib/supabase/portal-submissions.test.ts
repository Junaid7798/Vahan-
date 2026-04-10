import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import {
  createListingFromSellerSubmission,
  editSellerSubmission,
} from "@/lib/supabase/portal-submissions";
import { getSellerSubmissionRow, parseSubmissionMedia } from "@/lib/supabase/portal-submission-records";
import {
  cloneSubmissionMediaAsListingInputs,
  persistSubmissionMedia,
  removeSubmissionMedia,
} from "@/lib/supabase/portal-submission-media";
import { createVehicle } from "@/lib/supabase/portal-vehicles";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-activity", () => ({
  logPortalActivity: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-submission-records", () => ({
  getSellerSubmissionRow: vi.fn(),
  parseSubmissionMedia: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-submission-media", () => ({
  cloneSubmissionMediaAsListingInputs: vi.fn(),
  getSubmissionMediaPaths: vi.fn((items: Array<{ storagePath: string }>) => items.map((item) => item.storagePath)),
  persistSubmissionMedia: vi.fn(),
  removeSubmissionMedia: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-vehicles", () => ({
  createVehicle: vi.fn(),
}));

describe("portal submissions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(logPortalActivity).mockResolvedValue(undefined);
    vi.mocked(removeSubmissionMedia).mockResolvedValue(undefined);
  });

  it("creates a listing from a submission using copied media inputs", async () => {
    const updateEq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq: updateEq }));
    const client = {
      from: vi.fn((table: string) => {
        if (table !== "seller_submissions") {
          throw new Error(`Unexpected table ${table}`);
        }

        return { update };
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);
    vi.mocked(getSellerSubmissionRow).mockResolvedValue({
      asking_price: 850000,
      description: "Single-owner car",
      id: "submission-1",
      linked_listing_id: null,
      location: "Delhi",
      media_paths: [{ displayOrder: 1, storagePath: "submissions/submission-1/car.jpg" }],
      mileage: 20000,
      seller_email: "seller@example.com",
      seller_name: "Seller",
      seller_phone: "9999999999",
      status: "pending",
      updated_at: "2026-04-11T08:00:00.000Z",
      user_id: "user-1",
      vehicle_make: "Honda",
      vehicle_model: "City",
      vehicle_variant: "ZX",
      vehicle_year: 2022,
      created_at: "2026-04-11T07:00:00.000Z",
    });
    vi.mocked(parseSubmissionMedia).mockReturnValue([{ displayOrder: 1, storagePath: "submissions/submission-1/car.jpg" }]);
    vi.mocked(cloneSubmissionMediaAsListingInputs).mockResolvedValue([{ displayOrder: 1, storagePath: "data:image/jpeg;base64,AAAA" }]);
    vi.mocked(createVehicle).mockResolvedValue("listing-1");

    const listingId = await createListingFromSellerSubmission("submission-1", "staff-1");

    expect(listingId).toBe("listing-1");
    expect(createVehicle).toHaveBeenCalledWith(
      expect.objectContaining({
        conditionNotes: "Single-owner car",
        highlights: "2022 Honda City ZX",
        location: "Delhi",
        make: "Honda",
        media: [{ displayOrder: 1, storagePath: "data:image/jpeg;base64,AAAA" }],
        model: "City",
        status: "draft",
        targetSellingPrice: 850000,
        variant: "ZX",
        year: 2022,
      }),
      "staff-1",
    );
    expect(update).toHaveBeenCalledWith({ linked_listing_id: "listing-1", status: "reviewed" });
    expect(updateEq).toHaveBeenCalledWith("id", "submission-1");
    expect(logPortalActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "seller_submission_converted",
        entityId: "submission-1",
        userId: "staff-1",
      }),
    );
  });

  it("resets a user-edited submission back to pending and removes replaced media", async () => {
    const updateEq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq: updateEq }));
    const client = {
      from: vi.fn((table: string) => {
        if (table !== "seller_submissions") {
          throw new Error(`Unexpected table ${table}`);
        }

        return { update };
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);
    vi.mocked(getSellerSubmissionRow).mockResolvedValue({
      asking_price: 700000,
      created_at: "2026-04-11T07:00:00.000Z",
      description: "Old notes",
      id: "submission-2",
      linked_listing_id: null,
      location: "Gurugram",
      media_paths: [{ displayOrder: 1, storagePath: "submissions/submission-2/old.jpg" }],
      mileage: 12000,
      seller_email: "seller@example.com",
      seller_name: "Seller",
      seller_phone: "9999999999",
      status: "changes_requested",
      updated_at: "2026-04-11T08:00:00.000Z",
      user_id: "user-1",
      vehicle_make: "Maruti",
      vehicle_model: "Baleno",
      vehicle_variant: null,
      vehicle_year: 2021,
    });
    vi.mocked(parseSubmissionMedia).mockReturnValue([{ displayOrder: 1, storagePath: "submissions/submission-2/old.jpg" }]);
    vi.mocked(persistSubmissionMedia).mockResolvedValue({
      items: [{ displayOrder: 1, storagePath: "submissions/submission-2/new.jpg" }],
      newPaths: ["submissions/submission-2/new.jpg"],
    });

    await editSellerSubmission({
      actorId: "user-1",
      canManageVehicles: false,
      data: {
        description: "Updated notes",
        make: "Maruti",
        media: [{ displayOrder: 1, storagePath: "data:image/jpeg;base64,BBBB" }],
        model: "Baleno",
        phone: "9999999999",
        sellerName: "Seller",
        year: 2021,
      },
      submissionId: "submission-2",
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Updated notes",
        media_paths: [{ displayOrder: 1, storagePath: "submissions/submission-2/new.jpg" }],
        seller_name: "Seller",
        status: "pending",
      }),
    );
    expect(removeSubmissionMedia).toHaveBeenCalledWith(["submissions/submission-2/old.jpg"]);
    expect(logPortalActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "seller_submission_updated",
        entityId: "submission-2",
        userId: "user-1",
      }),
    );
  });
});
