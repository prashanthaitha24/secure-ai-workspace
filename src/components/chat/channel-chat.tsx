"use client";

import { useState, useEffect, useCallback } from "react";
import { useChannel } from "ably/react";
import { Hash, Lock, Users, ShieldCheck, Settings } from "lucide-react";
import { MessageList } from "./message-list";
import type { Message } from "./message-item";
import { MessageInput } from "./message-input";
import { EVENTS } from "@/lib/ably";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: "PUBLIC" | "PRIVATE" | "DM";
}

interface ChannelChatProps {
  channel: Channel;
  workspaceId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function ChannelChat({
  channel,
  workspaceId,
  currentUserId,
  initialMessages,
}: ChannelChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const ablyChannelName = `channel:${channel.id}`;

  useChannel(ablyChannelName, EVENTS.MESSAGE_CREATED, (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.data.id)) return prev;
      return [...prev, msg.data as Message];
    });
  });

  useChannel(ablyChannelName, EVENTS.MESSAGE_DELETED, (msg) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.data.id));
  });

  useChannel(ablyChannelName, EVENTS.MESSAGE_UPDATED, (msg) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.data.id ? { ...m, ...msg.data } : m))
    );
  });

  const handleSend = useCallback(
    async (content: string) => {
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
    },
    [channel.id]
  );

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
  }, []);

  const handleEdit = useCallback(async (id: string, content: string) => {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {channel.type === "PRIVATE" ? (
            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <h2 className="font-semibold text-sm">{channel.name}</h2>
          {channel.description && (
            <>
              <span className="text-muted-foreground text-sm">|</span>
              <span className="text-sm text-muted-foreground truncate">
                {channel.description}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-xs text-primary cursor-default">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Encrypted</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Messages are encrypted at rest and in transit</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Input */}
      <MessageInput channelName={channel.name} onSend={handleSend} />
    </div>
  );
}
