"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewMeetingButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create meeting");
      const meeting = await res.json();
      setOpen(false);
      setTitle("");
      router.push(`/workspace/${workspaceId}/meetings/${meeting.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Meeting
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Start a Meeting
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="meeting-title" className="text-sm mb-2 block">
              Meeting title
            </Label>
            <Input
              id="meeting-title"
              placeholder="e.g. Sprint Planning, Incident Review..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || loading}>
              {loading ? "Creating..." : "Start Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
