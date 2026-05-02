-- ============================================================
-- MIGRATION: Sistema de Gorjetas TocaMais
-- Execute este arquivo completo no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar colunas PIX no artist_profiles
ALTER TABLE public.artist_profiles
  ADD COLUMN IF NOT EXISTS pix_chave text,
  ADD COLUMN IF NOT EXISTS pix_tipo_chave text DEFAULT 'aleatoria',
  ADD COLUMN IF NOT EXISTS show_formats jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tour_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- 2. Atualizar tabela pedidos: adicionar coluna valor + novos status
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS valor numeric,
  ADD COLUMN IF NOT EXISTS estabelecimento_id uuid,
  ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS excluido boolean NOT NULL DEFAULT false;

-- Remover constraint antiga de status e criar nova com os valores corretos
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_status_check CHECK (
    status IN (
      'pendente',
      'aguardando_pix',
      'aguardando_confirmacao_pix',
      'aceito',
      'concluido',
      'recusado'
    )
  );

-- 3. Criar tabela gorjetas
CREATE TABLE IF NOT EXISTS public.gorjetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id uuid REFERENCES public.artist_profiles (id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  cliente_nome text,
  session_id text,
  valor numeric NOT NULL,
  valor_liquido_artista numeric NOT NULL,
  taxa_plataforma numeric NOT NULL DEFAULT 0,
  status_pagamento text NOT NULL DEFAULT 'approved'
    CHECK (status_pagamento IN ('pending', 'approved', 'rejected')),
  pedido_id uuid REFERENCES public.pedidos (id) ON DELETE SET NULL,
  pedido_musica text,
  pedido_mensagem text,
  estabelecimento_id uuid,
  arquivado boolean NOT NULL DEFAULT false,
  excluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gorjetas_artista_id ON public.gorjetas (artista_id);
CREATE INDEX IF NOT EXISTS idx_gorjetas_session_id ON public.gorjetas (session_id);
CREATE INDEX IF NOT EXISTS idx_gorjetas_cliente_id ON public.gorjetas (cliente_id);

DROP TRIGGER IF EXISTS set_gorjetas_updated_at ON public.gorjetas;
CREATE TRIGGER set_gorjetas_updated_at
  BEFORE UPDATE ON public.gorjetas
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. RLS da tabela gorjetas
ALTER TABLE public.gorjetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gorjetas_anon_insert" ON public.gorjetas;
DROP POLICY IF EXISTS "gorjetas_artist_read" ON public.gorjetas;
DROP POLICY IF EXISTS "gorjetas_artist_manage" ON public.gorjetas;
DROP POLICY IF EXISTS "gorjetas_client_read_own" ON public.gorjetas;

-- Artista vê tudo das suas gorjetas
CREATE POLICY "gorjetas_artist_read"
  ON public.gorjetas FOR SELECT
  TO authenticated
  USING (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
    OR cliente_id = (SELECT auth.uid())
  );

-- Artista pode atualizar e deletar as suas
CREATE POLICY "gorjetas_artist_manage"
  ON public.gorjetas FOR ALL
  TO authenticated
  USING (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
  );

-- 5. Atualizar RLS de pedidos para anônimos com session_id
DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;
CREATE POLICY "pedidos_public_insert"
  ON public.pedidos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "pedidos_read_own" ON public.pedidos;
CREATE POLICY "pedidos_read_own"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
    OR cliente_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "pedidos_manage_own" ON public.pedidos;
CREATE POLICY "pedidos_manage_own"
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
  );

-- 6. RPC: cliente declara que fez o PIX
CREATE OR REPLACE FUNCTION public.confirm_direct_pix_payment(
  p_pedido_id uuid,
  p_valor numeric,
  p_session_id text DEFAULT NULL,
  p_cliente_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
BEGIN
  -- Validações básicas
  IF p_valor IS NULL OR p_valor < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'VALOR_INVALIDO', 'message', 'Valor mínimo é R$ 1,00');
  END IF;

  -- Buscar pedido
  SELECT * INTO v_pedido FROM pedidos WHERE id = p_pedido_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PEDIDO_NAO_ENCONTRADO');
  END IF;

  -- Validar ownership (session ou cliente)
  IF v_pedido.session_id IS DISTINCT FROM p_session_id
     AND v_pedido.cliente_id IS DISTINCT FROM p_cliente_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'SEM_PERMISSAO');
  END IF;

  -- Validar status
  IF v_pedido.status != 'aguardando_pix' THEN
    RETURN jsonb_build_object('success', false, 'error', 'STATUS_INVALIDO', 'status_atual', v_pedido.status);
  END IF;

  -- Atualizar pedido
  UPDATE pedidos
    SET valor = p_valor,
        status = 'aguardando_confirmacao_pix',
        updated_at = now()
  WHERE id = p_pedido_id;

  RETURN jsonb_build_object('success', true, 'pedido_id', p_pedido_id, 'valor', p_valor);
