import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;

  const caller = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!caller) return Response.json({ error: "Forbidden" }, { status: 403 });

  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
    },
  });

  return Response.json(members);
}

const updateSchema = z.object({
  targetUserId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;

  const caller = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!caller || (caller.role !== "OWNER" && caller.role !== "ADMIN")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetUserId, role } = parsed.data;

  // Admins cannot promote to admin or demote owners
  const target = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    select: { role: true },
  });
  if (!target) return Response.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") {
    return Response.json({ error: "Cannot change owner role" }, { status: 403 });
  }
  if (caller.role === "ADMIN" && role === "ADMIN") {
    return Response.json({ error: "Admins cannot promote to admin" }, { status: 403 });
  }

  const updated = await db.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { role },
    select: { userId: true, role: true },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: "member.role_change",
      resource: "member",
      resourceId: targetUserId,
      metadata: { from: target.role, to: role },
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const caller = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });

  // Users can remove themselves; admins/owners can remove others
  const isSelf = userId === targetUserId;
  if (!isSelf && (!caller || (caller.role !== "OWNER" && caller.role !== "ADMIN"))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    select: { role: true },
  });
  if (!target) return Response.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") {
    return Response.json({ error: "Cannot remove workspace owner" }, { status: 403 });
  }

  await db.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: isSelf ? "member.leave" : "member.remove",
      resource: "member",
      resourceId: targetUserId,
    },
  });

  return new Response(null, { status: 204 });
}
