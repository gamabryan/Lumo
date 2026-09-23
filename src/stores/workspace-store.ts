import { create } from "zustand";
import type { Project, Workspace } from "@/types/database";

type WorkspaceState = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  projects: Project[];
  setShellData: (data: {
    workspaces: Workspace[];
    activeWorkspace: Workspace;
    projects: Project[];
  }) => void;
  setActiveWorkspace: (workspace: Workspace, projects: Project[]) => void;
  addProject: (project: Project) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  setShellData: ({ workspaces, activeWorkspace, projects }) =>
    set({ workspaces, activeWorkspace, projects }),
  setActiveWorkspace: (workspace, projects) =>
    set((state) => ({
      activeWorkspace: workspace,
      projects,
      workspaces: state.workspaces.some((item) => item.id === workspace.id)
        ? state.workspaces
        : [...state.workspaces, workspace],
    })),
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
      activeWorkspace: workspace,
      projects: [],
    })),
  updateWorkspace: (workspace) =>
    set((state) => ({
      workspaces: state.workspaces.map((item) =>
        item.id === workspace.id ? workspace : item
      ),
      activeWorkspace:
        state.activeWorkspace?.id === workspace.id
          ? workspace
          : state.activeWorkspace,
    })),
}));
