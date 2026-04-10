"use client";

import { useState } from "react";
import {
  FileText,
  CheckSquare,
  Lightbulb,
  Gavel,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface ActionItem {
  text: string;
  assignee?: string;
  dueDate?: string;
}

interface AiNotesData {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
}

interface AiNotesProps {
  meetingId: string;
  existingSummary?: AiNotesData | null;
  meetingStatus: string;
}

export function AiNotes({ meetingId, existingSummary, meetingStatus }: AiNotesProps) {
  const [notes, setNotes] = useState<AiNotesData | null>(existingSummary ?? null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/summarize`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate notes");
      }
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!notes) return;
    const text = [
      "## Meeting Summary",
      notes.summary,
      "",
      "## Key Points",
      ...notes.keyPoints.map((p) => `• ${p}`),
      "",
      "## Action Items",
      ...notes.actionItems.map(
        (a) => `☐ ${a.text}${a.assignee ? ` (@${a.assignee})` : ""}`
      ),
      "",
      "## Decisions",
      ...notes.decisions.map((d) => `• ${d}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generating) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Generating AI notes...</span>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full mt-4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!notes) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">No AI notes yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {meetingStatus === "ENDED"
              ? "Generate a summary of this meeting."
              : "Available after the meeting ends."}
          </p>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <Button
          size="sm"
          onClick={generate}
          disabled={meetingStatus === "LIVE"}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Generate Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          AI Notes
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={generate}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Summary
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{notes.summary}</p>
          </div>

          <Separator />

          {/* Key Points */}
          {notes.keyPoints.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Key Points
              </h3>
              <ul className="space-y-1">
                {notes.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Action Items */}
          {notes.actionItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Action Items
              </h3>
              <ul className="space-y-2">
                {notes.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <span>{item.text}</span>
                      {item.assignee && (
                        <Badge variant="secondary" className="ml-2 text-xs h-4 px-1">
                          @{item.assignee}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notes.decisions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Gavel className="h-3.5 w-3.5" />
                  Decisions
                </h3>
                <ul className="space-y-1">
                  {notes.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
