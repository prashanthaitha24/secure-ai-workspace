"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  channelName: string;
  onSend: (content: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({
  channelName,
  onSend,
  onFileUpload,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      await onFileUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="px-4 pb-4">
      <div
        className={cn(
          "flex items-end gap-2 rounded-lg border border-input bg-card p-2",
          "focus-within:ring-1 focus-within:ring-ring",
          disabled && "opacity-50"
        )}
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-0 py-1 text-sm"
          style={{ height: "auto", maxHeight: "200px" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
          }}
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            type="button"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            size="icon"
            className="h-7 w-7"
            onClick={handleSend}
            disabled={!content.trim() || sending || disabled}
            type="button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-1">
        <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
          Enter
        </kbd>{" "}
        to send,{" "}
        <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
          Shift+Enter
        </kbd>{" "}
        for new line
      </p>
    </div>
  );
}
