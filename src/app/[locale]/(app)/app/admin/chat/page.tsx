import { requireStaff } from "@/lib/auth/viewer";
import { getChatForViewer } from "@/lib/demo/portal-operations";
import { ChatWorkspace } from "@/modules/chat/components/chat-workspace";

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await requireStaff(locale);
  const chat = await getChatForViewer(viewer.profile.id, true);

  return <ChatWorkspace isStaff messages={chat.messages} threads={chat.threads} viewerId={viewer.profile.id} />;
}
