
-- ============================================================
-- Split de Pagamento de Gorjetas
-- Free: artista recebe 70% / plataforma fica com 30%
-- PRO:  artista recebe 100% / sem taxa
-- ============================================================

-- Constantes de taxa (fácil de ajustar no futuro)
-- FREE_TAXA  = 0.30 (30%)
-- PRO_TAXA   = 0.00 (0%)

CREATE OR REPLACE FUNCTION public.confirm_pix_with_limit_check(p_pedido_id uuid, p_artista_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido           RECORD;
  v_is_pro           boolean;
  v_current_total    numeric;
  v_free_limit       numeric := 300.00;   -- limite mensal Free (ajustável)
  v_gorjeta_id       uuid;
  v_taxa_percentual  numeric;
  v_taxa_valor       numeric;
  v_liquido_artista  numeric;
BEGIN
  -- 1. Buscar o pedido
  SELECT id, valor, status, cliente_id, cliente_nome, session_id, musica, mensagem, artista_id, estabelecimento_id
  INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id AND artista_id = p_artista_id;

  IF v_pedido.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PEDIDO_NOT_FOUND');
  END IF;

  IF v_pedido.status NOT IN ('aguardando_confirmacao_pix', 'aguardando_pix') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS');
  END IF;

  IF v_pedido.valor IS NULL OR v_pedido.valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_VALOR');
  END IF;

  -- 2. Verificar plano do artista
  v_is_pro := public.is_artist_pro(p_artista_id);

  -- 3. Calcular split
  IF v_is_pro THEN
    v_taxa_percentual := 0.00;   -- PRO: sem taxa
  ELSE
    v_taxa_percentual := 0.30;   -- Free: 30% para a plataforma
  END IF;

  v_taxa_valor      := ROUND((v_pedido.valor * v_taxa_percentual)::numeric, 2);
  v_liquido_artista := ROUND((v_pedido.valor - v_taxa_valor)::numeric, 2);

  -- 4. Registro de gorjeta com split correto (Limite removido por solicitação do usuário)

  -- 5. Registrar gorjeta com split correto
  INSERT INTO gorjetas (
    artista_id,
    cliente_id,
    cliente_nome,
    session_id,
    valor,
    taxa_plataforma,
    valor_liquido_artista,
    status_pagamento,
    pedido_musica,
    pedido_mensagem,
    estabelecimento_id
  ) VALUES (
    v_pedido.artista_id,
    v_pedido.cliente_id,
    v_pedido.cliente_nome,
    v_pedido.session_id,
    v_pedido.valor,          -- valor bruto (o que o fã pagou)
    v_taxa_valor,            -- taxa da plataforma (30% Free / 0% PRO)
    v_liquido_artista,       -- valor líquido (o que o artista recebe)
    'approved',
    v_pedido.musica,
    v_pedido.mensagem,
    v_pedido.estabelecimento_id
  )
  RETURNING id INTO v_gorjeta_id;

  -- 6. Fechar pedido
  UPDATE pedidos
  SET status = 'pendente'
  WHERE id = p_pedido_id;

  RETURN jsonb_build_object(
    'success',              true,
    'gorjeta_id',           v_gorjeta_id,
    'valor_bruto',          v_pedido.valor,
    'taxa_plataforma',      v_taxa_valor,
    'valor_liquido_artista', v_liquido_artista,
    'is_pro',               v_is_pro
  );
END;
$function$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.confirm_pix_with_limit_check(uuid, uuid) TO authenticated;
