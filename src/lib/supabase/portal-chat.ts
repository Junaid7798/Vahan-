import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { logPortalActivity } from "@/lib/supabase/portal-activity";
import { uploadVoiceNote } from "@/lib/supabase/portal-storage";

interface CreateThreadInput {
  listingId?: string;
  threadType: "support" | "vehicle";
  title?: string;
  userId: string;
}

interface SendMessageInput {
  content?: string;
  messageType: "text" | "voice" | "image";
  senderId: string;
  threadId: string;
  voiceDuration?: number;
}

async function ensureParticipant(threadId: string, userId: string) {
  const client = createAdminClient();
  const { data: participant, error: participantError } = await client
    .from("chat_participants")
    .select("id")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (participantError) {
    throw new Error(participantError.message);
  }

  if (participant) {
    return;
  }

  const { data: profile, error: profileError } = await client
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const role = profile?.role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("You are not a participant in this thread.");
  }

  const { error: insertError } = await client.from("chat_participants").insert({
    thread_id: threadId,
    user_id: userId,
    role,
    last_read_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function createOrGetChatThread(input: CreateThreadInput) {
  const client = createAdminClient();
  const { data: existingParticipantRows, error: existingError } = await client
    .from("chat_participants")
    .select("thread_id, chat_threads!inner(id, thread_type, listing_id)")
    .eq("user_id", input.userId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existing = (existingParticipantRows ?? []).find((item) => {
    const thread = Array.isArray(item.chat_threads) ? item.chat_threads[0] : item.chat_threads;
    return thread?.thread_type === input.threadType && (thread?.listing_id ?? null) === (input.listingId ?? null);
  });

  if (existing) {
    return existing.thread_id;
  }

  const { data: thread, error: threadError } = await client
    .from("chat_threads")
    .insert({
      listing_id: input.listingId ?? null,
      status: "open",
      thread_type: input.threadType,
    })
    .select("id")
    .single();

  if (threadError || !thread) {
    throw new Error(threadError?.message ?? "Failed to create chat thread.");
  }

  const { error: participantError } = await client.from("chat_participants").insert({
    thread_id: thread.id,
    user_id: input.userId,
    role: "user",
    last_read_at: new Date().toISOString(),
  });

  if (participantError) {
    throw new Error(participantError.message);
  }

  await logPortalActivity({
    action: "chat_thread_created",
    details: { title: input.title ?? null, threadType: input.threadType },
    entityId: thread.id,
    entityType: "chat_threads",
    userId: input.userId,
  });

  return thread.id;
}

export async function sendChatMessage(input: SendMessageInput) {
  const client = createAdminClient();
  await ensureParticipant(input.threadId, input.senderId);

  const voiceNotePath =
    input.messageType === "voice" && input.content ? await uploadVoiceNote(input.senderId, input.content) : null;

  const { data: message, error } = await client
    .from("chat_messages")
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      message_type: input.messageType,
      content: input.messageType === "text" ? input.content ?? null : null,
      voice_note_path: voiceNotePath,
      voice_duration: input.voiceDuration ?? null,
    })
    .select("id")
    .single();

  if (error || !message) {
    throw new Error(error?.message ?? "Failed to send chat message.");
  }

  const timestamp = new Date().toISOString();
  const { error: threadError } = await client
    .from("chat_threads")
    .update({ updated_at: timestamp })
    .eq("id", input.threadId);

  if (threadError) {
    throw new Error(threadError.message);
  }

  await client
    .from("chat_participants")
    .update({ last_read_at: timestamp })
    .eq("thread_id", input.threadId)
    .eq("user_id", input.senderId);

  await logPortalActivity({
    action: "chat_message_sent",
    details: { messageType: input.messageType },
    entityId: message.id,
    entityType: "chat_messages",
    userId: input.senderId,
  });
}

export async function closeChatThread(threadId: string, actorId: string) {
  const client = createAdminClient();
  const { error } = await client
    .from("chat_threads")
    .update({ status: "closed" })
    .eq("id", threadId);

  if (error) {
    throw new Error(error.message);
  }

  await logPortalActivity({
    action: "chat_thread_closed",
    entityId: threadId,
    entityType: "chat_threads",
    userId: actorId,
  });
}
