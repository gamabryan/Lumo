# Lumo

SaaS de colaboração leve para microequipes.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, PostgreSQL, Realtime, Storage)
- Zustand

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