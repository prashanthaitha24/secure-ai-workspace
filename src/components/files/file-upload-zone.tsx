"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUploadZone({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadedName(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceId", workspaceId);

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        setUploadedName(file.name);
        router.refresh();
        setTimeout(() => setUploadedName(null), 3000);
      } finally {
        setUploading(false);
      }
    },
    [workspaceId, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border",
        "cursor-pointer hover:border-primary/50 hover:bg-accent/20"
      )}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) uploadFile(file);
        };
        input.click();
      }}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Uploading...</span>
        </div>
      ) : uploadedName ? (
        <div className="flex flex-col items-center gap-2 text-green-400">
          <CheckCircle2 className="h-6 w-6" />
          <span className="text-sm">{uploadedName} uploaded</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Upload className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium">
              Drop a file here or click to upload
            </p>
            <p className="text-xs mt-1">
              Images, PDFs, documents up to 500MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
