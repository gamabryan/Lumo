# Lumo

**Colaboração leve para microequipes.** O Lumo junta num só lugar o que um time pequeno usa no dia a dia: projetos, tarefas, conversa e horas, sem a complexidade das ferramentas corporativas.

## Funcionalidades

- 🔐 **Autenticação** com Supabase Auth
- 🗂️ **Workspaces e projetos**, com convite de membros
- 📋 **Quadro kanban** com arrastar e soltar e atribuição de tarefas
- 💬 **Chat em tempo real** por projeto, com mensagens prioritárias
- 📎 **Arquivos** anexados aos projetos (Supabase Storage)
- 👥 **Equipes** vinculadas a projetos
- ⏱️ **Timesheet semanal** para os membros alocados lançarem horas
- 🟢 **Presença**: status disponível/ocupado no avatar
- 🌗 Tema claro e escuro

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (Auth, PostgreSQL, Realtime, Storage)
- Zustand
- dnd-kit (arrastar e soltar no kanban)

## Setup

1. Instale as dependências:

```bash
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env.local
```

Preencha no Supabase Dashboard (**Project Settings → API** ou botão **Connect**):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon ou publishable — **não** use `service_role`)

3. No SQL Editor, execute nesta ordem:

- `supabase/schema.sql`
- `supabase/storage.sql`
- `supabase/workspace_members.sql` (membros da equipe / atribuição de tarefas)
- `supabase/teams.sql` (equipes e vínculo a projetos)
- `supabase/timesheet.sql` (lançamento de horas nos projetos alocados)
- `supabase/presence.sql` (status disponível/ocupado no avatar)

Se o timesheet já estava aplicado e a regra de alocação mudou, rode também:

- `supabase/fix-timesheet-allocation.sql`

Se o convite de membros falhar com `find_user_for_invite` / schema cache, rode também:

- `supabase/fix-invite-rpc.sql`

Opcional (MVP / login sem confirmar email):

- Desative **Confirm email** em Authentication → Providers → Email  
  ou rode `supabase/confirm-users-dev.sql`

4. Suba o app:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new) (GitHub: `bryanfernandesVPN/lumo`).
2. Em **Environment Variables**, adicione (Production + Preview):

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |

3. Deploy. Anote a URL (ex.: `https://lumo-xxx.vercel.app`).
4. No Supabase → **Authentication → URL Configuration**:
   - **Site URL**: a URL da Vercel
   - **Redirect URLs**: `https://SEU-PROJETO.vercel.app/**` (e `http://localhost:3000/**` para dev)