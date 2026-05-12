import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Music, Heart, Instagram, Youtube, Music2, ListMusic, Briefcase, Users, MapPin } from "lucide-react";
import { VotacaoFa } from "@/components/VotacaoFa";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useSessionId } from "@/hooks/useSessionId";
import { z } from "zod";
import { useLocation } from "react-router-dom";
import { GuestWelcomeBanner } from "@/components/shared/GuestWelcomeBanner";

const songRequestSchema = z.object({
  musica: z.string().trim().min(1, "Por favor, digite o nome da música").max(200),
  mensagem: z.string().trim().max(500).optional(),
  clienteNome: z.string().trim().optional()
});

const BioReadMore = memo(({ bio }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio?.length > 120;
  if (!bio) return null;
  return (
    <div className="mb-1.5">
      <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>{bio}</p>
      {isLong && <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium mt-1 hover:underline">{expanded ? 'ver menos' : 'ler mais'}</button>}
    </div>
  );
});
BioReadMore.displayName = "BioReadMore";

const ArtistPublicProfile = ({ user }) => {
  const { id, idOrSlug } = useParams();
  const artistIdentifier = id || idOrSlug;
  const navigate = useNavigate();
  const location = useLocation();
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
  const tipCardRef = useRef(null);

  // QR Code / Direct Tip Detection
  const isDirectTip = new URLSearchParams(location.search).get('tip') === 'true';

  useEffect(() => {
    if (!loading && isDirectTip && tipCardRef.current) {
      setTimeout(() => {
        tipCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [loading, isDirectTip]);

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
  const [showWelcome, setShowWelcome] = useState(false);

  const { isPro } = useSubscription(id || null);
  const isMobile = useIsMobile();


  useEffect(() => {
    fetchArtist();
  }, [artistIdentifier]);

  const fetchArtist = useCallback(async () => {
    if (!artistIdentifier) return;
    try {
      // Tentar buscar por ID primeiro, depois por Slug
      let p = null;
      
      // Tenta ID (pode ser UUID ou string mock)
      try {
        const byId = await base44.entities.ArtistProfile.filter({ id: artistIdentifier });
        if (byId?.[0]) p = byId[0];
      } catch (e) {
        // Se falhar (ex: UUID inválido no Supabase), ignora e tenta Slug
      }
      
      if (!p) {
        const bySlug = await base44.entities.ArtistProfile.filter({ slug: artistIdentifier });
        if (bySlug?.[0]) p = bySlug[0];
      }

      if (!p) {
        // Fallback final: talvez o artistIdentifier seja o ID mas falhou no filtro anterior
        const allArtists = await base44.entities.ArtistProfile.filter({ is_active: true });
        p = allArtists.find(a => a.id === artistIdentifier || a.slug === artistIdentifier);
      }

      if (!p) {
        toast.error("Artista não encontrado");
        navigate("/explore");
        return;
      }

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

      if (p.pix_chave) {
        setPixInfo({ pix_chave: p.pix_chave, pix_tipo_chave: p.pix_tipo_chave || "aleatoria" });
      }

      const m = await base44.entities.RepertoireSong.filter({ artista_id: p.id }, 'titulo');
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
      await base44.entities.Order.create({ 
        artista_id: artist.id, 
        cliente_id: currentUserId || null, 
        cliente_nome: validation.data.clienteNome || null, 
        session_id: sessionId, 
        musica: validation.data.musica, 
        mensagem: validation.data.mensagem || null, 
        status: "pendente" 
      });
      toast.success("Pedido enviado!");
      setMusica(""); setMensagem(""); setClienteNomePedido("");
      if (!user) setShowWelcome(true);
    } catch (error) { 
      console.error("Erro ao enviar pedido:", error);
      toast.error(error.message || "Erro ao enviar pedido"); 
    } finally { 
      setRequestLoading(false); 
    }
  }, [sessionId, artist, musica, mensagem, clienteNomePedido, currentUserId]);

  const handleGoBack = useCallback(() => navigate("/explore"), [navigate]);
  const handleOpenPix = useCallback(() => navigate(`/pedido/${artist?.id}?step=2`), [navigate, artist?.id]);
  const handleCustomMusic = useCallback(() => navigate(`/pedido/${artist?.id}`), [navigate, artist?.id]);
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
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <SEOHead title={`${artist.nome} — Artista ao Vivo`} description={artist.bio ? artist.bio.slice(0, 155) : `Ouça ${artist.nome} ao vivo.`} />

      {/* Decorative Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={handleGoBack} className="text-muted-foreground hover:text-foreground rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Explorar
          </Button>
          <FavoriteButton targetId={artist.id} targetType="artista" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-10 max-w-5xl relative z-10">
        {/* Cinematic Artist Header Card */}
        <div className="mb-8 md:mb-12 relative rounded-3xl md:rounded-[2.5rem] bg-card/40 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden group">
          
          {/* Cover Photo Area */}
          <div ref={coverRef} className="w-full h-56 md:h-80 relative overflow-hidden bg-muted/30">
            {artist.foto_capa_url ? (
               <img src={artist.foto_capa_url} alt={`Capa de ${artist.nome}`} className="w-full h-[120%] object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105" style={coverTransform} loading="lazy" />
            ) : (
               <div className="w-full h-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 animate-pulse-soft" />
            )}
            {/* Smooth gradient fade to background */}
            <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-card/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          </div>

          <div className="px-6 md:px-12 pb-8 md:pb-12 -mt-20 md:-mt-28 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-end text-center md:text-left">
              
              {/* Premium Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-3xl blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <Avatar className="w-36 h-36 md:w-48 md:h-48 ring-8 ring-card/40 shadow-2xl rounded-3xl relative z-10 bg-card">
                  <AvatarImage src={artist.foto_url} className="object-cover rounded-3xl" />
                  <AvatarFallback className="text-6xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black rounded-3xl">{artist.nome[0]}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 pb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-foreground tracking-tight drop-shadow-sm">
                    {artist.nome}
                  </h1>
                  {artist.ativo_ao_vivo && (
                    <Badge className="w-fit mx-auto md:mx-0 text-sm md:text-base px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-2.5 inline-block" /> AO VIVO AGORA
                    </Badge>
                  )}
                </div>

                {artist.cidade && <p className="text-lg text-muted-foreground/90 font-medium mb-4 flex items-center justify-center md:justify-start gap-2"><MapPin className="w-5 h-5 text-primary" /> {artist.cidade}</p>}
                
                <div className="flex gap-2 flex-wrap justify-center md:justify-start mb-6">
                  {artist.estilo_musical && <Badge variant="secondary" className="text-sm px-4 py-1.5 rounded-xl bg-secondary/20 text-secondary-foreground border-0">{artist.estilo_musical}</Badge>}
                  {isPro && <Badge className="text-sm px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 rounded-xl shadow-lg">⭐ Artista Pro</Badge>}
                </div>
                
                {artist.bio && (
                  <div className="max-w-2xl mx-auto md:mx-0 text-muted-foreground/90 text-sm md:text-base leading-relaxed mb-6">
                    <BioReadMore bio={artist.bio} />
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* Primary Fan Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 justify-center md:justify-start">
                    <Button 
                      size="lg" 
                      className="rounded-2xl text-base font-black px-8 h-16 bg-gradient-to-r from-emerald-500 via-emerald-500/90 to-emerald-400 text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300 border border-white/10 group" 
                      onClick={handleOpenPix}
                    >
                      <Heart className="w-5 h-5 mr-2 fill-white/20 group-hover:scale-110 transition-transform" /> 
                      ENVIAR GORJETA
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="rounded-2xl text-base font-black px-8 h-16 bg-white/5 backdrop-blur-xl border-white/10 text-white hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 group" 
                      onClick={() => navigate(`/pedido/${artist.id}`)}
                    >
                      <Music className="w-5 h-5 mr-2 text-primary group-hover:rotate-12 transition-transform" /> 
                      PEDIR MÚSICA
                    </Button>
                  </div>

                  {/* Secondary/Professional Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button 
                      onClick={handleContratacao}
                      className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all flex items-center gap-2"
                    >
                      <Briefcase className="w-4 h-4" /> Contratar para meu evento
                    </button>
                    
                    <div className="hidden sm:block w-1 h-1 bg-white/10 rounded-full" />

                    <div className="flex gap-4 justify-center">
                      {artist.instagram && <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-pink-500 transition-colors"><Instagram className="w-5 h-5" /></a>}
                      {artist.youtube && <a href={artist.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-red-500 transition-colors"><Youtube className="w-5 h-5" /></a>}
                      {artist.spotify && <a href={artist.spotify} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-500 transition-colors"><Music2 className="w-5 h-5" /></a>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-7 space-y-6">
            {artist.ativo_ao_vivo && (
              <VotacaoFa artistaId={artist.id} userId={currentUserId} />
            )}
            
            <div className="rounded-3xl bg-card/20 border border-white/5 p-8 backdrop-blur-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ListMusic className="h-5 w-5 text-primary" />
                Repertório
              </h3>
              {musicas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {musicas.slice(0, 15).map(m => (
                    <Badge 
                      key={m.id} 
                      variant="outline" 
                      className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                      onClick={() => navigate(`/pedido/${artist.id}`)}
                    >
                      {m.titulo}
                    </Badge>
                  ))}
                  {musicas.length > 15 && (
                    <span className="text-xs text-muted-foreground self-center">+{musicas.length - 15} músicas</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma música cadastrada no repertório.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Button 
              variant="ghost" 
              className="w-full h-20 rounded-3xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group"
              onClick={() => navigate(`/pedido/${artist.id}`)}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-black uppercase tracking-widest">Fazer um Pedido</span>
                <span className="text-[10px] opacity-60">Grátis ou com Gorjeta</span>
              </div>
            </Button>

            <Button 
              variant="ghost" 
              className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all"
              onClick={handleViewQueue}
            >
              <Users className="h-5 w-5 mr-3" />
              Fila de Pedidos
            </Button>
          </div>
        </div>
      </main>

      <GuestWelcomeBanner open={showWelcome} onOpenChange={setShowWelcome} />
    </div>
  );
};

export default ArtistPublicProfile;