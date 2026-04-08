"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface ChatWindowProps {
  thread: ChatThread;
  messages: ChatMessage[];
  onSendMessage?: (content: string, type: "text" | "voice", voiceBlob?: Blob, voiceDuration?: number) => void;
  isLoading?: boolean;
}

export function ChatWindow({ thread, messages, onSendMessage, isLoading }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatT = useTranslations("chat");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!messageInput.trim() || !onSendMessage) return;
    onSendMessage(messageInput.trim(), "text");
    setMessageInput("");
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(chatT("recordingUnavailableDescription"));
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const duration = recordingStartedAtRef.current
          ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
          : undefined;
        if (onSendMessage && chunks.length > 0) {
          onSendMessage(chatT("voiceNote"), "voice", audioBlob, duration);
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStartedAtRef.current = null;
      };

      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: chatT("recordingUnavailableTitle"),
        description: error instanceof Error ? error.message : chatT("recordingUnavailableDescription"),
        variant: "destructive",
      });
    }
  }

  function stopRecording() {
    if (!mediaRecorder || !isRecording) return;
    mediaRecorder.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  }

  return (
    <Card className="flex h-[640px] flex-col rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{thread.thread_type === "support" ? "S" : "V"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{thread.thread_type === "support" ? chatT("support") : thread.vehicle_info || chatT("vehicleChat")}</CardTitle>
              <p className="text-xs text-muted-foreground">{thread.status === "open" ? chatT("openConversation") : chatT("closedConversation")}</p>
            </div>
          </div>
          <Badge variant="secondary">{chatT("unread", { count: thread.unread_count })}</Badge>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-4">
          {isLoading ? <div className="text-center text-sm text-muted-foreground">{chatT("updatingConversation")}</div> : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.is_own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.is_own ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {message.message_type === "voice" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{chatT("voiceNote")}</p>
                    {message.content?.startsWith("data:audio") ? (
                      <audio controls className="max-w-full" src={message.content} />
                    ) : null}
                    <p className={`text-xs ${message.is_own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatVoiceDuration(message.voice_duration)}</p>
                  </div>
                ) : message.message_type === "image" && message.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={message.image_url} alt="Shared image" className="max-w-full rounded-xl" />
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <p className={`mt-2 text-xs ${message.is_own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatMessageTime(message.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder={chatT("typeMessage")}
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSend()}
            className="flex-1"
          />
          {isRecording ? (
            <Button type="button" variant="destructive" size="icon" onClick={stopRecording} aria-label={chatT("stopRecording")}>
              <MicOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="icon" onClick={startRecording} aria-label={chatT("startRecording")}>
              <Mic className="h-4 w-4" />
            </Button>
          )}
          <Button type="button" size="icon" onClick={handleSend} disabled={!messageInput.trim()} aria-label={chatT("send")}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isRecording ? <p className="mt-2 text-sm text-destructive">{chatT("recording")}</p> : null}
      </div>
    </Card>
  );
}

interface ChatThreadListProps {
  threads: ChatThread[];
  selectedThreadId?: string;
  onSelectThread?: (threadId: string) => void;
}

export function ChatThreadList({ threads, selectedThreadId, onSelectThread }: ChatThreadListProps) {
  const chatT = useTranslations("chat");

  return (
    <Card className="rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>{chatT("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {threads.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">{chatT("noConversations")}</div> : null}
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread?.(thread.id)}
              className={`w-full p-4 text-left transition-colors hover:bg-muted/40 ${selectedThreadId === thread.id ? "bg-muted/60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>{thread.thread_type === "support" ? "S" : "V"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">{thread.thread_type === "support" ? chatT("support") : thread.vehicle_info || chatT("vehicleChat")}</p>
                    <span className="text-xs text-muted-foreground">{formatThreadTime(thread.last_message_time, chatT)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-muted-foreground">{thread.last_message || chatT("noMessagesYet")}</p>
                    {thread.unread_count > 0 ? <Badge variant="destructive">{thread.unread_count}</Badge> : null}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatVoiceDuration(seconds?: number) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatMessageTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatThreadTime(dateString: string | undefined, chatT: ReturnType<typeof useTranslations<"chat">>) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return chatT("yesterday");
  if (days < 7) return date.toLocaleDateString("en-IN", { weekday: "short" });
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
