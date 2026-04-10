import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-_]+$/, "Channel name must be lowercase letters, numbers, hyphens, or underscores"),
  description: z.string().max(250).optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
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
  if (member.role === "GUEST") {
    return Response.json({ error: "Guests cannot create channels" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.channel.findUnique({
    where: { workspaceId_name: { workspaceId, name: parsed.data.name } },
  });
  if (existing) {
    return Response.json({ error: "A channel with that name already exists" }, { status: 409 });
  }

  const channel = await db.channel.create({
    data: {
      workspaceId,
      name: parsed.data.name,
      description: parsed.data.description,
      type: parsed.data.type,
      createdById: userId,
    },
    select: { id: true, name: true, type: true, description: true },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: "channel.create",
      resource: "channel",
      resourceId: channel.id,
    },
  });

  return Response.json(channel, { status: 201 });
}
