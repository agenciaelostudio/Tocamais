import { useState, useEffect, useCallback } from "react";
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
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.15),transparent_50%)] pointer-events-none" />
      
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

      <main className="flex-1 flex items-center justify-center p-4 relative z-10 pb-20">
        <OrderForm 
          artistaId={artist.id} 
          artistName={artist.stage_name} 
          onSubmit={handleOrderSubmit}
        />
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
