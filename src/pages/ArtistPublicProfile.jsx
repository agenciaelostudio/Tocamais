import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MusicCombobox } from "@/components/MusicCombobox";
import { ArrowLeft, Music, Heart, Instagram, Youtube, Music2, ListMusic, MessageCircleHeart, Briefcase, Users, MapPin } from "lucide-react";
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
      const profiles = await base44.entities.ArtistProfile.filter({ id });
      const p = profiles[0];

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

      const m = await base44.entities.RepertoireSong.filter({ artista_id: id }, 'titulo');
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
                  <div className="max-w-2xl mx-auto md:mx-0 text-muted-foreground/90 text-base md:text-lg leading-relaxed mb-6">
                    <BioReadMore bio={artist.bio} />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                  <Button size="lg" className="rounded-2xl text-base px-8 h-14 bg-gradient-to-r from-primary via-primary/90 to-secondary text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 border border-white/10" onClick={handleContratacao}>
                    <Briefcase className="w-5 h-5 mr-2" /> Contratar Artista
                  </Button>
                  
                  <div className="flex gap-2 justify-center">
                    {artist.instagram && <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl bg-card/50 border-white/10 hover:bg-card/80 hover:text-pink-500 transition-colors" asChild><a href={artist.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-6 h-6" /></a></Button>}
                    {artist.youtube && <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl bg-card/50 border-white/10 hover:bg-card/80 hover:text-red-500 transition-colors" asChild><a href={artist.youtube} target="_blank" rel="noopener noreferrer"><Youtube className="w-6 h-6" /></a></Button>}
                    {artist.spotify && <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl bg-card/50 border-white/10 hover:bg-card/80 hover:text-green-500 transition-colors" asChild><a href={artist.spotify} target="_blank" rel="noopener noreferrer"><Music2 className="w-6 h-6" /></a></Button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Main Interaction Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            
            {/* Voting Widget - Prominent when Live */}
            {artist.ativo_ao_vivo && (
              <div className="animate-fade-in-up">
                <VotacaoFa artistaId={artist.id} userId={currentUserId} />
              </div>
            )}

            {/* Song Request & Tip Card */}
            <div ref={tipCardRef} className="rounded-3xl bg-card/40 border border-white/5 backdrop-blur-md overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50" />
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold flex items-center gap-3 mb-1">
                    <Music className="w-6 h-6 text-primary" /> Interaja com o Show
                  </h2>
                  <p className="text-muted-foreground text-sm">Peça sua música favorita ou envie um incentivo ao artista.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="clienteNome" className="text-sm font-semibold text-foreground/80">Seu Nome / Mesa <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                    <Input id="clienteNome" placeholder="Ex: João - Mesa 04" value={clienteNomePedido} onChange={(e) => setClienteNomePedido(e.target.value)} maxLength={30} className="h-12 rounded-xl bg-background/50 border-white/10 text-base" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground/80">Qual música você quer ouvir?</Label>
                    {musicas.length > 0 ? (
                      !musicaCustomizada ? (
                        <div className="space-y-3">
                          <MusicCombobox open={openMusicCombobox} onOpenChange={setOpenMusicCombobox} items={musicas} selectedTitle={musica} onSelectTitle={setMusica} triggerPlaceholder="Selecione no repertório..." searchPlaceholder="Buscar música..." forceDrawer />
                          <button type="button" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium ml-1" onClick={handleCustomMusic}>Não achou? Digite o nome aqui.</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input placeholder="Digite o nome da música e do cantor" value={musica} onChange={(e) => setMusica(e.target.value)} className="h-12 rounded-xl bg-background/50 border-white/10 text-base" />
                          <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium ml-1" onClick={() => { setMusicaCustomizada(false); setMusica(""); }}>Voltar para o repertório</button>
                        </div>
                      )
                    ) : (
                      <Input placeholder="Ex: Evidências - Chitãozinho & Xororó" value={musica} onChange={(e) => setMusica(e.target.value)} className="h-12 rounded-xl bg-background/50 border-white/10 text-base" />
                    )}
                  </div>

                  <div className="pt-2 space-y-3">
                    {pixInfo.pix_chave ? (
                      <>
                        <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white border-0 shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-2xl hover:scale-[1.02] transition-all" onClick={handleOpenPix} disabled={!musica.trim()}>
                          <Heart className="w-5 h-5 mr-2 fill-white/20" /> Pedir Música com Gorjeta (PIX)
                        </Button>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" onClick={handleSendRequest} disabled={requestLoading || !musica.trim()}>
                          Enviar apenas o pedido
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full h-14 text-base font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-2xl transition-all" onClick={handleSendRequest} disabled={requestLoading || !musica.trim()}>
                        <MessageCircleHeart className="w-5 h-5 mr-2" /> {requestLoading ? "Enviando..." : "Enviar Pedido"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-card/20 border border-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2"><ListMusic className="w-5 h-5 text-secondary" /> O que rola no show?</h3>
              {musicas.length > 0 ? (
                 <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">Confira algumas das músicas mais tocadas por {artist.nome}.</p>
                    <div className="flex flex-wrap gap-2">
                       {musicas.slice(0, 8).map(m => (
                         <Badge key={m.id} variant="outline" className="bg-background/50 border-white/10 text-xs py-1.5 px-3 rounded-lg font-normal text-muted-foreground">{m.titulo}</Badge>
                       ))}
                       {musicas.length > 8 && <Badge variant="outline" className="bg-background/20 border-white/5 text-xs py-1.5 px-3 rounded-lg text-primary/70">+{musicas.length - 8} músicas</Badge>}
                    </div>
                 </div>
              ) : (
                 <p className="text-sm text-muted-foreground">O artista ainda não adicionou o repertório completo.</p>
              )}
            </div>
            
            <Button variant="ghost" className="w-full h-14 rounded-2xl bg-card/30 border border-white/5 text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all group" onClick={handleViewQueue}>
              <Users className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
              Ver Fila de Pedidos ao Vivo
            </Button>
          </div>
        </div>

      </main>

      {pixInfo.pix_chave && (
        <TwoStepPixPaymentDialog open={directPixDialogOpen} onOpenChange={setDirectPixDialogOpen} artistaId={artist.id} artistaNome={artist.nome} pixChave={pixInfo.pix_chave} pixTipoChave={pixInfo.pix_tipo_chave || "aleatoria"} clienteId={currentUserId} sessionId={sessionId} musicas={musicas} initialMusica={musica} initialClienteNome={clienteNomePedido} />
      )}
    </div>
  );
};

export default ArtistPublicProfile;