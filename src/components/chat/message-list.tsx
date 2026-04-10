"use client";

import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { MessageItem, type Message } from "./message-item";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
}

function DateDivider({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) label = "Today";
  else if (isYesterday(date)) label = "Yesterday";
  else label = format(date, "MMMM d, yyyy");

  return (
    <div className="flex items-center gap-3 px-4 my-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function MessageList({
  messages,
  currentUserId,
  loading = false,
  onDelete,
  onEdit,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full max-w-sm" />
              {i % 2 === 0 && <Skeleton className="h-4 w-48" />}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <ShieldCheck className="h-10 w-10 text-primary/40" />
        <div className="text-center">
          <p className="font-medium">This is the beginning of this channel</p>
          <p className="text-sm mt-1">All messages are encrypted end-to-end.</p>
        </div>
      </div>
    );
  }

  let lastDate: Date | null = null;
  let lastUserId: string | null = null;

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {messages.map((msg, index) => {
        const msgDate = new Date(msg.createdAt);
        const showDateDivider = !lastDate || !isSameDay(lastDate, msgDate);
        const compact =
          !showDateDivider &&
          lastUserId === msg.userId &&
          index > 0 &&
          msgDate.getTime() - new Date(messages[index - 1].createdAt).getTime() < 5 * 60 * 1000;

        lastDate = msgDate;
        lastUserId = msg.userId;

        return (
          <div key={msg.id}>
            {showDateDivider && <DateDivider date={msgDate} />}
            <MessageItem
              message={msg}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onEdit={onEdit}
              compact={compact}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
