import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AblyRealtimeProvider } from "@/components/providers/ably-provider";
import { ChannelChat } from "@/components/chat/channel-chat";
import type { Message } from "@/components/chat/message-item";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ workspaceId: string; channelId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId, channelId } = await params;

  const [channel, rawMessages] = await Promise.all([
    db.channel.findFirst({
      where: { id: channelId, workspaceId },
      select: { id: true, name: true, description: true, type: true },
    }),
    db.message.findMany({
      where: { channelId },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        content: true,
        contentType: true,
        userId: true,
        createdAt: true,
        edited: true,
      },
    }),
  ]);

  if (!channel) redirect(`/workspace/${workspaceId}`);

  // Fetch user display info from Clerk in a real app.
  // For now we map userId to a placeholder display name.
  const messages: Message[] = rawMessages.map((m) => ({
    ...m,
    contentType: m.contentType as Message["contentType"],
    createdAt: m.createdAt.toISOString(),
    user: { name: "Team Member" },
  }));

  return (
    <AblyRealtimeProvider>
      <ChannelChat
        channel={channel}
        workspaceId={workspaceId}
        currentUserId={userId}
        initialMessages={messages}
      />
    </AblyRealtimeProvider>
  );
}
