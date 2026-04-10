import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const workspaceId = formData.get("workspaceId") as string | null;

  if (!file || !workspaceId) {
    return Response.json({ error: "Missing file or workspaceId" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File too large (max 500MB)" }, { status: 413 });
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const blob = await put(`workspaces/${workspaceId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const record = await db.file.create({
    data: {
      workspaceId,
      uploadedById: userId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      blobUrl: blob.url,
      isPublic: true,
    },
    select: { id: true, name: true, blobUrl: true, size: true },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: userId,
      action: "file.upload",
      resource: "file",
      resourceId: record.id,
      metadata: { name: file.name, size: file.size, mimeType: file.type },
    },
  });

  return Response.json(record, { status: 201 });
}
