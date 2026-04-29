-- ==========================================
-- CORRIGIR TABELA E INSERIR MÚSICAS
-- Execute no Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. Verificar estrutura atual da tabela
-- Se existir, ver colunas. Se não, criar.

DROP TABLE IF EXISTS public.musicas_repertorio CASCADE;

CREATE TABLE IF NOT EXISTS public.musicas_repertorio (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid REFERENCES public.artist_profiles (id) ON DELETE CASCADE,
  titulo text NOT NULL,
  autor text,
  genero text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.musicas_repertorio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "musicas_repertorio_public_read" ON public.musicas_repertorio;
CREATE POLICY "musicas_repertorio_public_read" ON public.musicas_repertorio FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "musicas_repertorio_manage_own" ON public.musicas_repertorio;
CREATE POLICY "musicas_repertorio_manage_own" ON public.musicas_repertorio FOR ALL TO authenticated
  USING (artista_id IN (SELECT id FROM public.artist_profiles WHERE user_email = (SELECT auth.jwt() ->> 'email')))
  WITH CHECK (artista_id IN (SELECT id FROM public.artist_profiles WHERE user_email = (SELECT auth.jwt() ->> 'email')));

DROP TRIGGER IF EXISTS set_musicas_repertorio_updated_at ON public.musicas_repertorio;
CREATE TRIGGER set_musicas_repertorio_updated_at BEFORE UPDATE ON public.musicas_repertorio FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Inserir músicas
INSERT INTO public.musicas_repertorio (artista_id, titulo, autor, genero)
SELECT ap.id, 'Aguas de Marco', 'Tom Jobim', 'Bossa Nova' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Chega de Saudade', 'Tom Jobim', 'Bossa Nova' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Desafinado', 'Tom Jobim', 'Bossa Nova' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Girl from Ipanema', 'Tom Jobim', 'Bossa Nova' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Wave', 'Tom Jobim', 'Bossa Nova' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Construcao', 'Chico Buarque', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Rosa de Amanha', 'Chico Buarque', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Todo Mundo', 'Chico Buarque', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Despite', 'Caetano Veloso', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Podres Poderes', 'Caetano Veloso', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Quero', 'Gilberto Gil', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Midnight', 'Djavan', 'MPB' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Samba', 'Cartola', 'Samba' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'As Rosas Nao Falam', 'Cartola', 'Samba' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'O Mundo e um Moinho', 'Cartola', 'Samba' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Xote dos Milagres', 'Luiz Gonzaga', 'Forro' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Asa Branca', 'Luiz Gonzaga', 'Forro' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Coracao BBB', 'Marilia Mendonca', 'Sertanejo' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Rap da Felicidade', 'MC Marcinho', 'Funk' FROM public.artist_profiles ap
UNION ALL SELECT ap.id, 'Dancar', 'Anitta', 'Pop' FROM public.artist_profiles ap;

-- Verificar
SELECT ap.stage_name, COUNT(mr.id) as total FROM public.artist_profiles ap LEFT JOIN public.musicas_repertorio mr ON mr.artista_id = ap.id GROUP BY ap.stage_name ORDER BY total DESC LIMIT 10;