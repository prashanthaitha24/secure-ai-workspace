import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MeetingRoom } from "@/components/meetings/meeting-room";
import { AiNotes } from "@/components/meetings/ai-notes";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ workspaceId: string; meetingId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId, meetingId } = await params;
  const user = await currentUser();

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, workspaceId },
    include: {
      summary: true,
      _count: { select: { participants: true } },
    },
  });

  if (!meeting) redirect(`/workspace/${workspaceId}/meetings`);

  const summaryData = meeting.summary
    ? {
        summary: meeting.summary.summary,
        keyPoints: meeting.summary.keyPoints as string[],
        actionItems: meeting.summary.actionItems as {
          text: string;
          assignee?: string;
        }[],
        decisions: meeting.summary.decisions as string[],
      }
    : null;

  const statusColors: Record<string, string> = {
    LIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    ENDED: "bg-muted text-muted-foreground border-border",
    SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <Link
          href={`/workspace/${workspaceId}/meetings`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm truncate">{meeting.title}</h2>
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meeting.startedAt
                ? format(new Date(meeting.startedAt), "MMM d, yyyy · h:mm a")
                : "Not started"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {meeting._count.participants}
            </span>
          </div>
        </div>
      </div>

      {/* Content: video + AI notes side by side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Meeting Room */}
        <div className="flex-1 min-w-0 border-r border-border">
          <MeetingRoom
            meetingId={meetingId}
            workspaceId={workspaceId}
            userId={userId}
            userName={user?.fullName ?? user?.username ?? "Anonymous"}
          />
        </div>

        {/* AI Notes panel */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <AiNotes
            meetingId={meetingId}
            existingSummary={summaryData}
            meetingStatus={meeting.status}
          />
        </div>
      </div>
    </div>
  );
}
