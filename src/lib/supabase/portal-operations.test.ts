import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getChatForViewer } from "@/lib/supabase/portal-operations";
import { getVehicleCatalog } from "@/lib/supabase/portal-catalog";
import { resolveStorageUrl } from "@/lib/supabase/portal-media";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-catalog", () => ({
  getVehicleCatalog: vi.fn(),
  getVehicleRecord: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-media", () => ({
  resolveStorageUrl: vi.fn(),
}));

function createSelectBuilder<T extends Record<string, unknown>>(rows: T[]) {
  const filters: Array<(row: T) => boolean> = [];
  const builder = {
    eq: vi.fn((column: keyof T, value: T[keyof T]) => {
      filters.push((row) => row[column] === value);
      return builder;
    }),
    in: vi.fn((column: keyof T, values: T[keyof T][]) => {
      filters.push((row) => values.includes(row[column]));
      return builder;
    }),
    maybeSingle: vi.fn(async () => ({
      data: rows.filter((row) => filters.every((filter) => filter(row)))[0] ?? null,
      error: null,
    })),
    order: vi.fn(() => builder),
    then<TResult1 = { data: T[]; error: null }, TResult2 = never>(
      onfulfilled?: ((value: { data: T[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      const data = rows.filter((row) => filters.every((filter) => filter(row)));
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

describe("getChatForViewer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getVehicleCatalog).mockResolvedValue({ listings: [], media: [], records: [], vehicles: [] });
    vi.mocked(resolveStorageUrl).mockImplementation(async (_bucket, path) => path ?? null);
  });

  it("uses the viewer read state when calculating staff unread counts", async () => {
    const client = {
      from: vi.fn((table: string) => {
        if (table === "chat_participants") {
          return {
            select: vi.fn(() =>
              createSelectBuilder([
                { thread_id: "thread-1", user_id: "staff-1", last_read_at: "2026-04-10T09:00:00.000Z" },
                { thread_id: "thread-1", user_id: "user-1", last_read_at: "2026-04-10T10:00:00.000Z" },
              ])
            ),
          };
        }

        if (table === "chat_threads") {
          return {
            select: vi.fn(() =>
              createSelectBuilder([
                {
                  id: "thread-1",
                  listing_id: null,
                  status: "open",
                  thread_type: "support",
                  updated_at: "2026-04-10T10:00:00.000Z",
                },
              ])
            ),
          };
        }

        if (table === "chat_messages") {
          return {
            select: vi.fn(() =>
              createSelectBuilder([
                {
                  id: "message-1",
                  thread_id: "thread-1",
                  sender_id: "user-1",
                  message_type: "text",
                  content: "Need help",
                  voice_note_path: null,
                  voice_duration: null,
                  created_at: "2026-04-10T09:30:00.000Z",
                },
              ])
            ),
          };
        }

        if (table === "user_profiles") {
          return {
            select: vi.fn(() =>
              createSelectBuilder([
                { id: "staff-1", full_name: "Staff" },
                { id: "user-1", full_name: "Buyer" },
              ])
            ),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);

    const result = await getChatForViewer("staff-1", true);

    expect(result.threads[0]?.unreadCount).toBe(1);
  });
});
