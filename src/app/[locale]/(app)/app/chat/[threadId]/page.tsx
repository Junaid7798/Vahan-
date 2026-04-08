import { requireViewer } from "@/lib/auth/viewer";
import { getChatForViewer } from "@/lib/demo/portal-operations";
import { ChatWorkspace } from "@/modules/chat/components/chat-workspace";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ locale: string; threadId: string }>;
}) {
  const { locale, threadId } = await params;
  const viewer = await requireViewer(locale);
  const chat = await getChatForViewer(viewer.profile.id, viewer.permissions.canViewAllChats);

  return <ChatWorkspace initialThreadId={threadId} isStaff={viewer.permissions.canViewAllChats} messages={chat.messages} threads={chat.threads} viewerId={viewer.profile.id} />;
}
