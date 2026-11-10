# Arquitetura — Lumo

Documento de visão da arquitetura do MVP Lumo: SaaS de colaboração leve para microequipes (workspaces, projetos, kanban, chat em tempo real, arquivos, modo concentração, timesheet e presença).

---

## Visão geral

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Browser    │────▶│  Next.js App Router  │────▶│  Supabase            │
│  (React)    │◀────│  Server Actions + RSC │◀────│  Auth / Postgres     │
│  Zustand    │     │  Proxy (sessão)       │     │  Realtime / Storage  │
└─────────────┘     └──────────────────────┘     └─────────────────────┘
```

O frontend é um app **Next.js 16** (App Router, TypeScript, React 19). Persistência, autenticação, realtime e arquivos ficam no **Supabase**. Mutações passam por **Server Actions**; leituras iniciais usam **Server Components** + cliente Supabase no servidor. Estado de UI (workspace ativo, foco, presença online) usa **Zustand**.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Estilo | Tailwind CSS 4 + shadcn/ui (Base UI) |
| Auth / DB / Realtime / Storage | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Estado de cliente | Zustand |
| DnD (kanban) | `@dnd-kit` |
| Tema | `next-themes` (claro / escuro / sistema) |

---

## Estrutura de pastas

```
src/
├── app/                    # Rotas (App Router)
│   ├── (auth)/             # login, signup
│   ├── (dashboard)/        # shell autenticado, projetos, timesheet
│   ├── layout.tsx          # fonts, ThemeProvider, toaster
│   └── page.tsx            # redirect → /dashboard ou /login
├── actions/                # Server Actions (mutações)
├── components/             # UI por domínio
├── lib/                    # supabase clients, app-data, helpers de domínio
├── stores/                 # Zustand (auth, workspace, focus, presence)
├── types/                  # tipos espelhados do Postgres
└── proxy.ts                # refresh de sessão Supabase (convenção Next.js 16)

supabase/
├── schema.sql              # tabelas core + RLS base (+ presence no users)
├── storage.sql             # bucket project-files
├── workspace_members.sql   # membros, roles, RPCs
├── teams.sql               # equipes + projects.team_id
├── timesheet.sql           # time_entries + is_allocated_to_project
├── presence.sql            # migração: coluna presence_status (se schema antigo)
├── fix-timesheet-allocation.sql  # ajuste de regra de alocação (legado)
├── fix-invite-rpc.sql      # ajuste find_user_for_invite / schema cache
└── confirm-users-dev.sql   # opcional (dev sem confirm email)
```

---

## Rotas e layouts

| Rota | Papel |
|------|--------|
| `/` | Redireciona conforme sessão |
| `/login`, `/signup` | Auth (layout `(auth)`) |
| `/dashboard` | Empty state: escolher/criar projeto |
| `/dashboard/projects/[projectId]` | Workspace do projeto (kanban + chat) |
| `/dashboard/timesheet` | Lançamento semanal de horas (`?week=YYYY-MM-DD`) |

O layout `(dashboard)` carrega `getAppShellData()` (perfil com presença, workspace ativo, projetos, membros, equipes) e monta a **sidebar**. Sem sessão → redirect para `/login`.

O **proxy** (`src/proxy.ts` → `lib/supabase/middleware.ts`) atualiza cookies de sessão em cada request (substitui o antigo `middleware.ts` do Next.js 15).

---

## Domínio de dados

Hierarquia principal:

```
User (focus_mode_until, presence_status)
 └─ Workspace (owner + workspace_members)
     ├─ Members (roles: owner | admin | member)
     ├─ Teams (+ team_members)
     ├─ Time entries (project | admin, por dia)
     └─ Projects (opcionalmente vinculados a uma Team)
         ├─ Tasks (status, priority, assignee, description)
         ├─ Messages (priority_tag, realtime)
         └─ Files (task_id e/ou message_id → Storage)
