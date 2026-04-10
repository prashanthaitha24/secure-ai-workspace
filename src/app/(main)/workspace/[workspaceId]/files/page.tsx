import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FileUploadZone } from "@/components/files/file-upload-zone";
import { FileGrid } from "@/components/files/file-grid";
import { FolderOpen, Upload } from "lucide-react";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId } = await params;

  const files = await db.file.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      blobUrl: true,
      isPublic: true,
      uploadedById: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Files</h1>
          <span className="text-xs text-muted-foreground">
            ({files.length} files)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <FileUploadZone workspaceId={workspaceId} />
        <FileGrid files={files} currentUserId={userId} />
      </div>
    </div>
  );
}
