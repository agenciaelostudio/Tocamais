# TocaMais

Frontend React/Vite para descoberta de artistas, propostas, agenda, chat e relacionamento entre artistas, bares e publico.

O projeto foi preparado para rodar sem Base44, usando:

- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Vite + React`

## Variaveis de ambiente

Crie `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

> Para sincronizar a disponibilidade do artista com Google Agenda, configure um OAuth Client Web no Google Cloud e inclua `http://localhost:5173` (dev) e seu dominio de producao nos `Authorized JavaScript origins`.

## Rodando localmente

```bash
npm install
npm run dev
```

## Setup do backend gerenciado

Veja:

- [SUPABASE_SETUP.md](/C:/Users/Nathan/Documents/GitHub/maismais/SUPABASE_SETUP.md)
- [supabase/schema.sql](/C:/Users/Nathan/Documents/GitHub/maismais/supabase/schema.sql)

## Deploy

Veja:

- [DEPLOY_VPS.md](/C:/Users/Nathan/Documents/GitHub/maismais/DEPLOY_VPS.md)