```

### Tabelas (resumo)

- **users** — espelho de `auth.users` (trigger `handle_new_user`); `focus_mode_until`, `presence_status`
- **workspaces** / **workspace_members** — multi-tenant leve
- **teams** / **team_members** — equipes dentro do workspace; `projects.team_id` define pool de assignees e alocação de timesheet
- **projects**, **tasks**, **messages**, **files**
- **time_entries** — horas por usuário/dia; `kind = project` (exige projeto alocado via equipe) ou `kind = admin` (sem projeto)
- **Storage** — bucket privado `project-files` + URLs assinadas

### Segurança

- **RLS** no Postgres: acesso via ownership / `is_workspace_member` / `is_workspace_admin` / `is_allocated_to_project`
- Cliente usa apenas **anon / publishable key** (nunca `service_role` no browser)
- Convite por email: RPC `find_user_for_invite` (contorna limitação de SELECT em `users`)

Scripts SQL devem ser aplicados nesta ordem: `schema` → `storage` → `workspace_members` → `teams` → `timesheet` → `presence` (se o schema base ainda não tiver a coluna). Fixes opcionais: `fix-timesheet-allocation`, `fix-invite-rpc`.

---

## Fluxo de dados

### Leitura (SSR)

1. Layout/dashboard chama `getAppShellData()`; a page do projeto consulta `tasks` / `messages` / membros / teams; a page de timesheet chama `getTimesheetWeek()`.
2. Dados iniciais vão como props para componentes client (`ProjectWorkspace`, `KanbanBoard`, `ProjectChat`, `TimesheetView`).

### Escrita (Server Actions)

Módulo `src/actions/`:

| Action | Responsabilidade |
|--------|------------------|
| `workspace.ts` | criar/renomear workspace, projeto ativo (cookie), criar projeto |
| `members.ts` | listar / convidar / remover membros |
| `teams.ts` | CRUD de equipes e vínculo a projeto |
| `tasks.ts` | criar, status, assignee, descrição |
| `messages.ts` | enviar mensagem |
| `files.ts` | listar / remover metadados de arquivo |
| `focus-mode.ts` | `focus_mode_until` do usuário |
| `presence.ts` | `presence_status` do usuário (persistido) |
| `timesheet.ts` | semana de lançamentos, upsert e delete de `time_entries` |

Após mutações relevantes: `revalidatePath` do projeto/layout/timesheet.

### Realtime (cliente)

- **Chat:** `ProjectChat` assina `postgres_changes` em `messages` / `files` do projeto, faz merge no estado local e limpa a subscription no unmount.
- **Presença:** `PresenceProvider` (na sidebar) entra no canal Supabase Presence `workspace-presence:{workspaceId}`, faz `track` do status e sincroniza quem está online no `presence-store`. Avatares (`UserStatusAvatar`) leem esse store; quem não está no canal aparece como offline.

### Arquivos

Upload via cliente Storage → registro em `files` (ligado a task ou message) → download com signed URL (`lib/storage.ts`).

### Timesheet

1. Só entram projetos com `team_id` em que o usuário é `team_member` (`is_allocated_to_project`).
2. Grid semanal (seg–dom); uma entrada por projeto/dia e uma linha admin por workspace/dia.
3. Persistência via `saveTimeEntry` / `deleteTimeEntry`; helpers de data/horas em `lib/timesheet.ts`.

---

## Camada de UI (por domínio)

| Pasta | Função |
|-------|--------|
| `layout/` | Sidebar, switcher de workspace, projetos, membros, equipes, link Timesheet, footer (avatar + presença + tema + sair) |
| `projects/` | `ProjectWorkspace` — header, resumo do dia, kanban, chat (minimizar no desktop) |
| `tasks/` | Board DnD, colunas, cards, criar tarefa, sheet de detalhe |
| `chat/` | Lista, composer (tags de prioridade), itens |
| `files/` | Upload pendente / lista |
| `focus/` | Modo Concentração (silencia mensagens não urgentes) |
| `presence/` | Provider realtime, menu de status, avatar com bolinha |
| `timesheet/` | Grade semanal de horas |
| `theme/` | Provider + toggle claro/escuro |
| `auth/` | Formulários de login/signup |
| `ui/` | Primitivos shadcn |

**Responsividade:** desktop = kanban + painel de chat; mobile = tabs Tarefas / Chat.

---

## Estado no cliente (Zustand)

| Store | Uso |
|-------|-----|
| `workspace-store` | workspaces, ativo, projetos (sync com shell) |
| `focus-store` | `focusModeUntil` (UI + filtro de mensagens) |
| `presence-store` | mapa `userId → status` de quem está online no canal Presence |
| `auth-store` | limpeza local no sign-out |

Preferências locais (ex.: chat colapsado) usam `localStorage`. Workspace ativo também é persistido em cookie `lumo_workspace_id`.

**Presença em duas camadas:** `users.presence_status` = preferência persistida (menu no footer); canal Presence = “online agora” para a bolinha nos avatares.

---

## Autenticação

1. Signup/login via Supabase Auth no client (`components/auth/*`).
2. Trigger cria linha em `public.users`.
3. Proxy mantém sessão; layout do dashboard exige usuário.
4. Sign-out no `UserFooter` (client Supabase + limpeza do `auth-store`).
5. Primeiro acesso sem workspace: `getAppShellData` cria workspace default e membership de owner.

---

## Decisões de design

- **Server Actions** em vez de API Routes REST para o MVP — menos boilerplate, tipagem compartilhada.
- **RLS no banco** como fronteira de autorização principal.
- **Estado otimista leve** no kanban/chat/timesheet; servidor como fonte da verdade após action/realtime.
- **Equipes opcionais** — sem equipe, assignees = membros do workspace; timesheet de projeto exige equipe + membership.
- **Modo Concentração** — filtro de UI + campo no perfil; não apaga mensagens.
- **Presença** — status persistido + Presence realtime por workspace (não é lista de “última atividade” no Postgres).
- **Proxy (Next.js 16)** no lugar de `middleware.ts` para refresh de cookies; autorização real continua no layout + RLS.

---

## Extensões naturais (fora do MVP)

- Notificações push / e-mail
- Comentários por tarefa
- Histórico de atividade / auditoria
- Papéis granulares por projeto
- Relatórios / exportação de timesheet
- Testes e CI

---

## Como navegar o código

1. Entender o shell: `app/(dashboard)/layout.tsx` → `lib/app-data.ts` → `components/layout/app-sidebar.tsx`
2. Entender o projeto: `app/.../projects/[projectId]/page.tsx` → `components/projects/project-workspace.tsx`
3. Entender o timesheet: `app/.../timesheet/page.tsx` → `actions/timesheet.ts` → `components/timesheet/timesheet-view.tsx`
4. Entender a presença: `components/presence/presence-provider.tsx` → `stores/presence-store.ts` → `user-status-avatar.tsx`
5. Mutações: `src/actions/*`
6. Modelo e políticas: `supabase/*.sql` + `src/types/database.ts`
