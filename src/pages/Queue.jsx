import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Music, ArrowLeft, Clock, Check, Send, User } from "lucide-react";

const QueuePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const artistId = searchParams.get("artista");
  const [artist, setArtist] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artistId) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [artistId]);

  const loadData = async () => {
    try {
      const [artistRes, pedidosRes] = await Promise.all([
        artistId ? supabase.from("artist_profiles").select("id, stage_name, avatar_url").eq("id", artistId).single() : Promise.resolve({ data: null }),
        artistId ? supabase.from("pedidos").select("*").eq("artista_id", artistId).in("status", ["pendente", "concluido"]).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] })
      ]);

      if (artistRes.data) setArtist(artistRes.data);
      setPedidos(pedidosRes.data || []);
    } catch (err) {
      console.error("Error loading queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingPedidos = useMemo(() => pedidos.filter(p => p.status === "pendente"), [pedidos]);
  const playedPedidos = useMemo(() => pedidos.filter(p => p.status === "concluido"), [pedidos]);

  if (!artistId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card><CardContent className="p-8 text-center">
          <Music className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold mb-4">Nenhum artista selecionado</p>
          <Button onClick={() => navigate("/explore")}>Ver Artistas</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando fila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`Fila de Músicas — ${artist?.stage_name || "Artista"}`} description="Veja a fila de pedidos" />

      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={artist?.avatar_url} />
              <AvatarFallback className="text-sm">{(artist?.stage_name || "A")[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-bold font-display">Fila de Músicas</h1>
              <p className="text-xs text-muted-foreground">{artist?.stage_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {pendingPedidos.length === 0 && playedPedidos.length === 0 ? (
          <Card className="p-8">
            <CardContent className="text-center">
              <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-1">Nenhum pedido ainda</p>
              <p className="text-sm text-muted-foreground">Seja o primeiro a pedir uma música!</p>
              <Button onClick={() => navigate(`/artist/${artistId}`)} className="mt-4">
                <Send className="w-4 h-4 mr-2" />
                Fazer Pedido
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendingPedidos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Próximas ({pendingPedidos.length})</h2>
                </div>
                <AnimatePresence>
                  {pendingPedidos.map((pedido, index) => (
                    <motion.div
                      key={pedido.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-primary/20 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold truncate">{pedido.musica}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{pedido.cliente_nome || "Anônimo"}</span>
                                <span>•</span>
                                <span>{new Date(pedido.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              {pedido.mensagem && (
                                <p className="text-xs text-muted-foreground/70 mt-2 italic line-clamp-2">"{pedido.mensagem}"</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {playedPedidos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent" />
                  <h2 className="font-semibold text-sm text-muted-foreground">Já Tocadas ({playedPedidos.length})</h2>
                </div>
                <AnimatePresence>
                  {playedPedidos.slice(0, 10).map((pedido, index) => (
                    <motion.div
                      key={pedido.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="border-accent/20 bg-accent/5 opacity-70">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{pedido.musica}</p>
                              <p className="text-xs text-muted-foreground">{pedido.cliente_nome || "Anônimo"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        <Button onClick={() => navigate(`/artist/${artistId}`)} className="w-full" variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Pedir uma Música
        </Button>
      </div>
    </div>
  );
};

export default QueuePage;