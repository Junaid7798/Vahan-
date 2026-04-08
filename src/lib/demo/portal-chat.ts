import { updatePortalStore } from "@/lib/demo/portal-store";
import { ChatMessageRecord, ChatThreadRecord } from "@/lib/demo/portal-types";
import { createPortalId, addActivity, nowIso } from "@/lib/demo/portal-utils";
import { getVehicleRecord } from "@/lib/demo/portal-catalog";

export async function createOrGetDemoThread(input: {
  listingId?: string;
  title?: string;
  threadType: ChatThreadRecord["threadType"];
  userId: string;
}) {
  return updatePortalStore(async (state) => {
    const existingThread = state.threads.find(
      (thread) =>
        thread.userId === input.userId &&
        thread.threadType === input.threadType &&
        thread.listingId === input.listingId
    );

    if (existingThread) {
      return state;
    }

    const record = input.listingId ? await getVehicleRecord(input.listingId) : null;
    const thread: ChatThreadRecord = {
      id: createPortalId("thread"),
      userId: input.userId,
      threadType: input.threadType,
      status: "open",
      title: input.title ?? (record ? `${record.year} ${record.make} ${record.model}` : "General Support"),
      listingId: input.listingId,
      updatedAt: nowIso(),
      unreadCount: 0,
    };

    return {
      ...state,
      threads: [thread, ...state.threads],
      activities: addActivity(state, "Chat opened", `${thread.title} thread is now active.`),
    };
  });
}

export async function sendDemoChatMessage(input: {
  content?: string;
  messageType: ChatMessageRecord["messageType"];
  senderId: string;
  senderName: string;
  threadId: string;
  voiceDuration?: number;
}) {
  return updatePortalStore((state) => {
    const thread = state.threads.find((item) => item.id === input.threadId);
    if (!thread) {
      throw new Error("Chat thread not found.");
    }

    const message: ChatMessageRecord = {
      id: createPortalId("msg"),
      threadId: input.threadId,
      senderId: input.senderId,
      senderName: input.senderName,
      messageType: input.messageType,
      content: input.content,
      voiceDuration: input.voiceDuration,
      createdAt: nowIso(),
    };

    thread.updatedAt = message.createdAt;
    thread.unreadCount = input.senderId === thread.userId ? 1 : 0;

    return {
      ...state,
      threads: [...state.threads],
      messages: [...state.messages, message],
      activities: addActivity(state, "Chat updated", `A new ${input.messageType} message was sent in ${thread.title}.`),
    };
  });
}

export async function markDemoThreadClosed(threadId: string) {
  return updatePortalStore((state) => {
    const thread = state.threads.find((item) => item.id === threadId);
    if (!thread) {
      throw new Error("Chat thread not found.");
    }

    thread.status = "closed";

    return {
      ...state,
      threads: [...state.threads],
      activities: addActivity(state, "Chat closed", `${thread.title} was closed.`),
    };
  });
}
