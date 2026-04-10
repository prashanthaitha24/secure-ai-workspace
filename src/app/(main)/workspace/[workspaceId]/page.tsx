import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Hash, Video, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId } = await params;

  const [workspace, channels, recentMeetings, memberCount] = await Promise.all([
    db.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, description: true, createdAt: true },
    }),
    db.channel.findMany({
      where: { workspaceId },
      select: { id: true, name: true, type: true, _count: { select: { messages: true } } },
      orderBy: { name: "asc" },
      take: 5,
    }),
    db.meeting.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, status: true, startedAt: true, endedAt: true },
    }),
    db.workspaceMember.count({ where: { workspaceId } }),
  ]);

  if (!workspace) redirect("/");

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground mt-1">{workspace.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} members
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Encrypted
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Channels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No channels yet.</p>
              ) : (
                channels.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/workspace/${workspaceId}/channel/${ch.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{ch.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ch._count.messages} msgs
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))
              )}
              <Link
                href={`/workspace/${workspaceId}/channel/new`}
                className="flex items-center gap-2 p-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                + New channel
              </Link>
            </CardContent>
          </Card>

          {/* Recent Meetings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Recent Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings yet.</p>
              ) : (
                recentMeetings.map((m) => (
                  <Link
                    key={m.id}
                    href={`/workspace/${workspaceId}/meetings/${m.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                  >
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Video className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{m.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={m.status === "LIVE" ? "default" : "secondary"}
                        className="text-xs h-4"
                      >
                        {m.status === "LIVE" ? "Live" : m.status === "ENDED" ? "Ended" : m.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
              <Link
                href={`/workspace/${workspaceId}/meetings`}
                className="flex items-center gap-2 p-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                + New meeting
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
