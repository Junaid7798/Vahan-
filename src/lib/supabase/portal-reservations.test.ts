import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import { createReservation, updateReservationStatus } from "@/lib/supabase/portal-reservations";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-activity", () => ({
  logPortalActivity: vi.fn(),
}));

function createMaybeSingleBuilder<T>(result: T | null) {
  const builder = {
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
  };

  return builder;
}

function createSelectSingleUpdateBuilder<T>(result: T | null) {
  const builder = {
    eq: vi.fn(() => builder),
    select: vi.fn(() => ({
      single: vi.fn(async () => ({ data: result, error: null })),
    })),
  };

  return builder;
}

function createFinalUpdateChain(filterCount: number, result: { error: { message: string } | null }) {
  let remaining = filterCount;
  const builder = {
    eq: vi.fn(() => {
      remaining -= 1;
      return remaining === 0 ? Promise.resolve(result) : builder;
    }),
    neq: vi.fn(() => {
      remaining -= 1;
      return remaining === 0 ? Promise.resolve(result) : builder;
    }),
  };

  return builder;
}

describe("portal reservations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(logPortalActivity).mockResolvedValue(undefined);
  });

  it("rejects duplicate active reservation requests for the same user and listing", async () => {
    const inserts: Array<Record<string, unknown>> = [];
    const listingLookup = createMaybeSingleBuilder({ id: "listing-1", status: "published" });
    const existingRequestLookup = createMaybeSingleBuilder({ id: "reservation-1", status: "pending" });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "vehicle_listings") {
          return {
            select: vi.fn(() => listingLookup),
          };
        }

        if (table === "reservation_requests") {
          return {
            insert: vi.fn((value: Record<string, unknown>) => {
              inserts.push(value);
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: { id: "reservation-2" }, error: null })),
                })),
              };
            }),
            select: vi.fn(() => existingRequestLookup),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);

    await expect(
      createReservation({ listingId: "listing-1", message: "Reserve this", userId: "user-1" })
    ).rejects.toThrow("You already have an active reservation request for this vehicle.");
    expect(inserts).toEqual([]);
  });

  it("rejects competing pending requests when one reservation is approved", async () => {
    const reservationUpdates: Array<Record<string, unknown>> = [];
    const listingUpdates: Array<Record<string, unknown>> = [];

    const reservationSelection = createSelectSingleUpdateBuilder({ id: "reservation-1", listing_id: "listing-1" });
    const competingRejection = createFinalUpdateChain(3, { error: null });
    const listingUpdate = createFinalUpdateChain(1, { error: null });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "reservation_requests") {
          return {
            update: vi.fn((value: Record<string, unknown>) => {
              reservationUpdates.push(value);
              return value.status === "approved" ? reservationSelection : competingRejection;
            }),
          };
        }

        if (table === "vehicle_listings") {
          return {
            update: vi.fn((value: Record<string, unknown>) => {
              listingUpdates.push(value);
              return listingUpdate;
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);

    await updateReservationStatus("reservation-1", "approved", "staff-1");

    expect(reservationUpdates).toContainEqual({ status: "approved" });
    expect(reservationUpdates).toContainEqual({ status: "rejected" });
    expect(listingUpdates).toEqual([{ sold_at: null, status: "reserved" }]);
  });
});
