import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  channelId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const meeting = await db.meeting.create({
    data: {
      workspaceId,
      title: parsed.data.title,
      hostId: userId,
      channelId: parsed.data.channelId,
      scheduledAt: parsed.data.scheduledAt
        ? new Date(parsed.data.scheduledAt)
        : null,
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: "meeting.create",
      resource: "meeting",
      resourceId: meeting.id,
    },
  });

  return Response.json(meeting, { status: 201 });
}
