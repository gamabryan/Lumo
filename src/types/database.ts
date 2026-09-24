export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type MessagePriorityTag = "normal" | "important" | "urgent";
export type WorkspaceRole = "owner" | "admin" | "member";
export type TimeEntryKind = "project" | "admin";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          focus_mode_until: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          focus_mode_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          focus_mode_until?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          team_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          team_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          team_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          sender_id: string;
          content: string;
          priority_tag: MessagePriorityTag;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sender_id: string;
          content: string;
          priority_tag?: MessagePriorityTag;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          sender_id?: string;
          content?: string;
          priority_tag?: MessagePriorityTag;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          id: string;
          file_url: string;
          name: string;
          task_id: string | null;
          message_id: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_url: string;
          name: string;
          task_id?: string | null;
          message_id?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          file_url?: string;
          name?: string;
          task_id?: string | null;
          message_id?: string | null;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      time_entries: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          user_id: string;
          kind: TimeEntryKind;
          entry_date: string;
          hours: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          user_id: string;
          kind?: TimeEntryKind;
          entry_date: string;
          hours: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          user_id?: string;
          kind?: TimeEntryKind;
          entry_date?: string;
          hours?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { p_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: { p_workspace_id: string };
        Returns: boolean;
      };
      find_user_for_invite: {
        Args: { p_email: string };
        Returns: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
        }[];
      };
      is_allocated_to_project: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      task_status: TaskStatus;
      task_priority: TaskPriority;
      message_priority_tag: MessagePriorityTag;
      workspace_role: WorkspaceRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];

export type WorkspaceMemberProfile = Pick<
  User,
  "id" | "name" | "email" | "avatar_url"
> & {
  role: WorkspaceRole;
};

export type TeamMemberProfile = Pick<
  User,
  "id" | "name" | "email" | "avatar_url"
>;

export type TeamWithMembers = Team & {
  members: TeamMemberProfile[];
};

export type TaskWithAssignee = Task & {
  assignee: Pick<User, "id" | "name" | "avatar_url"> | null;
};

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type ProjectFile = Database["public"]["Tables"]["files"]["Row"];
export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];

export type AllocatedTimesheetProject = Pick<
  Project,
  "id" | "name" | "workspace_id"
> & {
  team_id: string;
  teamName: string;
};

export type MessageWithSender = Message & {
  sender: Pick<User, "id" | "name" | "avatar_url">;
  files?: ProjectFile[];
};
