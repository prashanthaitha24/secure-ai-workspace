import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Users,
  MessageSquare,
  Video,
  HardDrive,
  ShieldCheck,
  Activity,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId } = await params;

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });

  if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
    redirect(`/workspace/${workspaceId}`);
  }

  const [
    memberCount,
    channelCount,
    messageCount,
    meetingCount,
    fileStats,
    recentLogs,
    liveMeetings,
  ] = await Promise.all([
    db.workspaceMember.count({ where: { workspaceId } }),
    db.channel.count({ where: { workspaceId } }),
    db.message.count({ where: { channel: { workspaceId } } }),
    db.meeting.count({ where: { workspaceId } }),
    db.file.aggregate({
      where: { workspaceId },
      _count: true,
      _sum: { size: true },
    }),
    db.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        actorId: true,
        action: true,
        resource: true,
        createdAt: true,
      },
    }),
    db.meeting.count({ where: { workspaceId, status: "LIVE" } }),
  ]);

  const totalStorageBytes = fileStats._sum.size ?? 0;
  const storageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  const actionColors: Record<string, string> = {
    "message.create": "text-blue-400",
    "channel.create": "text-green-400",
    "meeting.create": "text-purple-400",
    "file.upload": "text-yellow-400",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="font-semibold">Admin Dashboard</h1>
        <Badge variant="secondary" className="ml-auto text-xs">
          {member.role}
        </Badge>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Members"
            value={memberCount}
            icon={Users}
          />
          <StatCard
            title="Channels"
            value={channelCount}
            icon={MessageSquare}
          />
          <StatCard
            title="Messages"
            value={messageCount.toLocaleString()}
            icon={MessageSquare}
          />
          <StatCard
            title="Meetings"
            value={meetingCount}
            icon={Video}
            description={liveMeetings > 0 ? `${liveMeetings} live now` : undefined}
          />
          <StatCard
            title="Files"
            value={fileStats._count}
            icon={HardDrive}
            description={`${storageMB} MB used`}
          />
          <StatCard
            title="Live Meetings"
            value={liveMeetings}
            icon={Activity}
          />
        </div>

        {/* Security status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "TLS 1.3 in transit", status: "active" },
              { label: "Encryption at rest", status: "active" },
              { label: "Audit logging", status: "active" },
              { label: "RBAC enforced", status: "active" },
              { label: "Rate limiting", status: "active" },
              { label: "End-to-end encryption", status: "planned" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <Badge
                  variant={item.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audit log */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Audit Log
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                Last 20 events
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <div className="space-y-1">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 py-1.5 text-xs border-b border-border last:border-0"
                  >
                    <span
                      className={`font-mono font-medium ${
                        actionColors[log.action] ?? "text-muted-foreground"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-muted-foreground">{log.resource}</span>
                    <span className="ml-auto text-muted-foreground font-mono">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
