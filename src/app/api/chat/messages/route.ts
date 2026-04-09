import { NextRequest, NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/auth/session";
import { sendDemoChatMessage } from "@/lib/demo/portal-chat";
import { sendChatMessage } from "@/lib/supabase/portal-chat";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 403 });
  }

  const body = (await request.json()) as {
    content?: string;
    messageType: "image" | "text" | "voice";
    threadId: string;
    voiceDuration?: number;
  };

  try {
    if (isSupabaseConfigured()) {
      await sendChatMessage({
        content: body.content,
        messageType: body.messageType,
        senderId: viewer.profile.id,
        threadId: body.threadId,
        voiceDuration: body.voiceDuration,
      });
    } else {
      await sendDemoChatMessage({
        content: body.content,
        messageType: body.messageType,
        senderId: viewer.profile.id,
        senderName: viewer.profile.full_name ?? viewer.user.email ?? "User",
        threadId: body.threadId,
        voiceDuration: body.voiceDuration,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
  }
}
