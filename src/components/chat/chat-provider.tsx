"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser-client";

interface ChatThread {
  id: string;
  thread_type: "support" | "vehicle";
  listing_id?: string;
  vehicle_info?: string;
  status: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  message_type: "text" | "voice" | "image";
  content?: string;
  voice_note_path?: string;
  voice_duration?: number;
  image_url?: string;
  created_at: string;
  is_own: boolean;
}

interface ChatContextType {
  threads: ChatThread[];
  currentThread: ChatThread | null;
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, type: "text" | "voice", voiceBlob?: Blob) => Promise<void>;
  createThread: (type: "support" | "vehicle", listingId?: string) => Promise<ChatThread | null>;
  selectThread: (threadId: string) => Promise<void>;
  markAsRead: (threadId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const markAsRead = useCallback(
    async (threadId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from("chat_participants")
        .update({ last_read_at: timestamp })
        .eq("thread_id", threadId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error marking thread as read:", error);
        return;
      }

      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId ? { ...thread, unread_count: 0, last_message_time: thread.last_message_time } : thread
        )
      );
      setCurrentThread((current) =>
        current?.id === threadId ? { ...current, unread_count: 0 } : current
      );
    },
    [supabase]
  );

  const loadThreads = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setThreads([]);
        return;
      }

      const { data: participantData, error: participantError } = await supabase
        .from("chat_participants")
        .select("thread_id, last_read_at")
        .eq("user_id", user.id);

      if (participantError) {
        console.error("Error loading thread participants:", participantError);
        return;
      }

      if (!participantData?.length) {
        setThreads([]);
        return;
      }

      const lastReadByThread = new Map(
        participantData.map((participant) => [participant.thread_id as string, participant.last_read_at as string | null])
      );

      const { data: threadData, error: threadError } = await supabase
        .from("chat_threads")
        .select("id, thread_type, listing_id, status, updated_at")
        .in(
          "id",
          participantData.map((participant) => participant.thread_id)
        )
        .order("updated_at", { ascending: false });

      if (threadError) {
        console.error("Error loading threads:", threadError);
        return;
      }

      if (!threadData?.length) {
        setThreads([]);
        return;
      }

      const summaries = await Promise.all(
        threadData.map(async (thread) => {
          const lastReadAt = lastReadByThread.get(thread.id) ?? null;
          let unreadQuery = supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("thread_id", thread.id)
            .neq("sender_id", user.id);

          if (lastReadAt) {
            unreadQuery = unreadQuery.gt("created_at", lastReadAt);
          }

          const [{ count }, { data: lastMessages, error: lastMessageError }] = await Promise.all([
            unreadQuery,
            supabase
              .from("chat_messages")
              .select("content, created_at")
              .eq("thread_id", thread.id)
              .order("created_at", { ascending: false })
              .limit(1),
          ]);

          if (lastMessageError) {
            console.error("Error loading last message:", lastMessageError);
          }

          const lastMessage = lastMessages?.[0];

          return {
            id: thread.id,
            thread_type: thread.thread_type as "support" | "vehicle",
            listing_id: thread.listing_id ?? undefined,
            vehicle_info: undefined,
            status: thread.status,
            last_message: lastMessage?.content ?? undefined,
            last_message_time: lastMessage?.created_at ?? undefined,
            unread_count: count ?? 0,
          } satisfies ChatThread;
        })
      );

      setThreads(summaries);
    } catch (error) {
      console.error("Error loading threads:", error);
    }
  }, [supabase]);

  const loadMessages = useCallback(
    async (threadId: string) => {
      setIsLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMessages([]);
          return;
        }

        const { data: messageData, error: messageError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });

        if (messageError) {
          console.error("Error loading messages:", messageError);
          return;
        }

        if (!messageData?.length) {
          setMessages([]);
          return;
        }

        const uniqueSenderIds = [...new Set(messageData.map((message) => message.sender_id))];
        const { data: userProfiles, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, full_name")
          .in("id", uniqueSenderIds);

        if (profileError) {
          console.error("Error loading sender profiles:", profileError);
        }

        const profileMap = new Map(userProfiles?.map((profile) => [profile.id, profile.full_name]) ?? []);

        setMessages(
          messageData.map((message) => ({
            ...message,
            sender_name: profileMap.get(message.sender_id) ?? "Unknown",
            is_own: message.sender_id === user.id,
            message_type: message.message_type as "text" | "voice" | "image",
          }))
        );
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const selectThread = useCallback(
    async (threadId: string) => {
      const thread = threads.find((item) => item.id === threadId) ?? null;
      setCurrentThread(thread);

      if (!thread) {
        setMessages([]);
        return;
      }

      await Promise.all([loadMessages(threadId), markAsRead(threadId)]);
    },
    [loadMessages, markAsRead, threads]
  );

  const createThread = useCallback(
    async (type: "support" | "vehicle", listingId?: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: threadData, error: threadError } = await supabase
          .from("chat_threads")
          .insert({
            thread_type: type,
            listing_id: listingId ?? null,
            status: "open",
          })
          .select("id, thread_type, listing_id, status")
          .single();

        if (threadError || !threadData) {
          console.error("Error creating thread:", threadError);
          return null;
        }

        const { error: participantError } = await supabase.from("chat_participants").insert({
          thread_id: threadData.id,
          user_id: user.id,
          role: "user",
        });

        if (participantError) {
          console.error("Error adding chat participant:", participantError);
          return null;
        }

        const newThread: ChatThread = {
          id: threadData.id,
          thread_type: threadData.thread_type as "support" | "vehicle",
          listing_id: threadData.listing_id ?? undefined,
          vehicle_info: undefined,
          status: threadData.status,
          unread_count: 0,
        };

        setThreads((current) => [newThread, ...current]);
        return newThread;
      } catch (error) {
        console.error("Error creating thread:", error);
        return null;
      }
    },
    [supabase]
  );

  const sendMessage = useCallback(
    async (content: string, type: "text" | "voice", voiceBlob?: Blob) => {
      if (!currentThread) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const messageData: { content?: string; voice_note_path?: string } = {};

        if (type === "voice" && voiceBlob) {
          const fileName = `${user.id}/${Date.now()}.webm`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("voice-notes")
            .upload(fileName, voiceBlob);

          if (uploadError || !uploadData) {
            console.error("Error uploading voice note:", uploadError);
            return;
          }

          messageData.voice_note_path = uploadData.path;
        } else {
          messageData.content = content;
        }

        const { data: message, error: messageError } = await supabase
          .from("chat_messages")
          .insert({
            thread_id: currentThread.id,
            sender_id: user.id,
            message_type: type,
            ...messageData,
          })
          .select("*")
          .single();

        if (messageError || !message) {
          console.error("Error sending message:", messageError);
          return;
        }

        await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", currentThread.id);

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        setMessages((current) => [
          ...current,
          {
            ...message,
            sender_name: profile?.full_name ?? "You",
            is_own: true,
            message_type: type,
          },
        ]);

        await loadThreads();
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [currentThread, loadThreads, supabase]
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  return (
    <ChatContext.Provider
      value={{
        threads,
        currentThread,
        messages,
        isLoading,
        sendMessage,
        createThread,
        selectThread,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
}
