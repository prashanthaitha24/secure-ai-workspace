"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Reply, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  content: string;
  contentType: string;
  userId: string;
  createdAt: string;
  edited: boolean;
  user?: {
    name: string;
    imageUrl?: string;
  };
}

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  compact?: boolean;
}

export function MessageItem({
  message,
  currentUserId,
  onDelete,
  onEdit,
  compact = false,
}: MessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const isOwn = message.userId === currentUserId;
  const initials = message.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  if (message.contentType === "MEETING_RECAP") {
    return <MeetingRecapMessage message={message} />;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-1 group relative hover:bg-accent/30 rounded-md transition-colors",
        compact && "py-0.5"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!compact && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
          <AvatarImage src={message.user?.imageUrl} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      {compact && <div className="w-8 flex-shrink-0" />}

      <div className="flex-1 min-w-0">
        {!compact && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold leading-none">
              {message.user?.name ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
            {message.edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>
        )}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>

      {/* Actions */}
      {hovered && (
        <div className="absolute right-2 top-1 flex items-center gap-1 bg-card border border-border rounded-md shadow-sm px-1">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Reply className="h-3.5 w-3.5" />
          </Button>
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onEdit?.(message.id, message.content)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(message.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingRecapMessage({ message }: { message: Message }) {
  return (
    <div className="mx-4 my-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">AI Meeting Recap</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(message.createdAt), "MMM d, h:mm a")}
        </span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}
