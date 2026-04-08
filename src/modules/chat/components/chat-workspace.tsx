"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ChatThreadList, ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { postPortalAction, patchPortalAction } from "@/lib/demo/portal-client";
import { toast } from "@/hooks/use-toast";

interface ChatWorkspaceProps {
  initialThreadId?: string;
  isStaff?: boolean;
  messages: Array<{
    id: string;
    threadId: string;
    senderId: string;
    senderName: string;
    messageType: "text" | "voice" | "image";
    content?: string;
    voiceDuration?: number;
    imageUrl?: string;
    createdAt: string;
  }>;
  threads: Array<{
    id: string;
    listingId?: string;
    status: "open" | "closed";
    threadType: "support" | "vehicle";
    title: string;
    unreadCount: number;
    updatedAt: string;
  }>;
  viewerId: string;
}

export function ChatWorkspace({ initialThreadId, isStaff = false, messages, threads, viewerId }: ChatWorkspaceProps) {
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId ?? threads[0]?.id);
  const [localThreads, setLocalThreads] = useState(threads);
  const [localMessages, setLocalMessages] = useState(messages);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const chatT = useTranslations("chat");

  const activeThread = useMemo(() => localThreads.find((thread) => thread.id === selectedThreadId) ?? localThreads[0], [selectedThreadId, localThreads]);
  const activeMessages = useMemo(
    () => localMessages.filter((message) => message.threadId === activeThread?.id).map((message) => ({
      id: message.id,
      sender_id: message.senderId,
      sender_name: message.senderName,
      message_type: message.messageType,
      content: message.content,
      voice_duration: message.voiceDuration,
      image_url: message.imageUrl,
      voice_note_path: message.messageType === "voice" ? message.content ?? "voice" : undefined,
      created_at: message.createdAt,
      is_own: message.senderId === viewerId,
    })),
    [activeThread?.id, localMessages, viewerId]
  );

  async function readBlobAsDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function createSupportThread() {
    startTransition(async () => {
      try {
        await postPortalAction("create_chat_thread", { threadType: "support", title: chatT("generalSupport") });
        toast({ title: chatT("supportReadyTitle"), description: chatT("supportReadyDescription") });
        router.refresh();
      } catch (error) {
        toast({ title: chatT("chatNotCreatedTitle"), description: error instanceof Error ? error.message : chatT("chatNotCreatedDescription"), variant: "destructive" });
      }
    });
  }

  function closeThread() {
    if (!activeThread || !isStaff) return;

    startTransition(async () => {
      try {
        await patchPortalAction("close_chat_thread", { threadId: activeThread.id });
        toast({ title: chatT("threadClosedTitle"), description: chatT("threadClosedDescription") });
        router.refresh();
      } catch (error) {
        toast({ title: chatT("closeFailedTitle"), description: error instanceof Error ? error.message : chatT("closeFailedDescription"), variant: "destructive" });
      }
    });
  }

  if (!activeThread) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{chatT("title")}</h1>
          <p className="text-sm text-muted-foreground">{chatT("emptyDescription")}</p>
        </div>
        <Button disabled={isPending} type="button" onClick={createSupportThread}>{chatT("newSupportChat")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{chatT("messaging")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{chatT("conversationWorkspace")}</h1>
        </div>
        <div className="flex gap-2">
          <Button disabled={isPending} type="button" variant="outline" onClick={createSupportThread}>{chatT("newSupportChat")}</Button>
          {isStaff ? <Button disabled={isPending || activeThread.status === "closed"} type="button" variant="secondary" onClick={closeThread}>{chatT("closeThread")}</Button> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ChatThreadList
          threads={localThreads.map((thread) => ({
            id: thread.id,
            thread_type: thread.threadType,
            vehicle_info: thread.title,
            status: thread.status,
            unread_count: thread.unreadCount,
            last_message_time: thread.updatedAt,
            last_message: (() => {
              const lastMessage = localMessages.filter((message) => message.threadId === thread.id).slice(-1)[0];
              if (!lastMessage) return undefined;
              if (lastMessage.messageType === "voice") return chatT("voiceNote");
              return lastMessage.content;
            })(),
          }))}
          selectedThreadId={activeThread.id}
          onSelectThread={setSelectedThreadId}
        />
        <ChatWindow
          thread={{
            id: activeThread.id,
            thread_type: activeThread.threadType,
            vehicle_info: activeThread.title,
            status: activeThread.status,
            unread_count: activeThread.unreadCount,
          }}
          isLoading={isPending}
          messages={activeMessages}
          onSendMessage={(content, type, voiceBlob, voiceDuration) => {
            startTransition(async () => {
              const optimisticId = `local-${Date.now()}`;
              const previousUpdatedAt = activeThread.updatedAt;

              try {
                const resolvedContent = type === "voice" && voiceBlob ? await readBlobAsDataUrl(voiceBlob) : content;
                const optimisticMessage = {
                  id: optimisticId,
                  threadId: activeThread.id,
                  senderId: viewerId,
                  senderName: "You",
                  messageType: type,
                  content: resolvedContent,
                  voiceDuration,
                  createdAt: new Date().toISOString(),
                } as const;

                setLocalMessages((current) => [...current, optimisticMessage]);
                setLocalThreads((current) => current.map((thread) => thread.id === activeThread.id ? { ...thread, updatedAt: optimisticMessage.createdAt } : thread));

                await postPortalAction("send_chat_message", {
                  content: resolvedContent,
                  messageType: type,
                  threadId: activeThread.id,
                  voiceDuration,
                });
                router.refresh();
              } catch (error) {
                setLocalMessages((current) => current.filter((message) => message.id !== optimisticId));
                setLocalThreads((current) => current.map((thread) => thread.id === activeThread.id ? { ...thread, updatedAt: previousUpdatedAt } : thread));
                toast({ title: chatT("messageFailedTitle"), description: error instanceof Error ? error.message : chatT("messageFailedDescription"), variant: "destructive" });
              }
            });
          }}
        />
      </div>
    </div>
  );
}
