"use client";

import { UserButton } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ChannelList } from "./channel-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface Channel {
  id: string;
  name: string;
  type: "PUBLIC" | "PRIVATE" | "DM";
  unreadCount?: number;
}

interface SidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  channels: Channel[];
  userRole: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
}

export function Sidebar({
  workspaces,
  currentWorkspaceId,
  channels,
  userRole,
}: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 h-full bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Workspace switcher */}
      <div className="px-2 py-2 border-b border-sidebar-border">
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
        />
      </div>

      {/* Channel list */}
      <ScrollArea className="flex-1 py-2">
        <ChannelList
          workspaceId={currentWorkspaceId}
          channels={channels}
          userRole={userRole}
        />
      </ScrollArea>

      {/* User section */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                Online
              </span>
            </div>
          </div>
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
