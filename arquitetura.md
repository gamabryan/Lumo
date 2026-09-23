# Arquitetura — Lumo

Documento de visão da arquitetura do MVP Lumo: SaaS de colaboração leve para microequipes (workspaces, projetos, kanban, chat em tempo real, arquivos e modo concentração).

---

## Visão geral

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Browser    │────▶│  Next.js App Router  │────▶│  Supabase            │
│  (React)    │◀────│  Server Actions + RSC │◀────│  Auth / Postgres     │
│  Zustand    │     │  Middleware (sessão)  │     │  Realtime / Storage  │
└─────────────┘     └──────────────────────┘     └─────────────────────┘
```

O frontend é um app **Next.js 16** (App Router, TypeScript). Persistência, autenticação, realtime e arquivos ficam no **Supabase**. Mutações passam por **Server Actions**; leituras iniciais usam **Server Components** + cliente Supabase no servidor. Estado de UI (workspace ativo, foco) usa **Zustand**.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js (App Router) + React 19 |
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
│   ├── (dashboard)/        # shell autenticado + projetos
│   ├── layout.tsx          # fonts, ThemeProvider, toaster
│   └── page.tsx            # redirect → /dashboard ou /login
├── actions/                # Server Actions (mutações)
├── components/             # UI por domínio (auth, chat, tasks, layout…)
├── lib/                    # supabase clients, app-data, helpers
├── stores/                 # Zustand (auth, workspace, focus)
├── types/                  # tipos gerados/espelhados do Postgres
└── middleware.ts           # refresh de sessão Supabase

supabase/
├── schema.sql              # tabelas core + RLS base
├── storage.sql             # bucket project-files
├── workspace_members.sql   # membros, roles, RPCs
├── teams.sql               # equipes + projects.team_id
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

O layout `(dashboard)` carrega `getAppShellData()` (workspace ativo, projetos, membros, equipes) e monta a **sidebar**. Sem sessão → redirect para `/login`.

O **middleware** (`src/middleware.ts` → `lib/supabase/middleware.ts`) atualiza cookies de sessão em cada request.

---

## Domínio de dados

Hierarquia principal:

```
User
 └─ Workspace (owner + workspace_members)
     ├─ Members (roles: owner | admin | member)
     ├─ Teams (+ team_members)
     └─ Projects (opcionalmente vinculados a uma Team)
         ├─ Tasks (status, priority, assignee, description)
         ├─ Messages (priority_tag, realtime)
         └─ Files (task_id e/ou message_id → Storage)
```

### Tabelas (resumo)

- **users** — espelho de `auth.users` (trigger `handle_new_user`); inclui `focus_mode_until`
- **workspaces** / **workspace_members** — multi-tenant leve
- **teams** / **team_members** — equipes dentro do workspace; `projects.team_id` define pool de assignees
- **projects**, **tasks**, **messages**, **files**
- **Storage** — bucket privado `project-files` + URLs assinadas

### Segurança

- **RLS** no Postgres: acesso via ownership / `is_workspace_member` / `is_workspace_admin`
- Cliente usa apenas **anon / publishable key** (nunca `service_role` no browser)
- Convite por email: RPC `find_user_for_invite` (contorna limitação de SELECT em `users`)

Scripts SQL devem ser aplicados nesta ordem: `schema` → `storage` → `workspace_members` → `teams`.

---

## Fluxo de dados

### Leitura (SSR)

1. Layout/dashboard chama `getAppShellData()` ou a page do projeto consulta `tasks` / `messages` / membros / teams.
2. Dados iniciais vão como props para componentes client (`ProjectWorkspace`, `KanbanBoard`, `ProjectChat`).

### Escrita (Server Actions)

Módulo `src/actions/`:

| Action | Responsabilidade |
|--------|------------------|
| `workspace.ts` | criar/renomear workspace, projeto ativo (cookie), criar projeto |
| `members.ts` | listar / convidar / remover membros |
| `teams.ts` | CRUD de equipes e vínculo a projeto |
| `tasks.ts` | criar, status, assignee, descrição |
| `messages.ts` | enviar mensagem |
| `files.ts` | metadados de arquivo |
| `focus-mode.ts` | `focus_mode_until` do usuário |

Após mutações relevantes: `revalidatePath` do projeto/layout.

### Realtime (cliente)

`ProjectChat` assina canais Supabase (`postgres_changes` em `messages` / `files` do projeto), faz merge no estado local e limpa a subscription no unmount.

### Arquivos

Upload via cliente Storage → registro em `files` (ligado a task ou message) → download com signed URL (`lib/storage.ts`).

---

## Camada de UI (por domínio)

| Pasta | Função |
|-------|--------|
| `layout/` | Sidebar, switcher de workspace, projetos, membros, equipes, footer (tema + sair) |
| `projects/` | `ProjectWorkspace` — header, resumo do dia, kanban, chat (minimizar no desktop) |
| `tasks/` | Board DnD, colunas, cards, criar tarefa, sheet de detalhe |
| `chat/` | Lista, composer (tags de prioridade), itens |
| `files/` | Upload pendente / lista |
| `focus/` | Modo Concentração (silencia mensagens não urgentes) |
| `theme/` | Provider + toggle claro/escuro |
| `ui/` | Primitivos shadcn |

**Responsividade:** desktop = kanban + painel de chat; mobile = tabs Tarefas / Chat.

---

## Estado no cliente (Zustand)

| Store | Uso |
|-------|-----|
| `workspace-store` | workspaces, ativo, projetos (sync com shell) |
| `focus-store` | `focusModeUntil` (UI + filtro de mensagens) |
| `auth-store` | limpeza local no sign-out |

Preferências locais (ex.: chat colapsado) usam `localStorage`. Workspace ativo também é persistido em cookie `lumo_workspace_id`.

---

## Autenticação

1. Signup/login via Supabase Auth no client (`components/auth/*`).
2. Trigger cria linha em `public.users`.
3. Middleware mantém sessão; layout do dashboard exige usuário.
4. Primeiro acesso sem workspace: `getAppShellData` cria workspace default e membership de owner.

---

## Decisões de design

- **Server Actions** em vez de API Routes REST para o MVP — menos boilerplate, tipagem compartilhada.
- **RLS no banco** como fronteira de autorização principal.
- **Estado otimista leve** no kanban/chat; servidor como fonte da verdade após action/realtime.
- **Equipes opcionais** — sem equipe, assignees = membros do workspace.
- **Modo Concentração** — filtro de UI + campo no perfil; não apaga mensagens.

---

## Extensões naturais (fora do MVP)

- Notificações push / e-mail
- Comentários por tarefa
- Histórico de atividade / auditoria
- Papéis granulares por projeto
- Testes e CI

---

## Como navegar o código

1. Entender o shell: `app/(dashboard)/layout.tsx` → `lib/app-data.ts` → `components/layout/app-sidebar.tsx`
2. Entender o projeto: `app/.../projects/[projectId]/page.tsx` → `components/projects/project-workspace.tsx`
3. Mutações: `src/actions/*`
4. Modelo e políticas: `supabase/*.sql` + `src/types/database.ts`
