"use client";

import { useEffect } from "react";
import { LumoLogo } from "@/components/layout/lumo-logo";
import { ProjectList } from "@/components/layout/project-list";
import { TeamsDialog } from "@/components/layout/teams-dialog";
import { UserFooter } from "@/components/layout/user-footer";
import { WorkspaceMembersDialog } from "@/components/layout/workspace-members-dialog";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Separator } from "@/components/ui/separator";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { AppShellData } from "@/lib/app-data";

type AppSidebarProps = {
  data: AppShellData;
};

export function AppSidebar({ data }: AppSidebarProps) {
  const setShellData = useWorkspaceStore((s) => s.setShellData);

  useEffect(() => {
    setShellData({
      workspaces: data.workspaces,
      activeWorkspace: data.activeWorkspace,
      projects: data.projects,
    });
  }, [data, setShellData]);

  const canManage =
    data.members.some(
      (member) =>
        member.id === data.profile.id &&
        (member.role === "owner" || member.role === "admin")
    ) || data.activeWorkspace.owner_id === data.profile.id;

  return (
    <aside className="glass-panel relative z-10 flex h-full w-[15.5rem] shrink-0 flex-col border-y-0 border-l-0 text-sidebar-foreground shadow-[4px_0_24px_-12px_oklch(0.3_0.02_250/0.18)]">
      <div className="px-3 pt-5 pb-3">
        <LumoLogo />
      </div>

      <div className="space-y-1 px-2 pb-3">
        <p className="px-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Workspace
        </p>
        <WorkspaceSwitcher
          workspaces={data.workspaces}
          activeWorkspace={data.activeWorkspace}
        />
        <WorkspaceMembersDialog
          workspaceId={data.activeWorkspace.id}
          workspaceName={data.activeWorkspace.name}
          initialMembers={data.members}
          currentUserId={data.profile.id}
          canManage={canManage}
        />
        <TeamsDialog
          workspaceId={data.activeWorkspace.id}
          workspaceName={data.activeWorkspace.name}
          workspaceMembers={data.members}
          initialTeams={data.teams}
          canManage={canManage}
        />
      </div>

      <Separator className="mx-3 opacity-70" />

      <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
        <ProjectList
          workspace={data.activeWorkspace}
          projects={data.projects}
        />
      </div>

      <UserFooter profile={data.profile} />
    </aside>
  );
}
