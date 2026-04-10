import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Video, Plus, Clock, Users, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { NewMeetingButton } from "@/components/meetings/new-meeting-button";

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId } = await params;

  const meetings = await db.meeting.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { participants: true } },
      summary: { select: { id: true } },
    },
  });

  const statusColors: Record<string, string> = {
    LIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    ENDED: "bg-muted text-muted-foreground border-border",
    SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Meetings</h1>
        </div>
        <NewMeetingButton workspaceId={workspaceId} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-6">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <Video className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-medium">No meetings yet</p>
              <p className="text-sm mt-1">Start a meeting to get AI-powered transcripts and recaps.</p>
            </div>
            <NewMeetingButton workspaceId={workspaceId} />
          </div>
        ) : (
          <div className="grid gap-3 max-w-3xl">
            {meetings.map((meeting) => (
              <Link key={meeting.id} href={`/workspace/${workspaceId}/meetings/${meeting.id}`}>
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{meeting.title}</h3>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
                              statusColors[meeting.status] ?? statusColors.ENDED
                            }`}
                          >
                            {meeting.status === "LIVE" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                            )}
                            {meeting.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {meeting.startedAt
                              ? format(new Date(meeting.startedAt), "MMM d, yyyy · h:mm a")
                              : meeting.scheduledAt
                              ? format(new Date(meeting.scheduledAt), "MMM d, yyyy · h:mm a")
                              : format(new Date(meeting.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meeting._count.participants} participants
                          </span>
                          {meeting.summary && (
                            <span className="flex items-center gap-1 text-primary">
                              <FileText className="h-3 w-3" />
                              AI recap ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
