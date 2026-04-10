import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAblyServerClient, CHANNEL_NAMES, EVENTS } from "@/lib/ably";
import { z } from "zod";

const sendSchema = z.object({
  content: z.string().min(1).max(4000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const messages = await db.message.findMany({
    where: {
      channelId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      contentType: true,
      userId: true,
      createdAt: true,
      edited: true,
    },
  });

  return Response.json(messages.reverse());
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { workspaceId: true },
  });
  if (!channel) return Response.json({ error: "Not found" }, { status: 404 });

  // Verify membership
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: channel.workspaceId, userId } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const message = await db.message.create({
    data: {
      channelId,
      userId,
      content: parsed.data.content,
    },
    select: {
      id: true,
      content: true,
      contentType: true,
      userId: true,
      createdAt: true,
      edited: true,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      workspaceId: channel.workspaceId,
      actorId: userId,
      action: "message.create",
      resource: "message",
      resourceId: message.id,
    },
  });

  // Publish to Ably
  const ably = getAblyServerClient();
  await ably.channels
    .get(CHANNEL_NAMES.channel(channelId))
    .publish(EVENTS.MESSAGE_CREATED, {
      ...message,
      createdAt: message.createdAt.toISOString(),
      user: { name: "Team Member" },
    });

  return Response.json(message, { status: 201 });
}
