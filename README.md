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

Opcional (MVP / login sem confirmar email):

- Desative **Confirm email** em Authentication → Providers → Email  
  ou rode `supabase/confirm-users-dev.sql`

4. Suba o app:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).
