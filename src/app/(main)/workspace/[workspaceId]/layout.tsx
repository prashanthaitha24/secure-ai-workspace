import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId } = await params;

  const [workspaces, membership] = await Promise.all([
    db.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    }),
  ]);

  if (!membership) redirect("/");

  const channels = await db.channel.findMany({
    where: { workspaceId },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  const workspaceList = workspaces.map((m: { workspace: { id: string; name: string; slug: string; logoUrl: string | null } }) => m.workspace);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspaces={workspaceList}
        currentWorkspaceId={workspaceId}
        channels={channels}
        userRole={membership.role}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
