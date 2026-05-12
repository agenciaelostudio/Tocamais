import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { OrderForm } from "@/components/order/OrderForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSessionId } from "@/hooks/useSessionId";
import { TwoStepPixPaymentDialog } from "@/components/TwoStepPixPaymentDialog";

export default function OrderPage({ user }) {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const sessionId = useSessionId();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [lastPayload, setLastPayload] = useState(null);
  const [pixInfo, setPixInfo] = useState({ key: null, type: 'aleatoria' });

  useEffect(() => {
    if (artistId) {
      fetchArtist();
    }
  }, [artistId]);

  const fetchArtist = async () => {
    try {
      const data = await base44.entities.ArtistProfile.filter({ id: artistId });
      if (data?.[0]) {
        setArtist(data[0]);
        setPixInfo({ 
          key: data[0].pix_chave, 
          type: data[0].pix_tipo_chave || 'aleatoria' 
        });
      } else {
        toast.error("Artista não encontrado");
        navigate("/explore");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do artista");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (payload) => {
    setLastPayload(payload);
    
    if (payload.valor > 0) {
      // If there is a donation, open the PIX dialog
      setPixDialogOpen(true);
    } else {
      // Free order
      try {
        await base44.entities.Order.create({
          artista_id: artist.id,
          cliente_id: user?.id || null,
          cliente_nome: payload.cliente_nome,
          session_id: sessionId,
          musica: payload.musica_nome,
          mensagem: payload.mensagem,
          status: "pendente"
        });

        // Notify artist
        await base44.entities.Notification.create({
          user_email: artist.user_email,
          type: 'tip',
          title: 'Novo Pedido de Música',
          message: `${payload.cliente_nome} pediu "${payload.musica_nome}"`,
          is_read: false
        });

        toast.success("Pedido gratuito enviado!");
        navigate(`/artista/${artist.id}`);
      } catch (error) {
        throw error;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[#0A0A0A]" />
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      <header className="p-4 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 relative z-10 pb-20 pt-8">
        {artist && (
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 live-ring" />
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400/50 flex items-center justify-center overflow-hidden z-10 relative backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                 <span className="text-4xl font-black text-emerald-400 font-heading">{artist.stage_name?.[0] || 'A'}</span>
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-heading font-black tracking-tight text-white">{artist.stage_name}</h1>
            <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Apoie com PIX</p>
          </div>
        )}
        {artist && (
          <OrderForm 
            artistaId={artist.id} 
            artistName={artist.stage_name} 
            onSubmit={handleOrderSubmit}
          />
        )}
      </main>

      {artist && (
        <TwoStepPixPaymentDialog
          open={pixDialogOpen}
          onOpenChange={setPixDialogOpen}
          artistaId={artist.id}
          artistaNome={artist.stage_name}
          artistaEmail={artist.user_email}
          pixChave={pixInfo.key}
          pixTipoChave={pixInfo.type}
          isPro={artist.is_pro}
          clienteId={user?.id}
          sessionId={sessionId}
          initialMusica={lastPayload?.musica_nome}
          initialMensagem={lastPayload?.mensagem}
          initialValor={lastPayload?.valor}
          onSuccess={() => {
            setPixDialogOpen(false);
            navigate(`/artista/${artist.id}`);
          }}
        />
      )}
    </div>
  );
}
