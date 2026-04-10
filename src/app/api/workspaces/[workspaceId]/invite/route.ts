import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

const inviteSchema = z.object({
  role: z.enum(["MEMBER", "GUEST", "ADMIN"]).default("MEMBER"),
  expiresInHours: z.number().int().min(1).max(168).default(48),
});

// POST /api/workspaces/[workspaceId]/invite
// Generates a one-time invite code (stored in AuditLog metadata for simplicity)
export async function POST(
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
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const code = crypto.randomBytes(12).toString("hex");
  const expiresAt = new Date(
    Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000
  );

  // Store invite as audit log entry so we don't need a separate DB table
  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: "invite.create",
      resource: "invite",
      resourceId: code,
      metadata: {
        code,
        role: parsed.data.role,
        expiresAt: expiresAt.toISOString(),
        used: false,
      },
    },
  });

  return Response.json({ code, expiresAt, role: parsed.data.role }, { status: 201 });
}

// GET /api/workspaces/[workspaceId]/invite?code=xxx
// Accept an invite and join the workspace
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  const code = new URL(req.url).searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Missing invite code" }, { status: 400 });
  }

  const invite = await db.auditLog.findFirst({
    where: {
      workspaceId,
      action: "invite.create",
      resourceId: code,
    },
  });

  if (!invite) {
    return Response.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const meta = invite.metadata as {
    code: string;
    role: string;
    expiresAt: string;
    used: boolean;
  };

  if (meta.used) {
    return Response.json({ error: "Invite already used" }, { status: 410 });
  }
  if (new Date(meta.expiresAt) < new Date()) {
    return Response.json({ error: "Invite has expired" }, { status: 410 });
  }

  const existing = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (existing) {
    return Response.json({ error: "Already a member" }, { status: 409 });
  }

  await db.workspaceMember.create({
    data: {
      workspaceId,
      userId,
      role: meta.role as "MEMBER" | "GUEST" | "ADMIN",
    },
  });

  // Mark invite as used
  await db.auditLog.update({
    where: { id: invite.id },
    data: { metadata: { ...meta, used: true, usedBy: userId } },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: "member.join",
      resource: "member",
      resourceId: userId,
      metadata: { via: "invite", code },
    },
  });

  return Response.json({ workspaceId, role: meta.role });
}
