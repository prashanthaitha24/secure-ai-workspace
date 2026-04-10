"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Video,
  FolderOpen,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Channel {
  id: string;
  name: string;
  type: "PUBLIC" | "PRIVATE" | "DM";
  unreadCount?: number;
}

interface ChannelListProps {
  workspaceId: string;
  channels: Channel[];
  userRole: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function ChannelList({
  workspaceId,
  channels,
  userRole,
}: ChannelListProps) {
  const [channelsOpen, setChannelsOpen] = useState(true);
  const canManage = userRole === "OWNER" || userRole === "ADMIN";

  const navItems: NavItem[] = [
    {
      href: `/workspace/${workspaceId}/meetings`,
      label: "Meetings",
      icon: <Video className="h-4 w-4" />,
    },
    {
      href: `/workspace/${workspaceId}/files`,
      label: "Files",
      icon: <FolderOpen className="h-4 w-4" />,
    },
    ...(canManage
      ? [
          {
            href: `/workspace/${workspaceId}/admin`,
            label: "Admin",
            icon: <BarChart3 className="h-4 w-4" />,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-1 px-2">
      {/* Main nav */}
      <div className="mb-1">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="h-px bg-sidebar-border my-1" />

      {/* Channels section */}
      <div>
        <button
          onClick={() => setChannelsOpen(!channelsOpen)}
          className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors"
        >
          <div className="flex items-center gap-1">
            {channelsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Channels
          </div>
          {canManage && (
            <Link
              href={`/workspace/${workspaceId}/channel/new`}
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3.5 w-3.5 hover:text-sidebar-foreground" />
            </Link>
          )}
        </button>

        {channelsOpen && (
          <div className="mt-1 flex flex-col gap-0.5">
            {channels.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground italic">
                No channels yet
              </p>
            ) : (
              channels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  workspaceId={workspaceId}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  workspaceId,
}: {
  channel: Channel;
  workspaceId: string;
}) {
  const pathname = usePathname();
  const href = `/workspace/${workspaceId}/channel/${channel.id}`;
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors group",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        channel.unreadCount && !isActive && "text-foreground font-medium"
      )}
    >
      {channel.type === "PRIVATE" ? (
        <Lock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      ) : (
        <Hash className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{channel.name}</span>
      {channel.unreadCount && channel.unreadCount > 0 && !isActive ? (
        <Badge
          variant="secondary"
          className="ml-auto h-4 min-w-4 px-1 text-xs bg-primary text-primary-foreground"
        >
          {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
        </Badge>
      ) : null}
    </Link>
  );
}
