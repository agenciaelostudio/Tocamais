# 🎸 TocaMais — Sessão de Desenvolvimento 02/05/2026

**Data:** 02 de Maio de 2026  
**Status do Projeto:** ✅ Funcional e em evolução contínua

---

## 🚀 O Que Foi Feito Hoje

### 1. 💸 Monetização — Taxa de 30% no Plano Free (Split Automático)
- Atualizado `src/config/platform.js`: taxa `free_artist_percentage` de 20% → **30%**
- Implementado split automático no `TwoStepPixPaymentDialog.jsx`:
  - **Artista Free** → PIX vai para a chave da **plataforma** (30% da plataforma, 70% ao artista após confirmação)
  - **Artista Pro** → PIX vai direto para a chave do **artista** (0% de taxa)
- A lógica de split é controlada por `activePixInfo` usando `PLATFORM_CONFIG`

---

### 2. 🔗 URLs Personalizadas (Slug)
- Adicionado campo `slug` na tabela `artist_profiles` (migration SQL)
- Artistas podem definir sua URL amigável em **Editar Perfil** (ex: `tocamais.app/joao-silva`)
- O sistema busca o perfil por **ID → Slug → busca geral** (busca resiliente)
- Slug gerado automaticamente no cadastro com base no nome artístico
- Campo de edição com preview ao vivo: `tocamais.app/seu-slug`

**Arquivos modificados:**
- `src/App.jsx` — nova rota `/:idOrSlug` pública
- `src/pages/ArtistPublicProfile.jsx` — lógica de busca por ID ou slug
- `src/pages/ArtistProfileEdit.jsx` — campo de slug com slugify automático
- `src/api/base44Client.js` — função `generateSlug()` no cadastro

---

### 3. 📱 QR Code Exclusivo por Artista
- Criado componente `src/components/dashboard/ArtistQRCard.jsx`
- Nova aba **"Divulgação"** no painel do artista (Dashboard)
- Gera QR Code com design premium (glassmorphism dark) apontando para o perfil do artista
- Botão **"Baixar para Impressão"** (PNG alta resolução via `html2canvas`)
- Botão **"Compartilhar Link"** (Web Share API com fallback para clipboard)
- QR Code usa o **slug** do artista quando disponível (URL curta)

**Bibliotecas usadas:** `qrcode`, `html2canvas` (já no projeto)

---

### 4. 🔍 SEO — Metatags em Todas as Páginas
- Adicionado `<SEOHead />` em:
  - `Explore.jsx` — "Explorar Talentos — TocaMais"
  - `Marketplace.jsx` — "Contratar Shows — TocaMais"
  - `ArtistDashboard.jsx` — "Painel do Artista — TocaMais"
  - `FanDashboard.jsx` — "Painel do Fan — TocaMais"

---

## 🧪 Testes Realizados

| Funcionalidade | Status |
|---|---|
| URL `/testslug` carrega perfil do artista | ✅ OK |
| Perfil não redireciona para /explore | ✅ OK |
| Botões "Enviar Gorjeta" e "Pedir Música" visíveis | ✅ OK |
| Badge "Ao Vivo Agora" exibido | ✅ OK |
| QR Code gerado na aba Divulgação | ✅ OK |
| Download do QR Code | ✅ OK |

---

## ⚠️ Ação Pendente (Supabase)

Aplicar o SQL de migração no painel do Supabase:

```sql
-- Adicionar coluna slug na tabela artist_profiles
ALTER TABLE public.artist_profiles
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Adicionar coluna is_pro
ALTER TABLE public.artist_profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;
```

Arquivo completo: `supabase/migrations/001_gorjetas_system.sql`

---

## 📁 Estrutura de Arquivos Importantes

```
src/
├── api/
│   └── base44Client.js           ← generateSlug() no cadastro
├── components/
│   ├── dashboard/
│   │   ├── ArtistQRCard.jsx      ← NOVO — QR Code premium
│   │   └── TipsSummary.jsx
│   ├── shared/
│   │   └── TipBadge.jsx
│   └── TwoStepPixPaymentDialog.jsx ← Split 30% implementado
├── config/
│   └── platform.js               ← Taxa 30% free / 0% pro
├── pages/
│   ├── ArtistDashboard.jsx       ← Aba Divulgação com QR Code
│   ├── ArtistProfileEdit.jsx     ← Campo slug
│   ├── ArtistPublicProfile.jsx   ← Busca por ID ou Slug
│   └── Marketplace.jsx
└── App.jsx                       ← Rota /:idOrSlug pública
supabase/
└── migrations/
    └── 001_gorjetas_system.sql   ← Coluna slug + is_pro
```

---

## 💡 Próximos Passos Sugeridos

1. **Aplicar migration** no Supabase (coluna `slug` e `is_pro`)
2. **Cada artista define seu slug** no perfil e imprime o QR Code
3. Considerar **Stripe/Asaas** para automatizar o split financeiro em produção
4. **Deploy** no domínio `tocamais.app`
5. Configurar **Open Graph** no `SEOHead` para previews ricos no WhatsApp/Instagram

---

*Gerado automaticamente pelo Agente de Desenvolvimento TocaMais — Antigravity*
