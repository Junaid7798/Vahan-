import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import { sendChatMessage } from "@/lib/supabase/portal-chat";
import { uploadVoiceNote } from "@/lib/supabase/portal-storage";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-activity", () => ({
  logPortalActivity: vi.fn(),
}));

vi.mock("@/lib/supabase/portal-storage", () => ({
  uploadVoiceNote: vi.fn(),
}));

function createMaybeSingleBuilder<T>(result: T | null) {
  const builder = {
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
  };

  return builder;
}

function createEqChain(eqCount: number, result: { error: { message: string } | null }) {
  let remaining = eqCount;
  const builder = {
    eq: vi.fn(() => {
      remaining -= 1;
      return remaining === 0 ? Promise.resolve(result) : builder;
    }),
  };

  return builder;
}

describe("sendChatMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("adds a staff sender as a participant before sending a reply", async () => {
    const insertedParticipants: Array<Record<string, unknown>> = [];
    const insertedMessages: Array<Record<string, unknown>> = [];
    const participantLookup = createMaybeSingleBuilder(null);
    const roleLookup = createMaybeSingleBuilder({ role: "manager" });
    const threadUpdate = createEqChain(1, { error: null });
    const participantUpdate = createEqChain(2, { error: null });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "chat_participants") {
          return {
            insert: vi.fn(async (value: Record<string, unknown>) => {
              insertedParticipants.push(value);
              return { error: null };
            }),
            select: vi.fn(() => participantLookup),
            update: vi.fn(() => participantUpdate),
          };
        }

        if (table === "user_profiles") {
          return {
            select: vi.fn(() => roleLookup),
          };
        }

        if (table === "chat_messages") {
          return {
            insert: vi.fn((value: Record<string, unknown>) => {
              insertedMessages.push(value);
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: { id: "message-1" }, error: null })),
                })),
              };
            }),
          };
        }

        if (table === "chat_threads") {
          return {
            update: vi.fn(() => threadUpdate),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);
    vi.mocked(uploadVoiceNote).mockResolvedValue("voice-note-path");
    vi.mocked(logPortalActivity).mockResolvedValue(undefined);

    await sendChatMessage({
      content: "Checking in",
      messageType: "text",
      senderId: "staff-1",
      threadId: "thread-1",
    });

    expect(insertedParticipants).toEqual([
      expect.objectContaining({
        last_read_at: expect.any(String),
        role: "manager",
        thread_id: "thread-1",
        user_id: "staff-1",
      }),
    ]);
    expect(insertedMessages).toEqual([
      expect.objectContaining({
        content: "Checking in",
        message_type: "text",
        sender_id: "staff-1",
        thread_id: "thread-1",
      }),
    ]);
  });
});
