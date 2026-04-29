# Setup do Supabase

Este projeto foi adaptado para rodar sem Base44. O frontend agora espera `Supabase Auth`, `Postgres` e `Storage`.

## 1. Criar o projeto no Supabase

Crie um novo projeto em [Supabase](https://supabase.com/docs/).

Depois copie:

- `Project URL`
- `anon public key`

## 2. Rodar o schema SQL

No painel do Supabase:

1. abra `SQL Editor`
2. cole o arquivo [`supabase/schema.sql`](/C:/Users/Nathan/Documents/GitHub/maismais/supabase/schema.sql)
3. execute

Esse script cria:

- tabelas principais
- trigger para espelhar `auth.users` em `public.users`
- policies de RLS
- bucket `media`

## 3. Configurar Auth

Pelos docs oficiais do Supabase Auth, signup com email/senha depende das configuracoes do provedor e da confirmacao de email:

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)

Para o fluxo mais simples deste app, recomendo:

- habilitar `Email` provider
- definir `Site URL` para `https://tocamais.app`
- adicionar `http://localhost:5173` em `Redirect URLs`
- desabilitar `Confirm email` se voce quiser login imediato apos cadastro

Se mantiver confirmacao de email habilitada, o app cria a conta, mas o usuario pode precisar confirmar o email antes de entrar.

## 4. Configurar Storage

O schema ja cria o bucket `media`. O frontend usa upload publico para:

- avatar de artista
- capa de artista
- foto do bar

Referencia oficial:

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [JavaScript upload](https://supabase.com/docs/reference/javascript/storage-from-upload)

## 5. Variaveis locais

Crie `.env.local` a partir de [`.env.example`](/C:/Users/Nathan/Documents/GitHub/maismais/.env.example):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

### Google Agenda (opcional)

Para habilitar a sincronizacao da disponibilidade dos artistas com a Google Agenda:

1. crie um `OAuth Client ID` do tipo `Web application` no Google Cloud
2. adicione `http://localhost:5173` em `Authorized JavaScript origins`
3. adicione seu dominio de producao em `Authorized JavaScript origins`
4. copie o Client ID para `VITE_GOOGLE_CLIENT_ID`

## 6. Rodar localmente

```bash
npm install
npm run dev
```

## 7. Deploy na VPS

Para producao, crie `.env.production` com as mesmas variaveis:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

Depois siga o deploy em [DEPLOY_VPS.md](/C:/Users/Nathan/Documents/GitHub/maismais/DEPLOY_VPS.md).
