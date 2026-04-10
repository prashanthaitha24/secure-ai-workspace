import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await params;

  const file = await db.file.findUnique({ where: { id: fileId } });
  if (!file) return Response.json({ error: "Not found" }, { status: 404 });

  if (file.uploadedById !== userId) {
    const member = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: file.workspaceId, userId } },
      select: { role: true },
    });
    if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await del(file.blobUrl);
  await db.file.delete({ where: { id: fileId } });

  return new Response(null, { status: 204 });
}
