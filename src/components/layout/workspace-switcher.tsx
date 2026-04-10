"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const current = workspaces.find((w) => w.id === currentWorkspaceId);
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="w-full flex items-center justify-between px-2 h-10 font-medium rounded-lg text-sm hover:bg-sidebar-accent transition-colors"
      >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 rounded-md flex-shrink-0">
              <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs font-bold">
                {current?.name?.charAt(0).toUpperCase() ?? "W"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{current?.name ?? "Select workspace"}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => {
              router.push(`/workspace/${ws.id}`);
              setOpen(false);
            }}
            className="cursor-pointer"
          >
            <Avatar className="h-6 w-6 rounded-md mr-2">
              <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs font-bold">
                {ws.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{ws.name}</span>
            {ws.id === currentWorkspaceId && (
              <ShieldCheck className="ml-auto h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/workspace/new")}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
