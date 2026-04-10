import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAblyServerClient, CHANNEL_NAMES, EVENTS } from "@/lib/ably";
import { z } from "zod";

const editSchema = z.object({
  content: z.string().min(1).max(4000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;
  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.message.findUnique({
    where: { id: messageId },
    select: { userId: true, channelId: true },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== userId)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const message = await db.message.update({
    where: { id: messageId },
    data: { content: parsed.data.content, edited: true },
    select: { id: true, content: true, edited: true },
  });

  const ably = getAblyServerClient();
  await ably.channels
    .get(CHANNEL_NAMES.channel(existing.channelId))
    .publish(EVENTS.MESSAGE_UPDATED, message);

  return Response.json(message);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;

  const existing = await db.message.findUnique({
    where: { id: messageId },
    select: { userId: true, channelId: true, channel: { select: { workspaceId: true } } },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  // Allow delete if own message OR admin/owner
  if (existing.userId !== userId) {
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: existing.channel.workspaceId,
          userId,
        },
      },
      select: { role: true },
    });
    if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await db.message.delete({ where: { id: messageId } });

  const ably = getAblyServerClient();
  await ably.channels
    .get(CHANNEL_NAMES.channel(existing.channelId))
    .publish(EVENTS.MESSAGE_DELETED, { id: messageId });

  return new Response(null, { status: 204 });
}
