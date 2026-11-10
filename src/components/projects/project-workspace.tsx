"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { ProjectChat } from "@/components/chat/project-chat";
import { FocusModeButton } from "@/components/focus/focus-mode-button";
import { ProjectTeamSelect } from "@/components/projects/project-team-select";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { DaySummary } from "@/components/tasks/day-summary";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPendingStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type {
  MessageWithSender,
  TaskWithAssignee,
  TeamWithMembers,
  User,
} from "@/types/database";

const CHAT_COLLAPSED_KEY = "lumo_chat_collapsed";

type Member = Pick<User, "id" | "name" | "avatar_url" | "presence_status">;

type ProjectWorkspaceProps = {
  projectId: string;
  projectName: string;
  currentUserId: string;
  members: Member[];
  workspaceMembers: Member[];
  teams: TeamWithMembers[];
  initialTeamId: string | null;
  initialTasks: TaskWithAssignee[];
  initialMessages: MessageWithSender[];
  focusModeUntil: string | null;
};

export function ProjectWorkspace({
  projectId,
  projectName,
  currentUserId,
  members: initialAssignees,
  workspaceMembers,
  teams,
  initialTeamId,
  initialTasks,
  initialMessages,
  focusModeUntil,
}: ProjectWorkspaceProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [teamId, setTeamId] = useState(initialTeamId);
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setTeamId(initialTeamId);
  }, [initialTeamId]);

  useEffect(() => {
    try {
      setChatCollapsed(localStorage.getItem(CHAT_COLLAPSED_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  function setCollapsed(next: boolean) {
    setChatCollapsed(next);
    try {
      localStorage.setItem(CHAT_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  const assigneeMembers = useMemo(() => {
    const team = teams.find((item) => item.id === teamId);
    if (team?.members.length) {
      return team.members.map((member) => ({
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
      }));
    }
    return workspaceMembers.length ? workspaceMembers : initialAssignees;
  }, [teamId, teams, workspaceMembers, initialAssignees]);

  const pendingCount = useMemo(
    () => tasks.filter((task) => isPendingStatus(task.status)).length,
    [tasks]
  );

  function handleCreated(task: TaskWithAssignee) {
    setTasks((current) => [task, ...current]);
  }

  function handleTaskUpdate(task: TaskWithAssignee) {
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? task : item))
    );
    setSelectedTask(task);
  }

  function handleOpenTask(task: TaskWithAssignee) {
    setSelectedTask(task);
    setDetailOpen(true);
  }

  const board = (
    <KanbanBoard
      projectId={projectId}
      tasks={tasks}
      onTasksChange={setTasks}
      onOpenTask={handleOpenTask}
    />
  );

  const chat = (
    <ProjectChat
      projectId={projectId}
      currentUserId={currentUserId}
      members={workspaceMembers}
      initialMessages={initialMessages}
      onMinimize={() => setCollapsed(true)}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="animate-fade-in space-y-4 border-b border-border/50 px-6 py-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="animate-fade-up min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
              Projeto
            </p>
            <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground">
              {projectName}
            </h1>
          </div>
          <div className="animate-fade-up stagger-1 flex flex-wrap items-center gap-2">
            <ProjectTeamSelect
              projectId={projectId}
              teams={teams}
              initialTeamId={teamId}
              onTeamChange={setTeamId}
            />
            <FocusModeButton initialFocusModeUntil={focusModeUntil} />
            <CreateTaskDialog
              projectId={projectId}
              members={assigneeMembers}
              onCreated={handleCreated}
            />
          </div>
        </div>
        <div className="animate-fade-up stagger-2">
          <DaySummary pendingCount={pendingCount} />
        </div>
      </header>

      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="min-w-0 flex-1">{board}</div>

        {chatCollapsed ? (
          <aside className="flex w-12 shrink-0 flex-col items-center border-l border-border/50 bg-card/55 py-3 backdrop-blur-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir chat"
              title="Expandir chat"
              className="rounded-xl text-muted-foreground hover:bg-brand/10 hover:text-brand"
            >
              <MessageCircle className="size-4" />
            </Button>
            <span
              className={cn(
                "mt-3 origin-center rotate-180 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase",
                "[writing-mode:vertical-rl]"
              )}
            >
              Chat
            </span>
          </aside>
        ) : null}

        <aside
          className={cn(
            "w-[22rem] shrink-0 border-l border-border/50 bg-card/55 backdrop-blur-md transition-[width] duration-200 xl:w-96",
            chatCollapsed && "hidden"
          )}
          aria-hidden={chatCollapsed}
        >
          {chat}
        </aside>
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <Tabs defaultValue="tasks" className="flex h-full flex-col gap-0">
          <div className="border-b border-border/50 px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="tasks" className="flex-1">
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                Chat
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="tasks"
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
            {board}
          </TabsContent>
          <TabsContent
            value="chat"
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
            {chat}
          </TabsContent>
        </Tabs>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        projectId={projectId}
        currentUserId={currentUserId}
        members={assigneeMembers}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}
