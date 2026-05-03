-- ============================================================
-- MIGRATION: Sistema de Carteira e Saques (Pós-Split)
-- ============================================================

-- 1. Tabela de Saques (Payouts)
CREATE TABLE IF NOT EXISTS public.saques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id uuid REFERENCES public.artist_profiles (id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'processando', 'pago', 'recusado')),
  pix_chave text NOT NULL,
  pix_tipo_chave text NOT NULL,
  comprovante_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS para Saques
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saques_artist_read"
  ON public.saques FOR SELECT
  TO authenticated
  USING (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "saques_artist_insert"
  ON public.saques FOR INSERT
  TO authenticated
  WITH CHECK (
    artista_id IN (
      SELECT id FROM public.artist_profiles
      WHERE user_email = (SELECT auth.jwt() ->> 'email')
    )
  );

-- 3. Função para calcular Saldo Disponível
CREATE OR REPLACE FUNCTION public.get_artist_balance(p_artista_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_ganho numeric;
  v_total_sacado numeric;
BEGIN
  -- Soma de todas as gorjetas líquidas
  SELECT COALESCE(SUM(valor_liquido_artista), 0)
    INTO v_total_ganho
    FROM gorjetas
   WHERE artista_id = p_artista_id
     AND status_pagamento = 'approved';

  -- Soma de todos os saques já pagos ou processando
  SELECT COALESCE(SUM(valor), 0)
    INTO v_total_sacado
    FROM saques
   WHERE artista_id = p_artista_id
     AND status IN ('pendente', 'processando', 'pago');

  RETURN v_total_ganho - v_total_sacado;
END;
$$;
