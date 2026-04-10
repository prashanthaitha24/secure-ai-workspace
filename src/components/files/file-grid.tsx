"use client";

import { format } from "date-fns";
import {
  FileText,
  FileImage,
  File,
  Download,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  blobUrl: string;
  isPublic: boolean;
  uploadedById: string;
  createdAt: Date;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))
    return <FileImage className="h-8 w-8 text-blue-400" />;
  if (mimeType === "application/pdf" || mimeType.includes("document"))
    return <FileText className="h-8 w-8 text-red-400" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

interface FileGridProps {
  files: FileItem[];
  currentUserId: string;
}

export function FileGrid({ files, currentUserId }: FileGridProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (fileId: string) => {
    setDeleting(fileId);
    try {
      await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {files.map((file) => (
        <Card key={file.id} className="group hover:bg-accent/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <FileIcon mimeType={file.mimeType} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    render={<a href={file.blobUrl} target="_blank" rel="noopener noreferrer" />}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    render={<a href={file.blobUrl} download={file.name} />}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {file.uploadedById === currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file.id)}
                      disabled={deleting === file.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatBytes(file.size)} ·{" "}
                  {format(new Date(file.createdAt), "MMM d")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