END;
$$;

-- 7. RPC: artista confirma recebimento (com split 30% para Free)
CREATE OR REPLACE FUNCTION public.confirm_pix_receipt(
  p_pedido_id uuid,
  p_artista_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
  v_artista artist_profiles%ROWTYPE;
  v_gorjeta_id uuid;
  v_taxa_percent numeric;
  v_taxa_valor numeric;
  v_valor_liquido numeric;
BEGIN
  -- Buscar pedido
  SELECT * INTO v_pedido
    FROM pedidos
   WHERE id = p_pedido_id
     AND artista_id = p_artista_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PEDIDO_NAO_ENCONTRADO');
  END IF;

  -- Buscar informações do artista (para ver se é Pro)
  SELECT * INTO v_artista FROM artist_profiles WHERE id = p_artista_id;

  -- Validar status
  IF v_pedido.status NOT IN ('aguardando_confirmacao_pix', 'aguardando_pix') THEN
    RETURN jsonb_build_object('success', false, 'error', 'STATUS_INVALIDO', 'status_atual', v_pedido.status);
  END IF;

  -- Validar valor
  IF v_pedido.valor IS NULL OR v_pedido.valor < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'VALOR_INVALIDO');
  END IF;

  -- Calcular Taxa (30% se não for Pro)
  IF v_artista.is_pro THEN
    v_taxa_percent := 0;
  ELSE
    v_taxa_percent := 0.30;
  END IF;

  v_taxa_valor := ROUND(v_pedido.valor * v_taxa_percent, 2);
  v_valor_liquido := v_pedido.valor - v_taxa_valor;

  -- Criar gorjeta
  INSERT INTO gorjetas (
    artista_id,
    cliente_id,
    cliente_nome,
    session_id,
    valor,
    valor_liquido_artista,
    taxa_plataforma,
    status_pagamento,
    pedido_id,
    pedido_musica,
    pedido_mensagem
  ) VALUES (
    v_pedido.artista_id,
    v_pedido.cliente_id,
    v_pedido.cliente_nome,
    v_pedido.session_id,
    v_pedido.valor,
    v_valor_liquido,
    v_taxa_valor,
    'approved',
    v_pedido.id,
    v_pedido.musica,
    v_pedido.mensagem
  )
  RETURNING id INTO v_gorjeta_id;

  -- Voltar pedido para fila normal
  UPDATE pedidos
    SET status = 'pendente',
        updated_at = now()
  WHERE id = p_pedido_id;

  -- Atualizar contador total do artista (valor bruto ou líquido? Geralmente bruto para estatísticas)
  UPDATE artist_profiles
    SET total_tips = COALESCE(total_tips, 0) + v_pedido.valor,
        updated_at = now()
  WHERE id = p_artista_id;

  RETURN jsonb_build_object(
    'success', true,
    'gorjeta_id', v_gorjeta_id,
    'valor_bruto', v_pedido.valor,
    'valor_liquido', v_valor_liquido,
    'taxa', v_taxa_valor
  );
END;
$$;

-- 8. RPC: buscar chave PIX do artista (segurança)
CREATE OR REPLACE FUNCTION public.get_artist_pix_info(p_artist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chave text;
  v_tipo text;
BEGIN
  SELECT pix_chave, pix_tipo_chave
    INTO v_chave, v_tipo
    FROM artist_profiles
   WHERE id = p_artist_id;

  IF v_chave IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'pix_chave', v_chave,
    'pix_tipo_chave', COALESCE(v_tipo, 'aleatoria')
  );
END;
$$;

-- Permissões para as RPCs
GRANT EXECUTE ON FUNCTION public.confirm_direct_pix_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_pix_receipt TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_artist_pix_info TO anon, authenticated;
