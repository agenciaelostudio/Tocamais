import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MusicCombobox } from "@/components/MusicCombobox";
import { ArrowLeft, Music, Heart, Instagram, Youtube, Music2, ListMusic, MessageCircleHeart, Briefcase, Users } from "lucide-react";
import { VotacaoFa } from "@/components/VotacaoFa";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useSessionId } from "@/hooks/useSessionId";
import { z } from "zod";
import { TwoStepPixPaymentDialog } from "@/components/TwoStepPixPaymentDialog";

const songRequestSchema = z.object({
  musica: z.string().trim().min(1, "Por favor, digite o nome da música").max(200),
  mensagem: z.string().trim().max(500).optional(),
  clienteNome: z.string().trim().optional()
});

const BioReadMore = memo(({ bio }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > 120;
  return (
    <div className="mb-1.5">
      <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>{bio}</p>
      {isLong && <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium mt-1 hover:underline">{expanded ? 'ver menos' : 'ler mais'}</button>}
    </div>
  );
});
BioReadMore.displayName = "BioReadMore";

const ArtistPublicProfile = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sessionId = useSessionId();
  const [artist, setArtist] = useState(null);
  const [pixInfo, setPixInfo] = useState({ pix_chave: null, pix_tipo_chave: null });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(user?.id || null);
  const [musicas, setMusicas] = useState([]);
  const [activeSetlist, setActiveSetlist] = useState(null);
  const [musicaCustomizada, setMusicaCustomizada] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openMusicCombobox, setOpenMusicCombobox] = useState(false);
  const coverRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (coverRef.current && coverRef.current.getBoundingClientRect().bottom > 0) {
          setScrollY(window.scrollY);
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [musica, setMusica] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [clienteNomePedido, setClienteNomePedido] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [directPixDialogOpen, setDirectPixDialogOpen] = useState(false);

  const { isPro } = useSubscription(id || null);
  const isMobile = useIsMobile();
  const tipCardRef = useRef(null);
  const [artistLimitReached, setArtistLimitReached] = useState(false);

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const fetchArtist = useCallback(async () => {
    if (!id) return;
    try {
      // Try to fetch from artist_profiles table
      const { data: p, error } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setArtist({
        id: p.id,
        nome: p.stage_name,
        cidade: p.city || "",
        estilo_musical: p.genres?.[0] || "",
        bio: p.bio || "",
        foto_url: p.avatar_url || "",
        foto_capa_url: p.cover_url,
        instagram: p.social_links?.instagram || "",
        youtube: p.social_links?.youtube || "",
        spotify: p.social_links?.spotify || "",
        link_pix: p.link_pix || "",
        ativo_ao_vivo: p.is_active || false,
      });

      // Fetch PIX info (in maismais it might be in users table or artist_profiles)
      // For now, let's look for 'pix_chave' in the profile if it exists
      if (p.pix_chave) {
        setPixInfo({ pix_chave: p.pix_chave, pix_tipo_chave: p.pix_tipo_chave || "aleatoria" });
      }

      // Fetch repertoire if tables exist
      const { data: m } = await supabase.from("musicas_repertorio").select("*").eq("artista_id", id).order("titulo");
      setMusicas(m || []);
      
    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
      toast.error("Erro ao carregar perfil");
      navigate("/explore");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const handleSendRequest = useCallback(async () => {
    if (!sessionId || !artist) { toast.error("Erro. Recarregue."); return; }
    const validation = songRequestSchema.safeParse({ musica, mensagem: mensagem || "", clienteNome: clienteNomePedido || "" });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }
    setRequestLoading(true);
    try {
      const { error } = await supabase.from("pedidos").insert({ 
        artista_id: artist.id, 
        cliente_id: currentUserId || null, 
        cliente_nome: validation.data.clienteNome || null, 
        session_id: sessionId, 
        musica: validation.data.musica, 
        mensagem: validation.data.mensagem || null, 
        status: "pendente" 
      });
      if (error) throw error;
      toast.success("Pedido enviado!");
      setMusica(""); setMensagem(""); setClienteNomePedido("");
    } catch (error) { 
      console.error("Erro ao enviar pedido:", error);
      toast.error(error.message || "Erro ao enviar pedido"); 
    } finally { 
      setRequestLoading(false); 
    }
  }, [sessionId, artist, musica, mensagem, clienteNomePedido, currentUserId]);

  const handleGoBack = useCallback(() => navigate("/explore"), [navigate]);
  const handleOpenPix = useCallback(() => setDirectPixDialogOpen(true), []);
  const handleCustomMusic = useCallback(() => { setMusicaCustomizada(true); setMusica(""); }, []);
  const handleViewQueue = useCallback(() => navigate(`/queue?artista=${artist?.id}`), [navigate, artist?.id]);
  const handleContratacao = useCallback(() => navigate(`/contratar/${artist?.id}`), [navigate, artist?.id]);

  const coverTransform = useMemo(() => ({ transform: `translateY(${scrollY * 0.3}px)` }), [scrollY]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-primary animate-pulse-soft" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEOHead title={`${artist.nome} — Artista ao Vivo`} description={artist.bio ? artist.bio.slice(0, 155) : `Ouça ${artist.nome} ao vivo.`} />

      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/30">
        <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
        <div className="relative container mx-auto px-4 py-2.5">
          <Button variant="ghost" onClick={handleGoBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-2 md:py-8 max-w-4xl">
        {/* Artist Header Card */}
        <GlassCard className="mb-4 md:mb-8 overflow-hidden">
          {/* Cover Photo */}
          <div ref={coverRef} className="w-full h-24 md:h-64 relative overflow-hidden">
            <img src={artist.foto_capa_url || "/default-cover-estabelecimento.jpg"} alt={`Capa de ${artist.nome}`} className="w-full h-[120%] object-cover transition-transform duration-75 ease-out will-change-transform" style={coverTransform} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          <CardContent className="px-5 md:px-8 pb-5 -mt-12 md:-mt-16 relative">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32 ring-4 ring-background shadow-xl">
                <AvatarImage src={artist.foto_url} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">{artist.nome[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-foreground">
                  {artist.nome}<FavoriteButton targetId={artist.id} targetType="artista" />
                </h1>
                {artist.cidade && <p className="text-lg text-muted-foreground mb-2">{artist.cidade}</p>}
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge variant="secondary" className="text-base px-3 py-1 rounded-lg">{artist.estilo_musical}</Badge>
                  {isPro && <Badge className="text-base px-3 py-1 bg-gradient-to-r from-primary to-accent text-white border-0 rounded-lg">⭐ Pro</Badge>}
                  {artist.ativo_ao_vivo && (
                    <Badge className="text-base px-3 py-1 bg-accent/15 text-accent border-accent/25 rounded-lg">
                      <span className="w-2 h-2 bg-accent rounded-full animate-pulse-soft mr-2" />AO VIVO
                    </Badge>
                  )}
                </div>
                {artist.bio && <p className="text-foreground mb-4 leading-relaxed">{artist.bio}</p>}
                <div className="flex gap-3 flex-wrap mb-4">
                  {artist.instagram && <Button variant="outline" size="sm" className="rounded-xl" asChild><a href={artist.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-4 h-4 mr-2" />Instagram</a></Button>}
                  {artist.youtube && <Button variant="outline" size="sm" className="rounded-xl" asChild><a href={artist.youtube} target="_blank" rel="noopener noreferrer"><Youtube className="w-4 h-4 mr-2" />YouTube</a></Button>}
                  {artist.spotify && <Button variant="outline" size="sm" className="rounded-xl" asChild><a href={artist.spotify} target="_blank" rel="noopener noreferrer"><Music2 className="w-4 h-4 mr-2" />Spotify</a></Button>}
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={handleContratacao}>
                    <Briefcase className="w-4 h-4 mr-2" />Contratar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Voting Widget */}
        {artist.ativo_ao_vivo && (
          <div className="max-w-2xl mx-auto mb-4">
            <VotacaoFa artistaId={artist.id} userId={currentUserId} />
          </div>
        )}

        {/* Interaction Card */}
        <GlassCard ref={tipCardRef} className="max-w-2xl mx-auto">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music className="w-5 h-5 text-primary" />
              Peça uma música
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-6">
            <div>
              <Label htmlFor="clienteNome" className="text-xs font-medium">Seu nome e mesa</Label>
              <Input id="clienteNome" placeholder="Ex: João - Mesa 01" value={clienteNomePedido} onChange={(e) => setClienteNomePedido(e.target.value)} maxLength={30} className="rounded-xl bg-muted/20 border-border/40" />
            </div>

            {musicas.length > 0 ? (
              !musicaCustomizada ? (
                <div className="space-y-2">
                  <MusicCombobox open={openMusicCombobox} onOpenChange={setOpenMusicCombobox} items={musicas} selectedTitle={musica} onSelectTitle={setMusica} triggerPlaceholder="Escolha a música..." searchPlaceholder="Buscar..." forceDrawer />
                  <Button type="button" variant="outline" size="sm" className="w-full rounded-xl text-xs" onClick={handleCustomMusic}>Ou digite outra música</Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-xs font-medium">Música</Label>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleShowRepertoire}>Ver repertório</Button>
                  </div>
                  <Input placeholder="Nome da música" value={musica} onChange={(e) => setMusica(e.target.value)} className="rounded-xl bg-muted/20 border-border/40" />
                </div>
              )
            ) : (
              <div>
                <Label className="text-xs font-medium">Música</Label>
                <Input placeholder="Nome da música ou artista" value={musica} onChange={(e) => setMusica(e.target.value)} className="rounded-xl bg-muted/20 border-border/40" />
              </div>
            )}

            {pixInfo.pix_chave ? (
              <>
                <Button className="w-full h-14 text-base btn-gradient rounded-2xl" onClick={handleOpenPix} disabled={!musica.trim() || !clienteNomePedido.trim()}>
                  <Heart className="w-5 h-5 mr-2" />
                  Enviar Gorjeta via PIX
                </Button>
                <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <MessageCircleHeart className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary/70 font-medium">Gorjetas incluem dedicatória ao artista</p>
                </div>
              </>
            ) : null}

            <Button variant={pixInfo.pix_chave ? "outline" : "default"} className={`w-full rounded-2xl ${pixInfo.pix_chave ? "h-12 border-primary/30 text-primary hover:bg-primary/5" : "h-14 text-base btn-gradient"}`} onClick={handleSendRequest} disabled={requestLoading || !musica.trim() || !clienteNomePedido.trim()}>
              <Music className="w-4 h-4 mr-2" />
              {requestLoading ? "Enviando..." : pixInfo.pix_chave ? "Enviar apenas o pedido" : "Enviar Pedido de Música"}
            </Button>

            <Button variant="ghost" size="sm" className="w-full rounded-2xl text-muted-foreground" onClick={handleViewQueue}>
              <Users className="w-4 h-4 mr-2" />
              Ver Fila de Pedidos
            </Button>
          </CardContent>
        </GlassCard>
      </main>

      {pixInfo.pix_chave && (
        <TwoStepPixPaymentDialog open={directPixDialogOpen} onOpenChange={setDirectPixDialogOpen} artistaId={artist.id} artistaNome={artist.nome} pixChave={pixInfo.pix_chave} pixTipoChave={pixInfo.pix_tipo_chave || "aleatoria"} clienteId={currentUserId} sessionId={sessionId} musicas={musicas} initialMusica={musica} initialClienteNome={clienteNomePedido} />
      )}
    </div>
  );
};

export default ArtistPublicProfile;