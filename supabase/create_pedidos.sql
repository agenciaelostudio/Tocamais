-- Criar tabela pedidos (apenas execute esto no SQL Editor)
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid REFERENCES public.artist_profiles (id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  cliente_nome text,
  session_id text,
  musica text NOT NULL,
  mensagem text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;
CREATE POLICY "pedidos_public_insert" ON public.pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "pedidos_read_own" ON public.pedidos;
CREATE POLICY "pedidos_read_own" ON public.pedidos FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS set_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER set_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();