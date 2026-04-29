import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Link } from 'react-router-dom';
import { Send, Check, X, Calendar, DollarSign, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Proposals({ user }) {
  const [tab, setTab] = useState('all');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseMsg, setResponseMsg] = useState({});
  const [responding, setResponding] = useState(null);
  const isArtist = user?.role === 'artist';
  const isVenue = user?.role === 'bar_owner' || user?.venue_id;

  useEffect(() => {
    if (user?.id) loadProposals();
  }, [user?.id, isArtist, isVenue]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      let query;
      if (isArtist) {
        query = supabase.from("proposals").select("*").eq("artist_profile_id", user.id).order("created_at", { ascending: false });
      } else if (isVenue) {
        query = supabase.from("proposals").select("*").eq("venue_id", user.venue_id).order("created_at", { ascending: false });
      } else {
        query = supabase.from("proposals").select("*").order("created_at", { ascending: false }).limit(50);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setProposals(data || []);
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (propostaId, status) => {
    setResponding(propostaId);
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status, artist_response: responseMsg[propostaId] || null })
        .eq("id", propostaId);

      if (error) throw error;
      toast.success(status === 'accepted' ? 'Proposta aceita!' : 'Proposta recusada');
      loadProposals();
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao responder");
    } finally {
      setResponding(null);
    }
  };

  const handleCancel = async (propostaId) => {
    if (!confirm("Cancelar esta proposta?")) return;
    try {
      const { error } = await supabase.from("proposals").update({ status: 'cancelled' }).eq("id", propostaId);
      if (error) throw error;
      toast.success("Proposta cancelada");
      loadProposals();
    } catch (err) {
      toast.error("Erro ao cancelar");
    }
  };

  const filtered = tab === 'all' ? proposals : proposals.filter(p => p.status === tab);

  const statusMap = {
    pending: { label: 'Pendente', color: 'bg-yellow-500' },
    accepted: { label: 'Aceita', color: 'bg-green-500' },
    rejected: { label: 'Rejeitada', color: 'bg-red-500' },
    cancelled: { label: 'Cancelada', color: 'bg-gray-500' },
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Propostas</h1>
        <p className="text-muted-foreground mt-1">
          {isArtist ? 'Gerencie as propostas recebidas' : 'Acompanhe suas propostas enviadas'}
        </p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhuma proposta</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <Link to={isArtist ? `/artist/${p.artist_profile_id}` : `/artist/${p.artist_profile_id}`} className="font-heading font-bold hover:text-primary transition-colors">
                          {isArtist ? p.venue_name || 'Novo cliente' : p.artist_name || 'Artista'}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {p.event_date && format(new Date(p.event_date), "dd MMM yyyy", { locale: ptBR })}</span>
                          <span className="flex items-center gap-1"><DollarSign size={10} /> R$ {p.offered_price?.toLocaleString('pt-BR')}</span>
                          {p.start_time && <span>{p.start_time} - {p.end_time}</span>}
                        </div>
                      </div>
                    </div>
                    {p.message && <p className="text-sm text-muted-foreground mt-2">{p.message}</p>}
                    {p.artist_response && <p className="text-sm text-primary mt-1 italic">"{p.artist_response}"</p>}
                    {p.performance_type && <span className="text-xs text-secondary mt-1 inline-block">{p.performance_type}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    {isArtist && p.status === 'pending' && (
                      <div className="flex flex-col gap-1">
                        <Textarea
                          placeholder="Resposta (opcional)"
                          value={responseMsg[p.id] || ''}
                          onChange={(e) => setResponseMsg({ ...responseMsg, [p.id]: e.target.value })}
                          className="text-xs h-16 w-48"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleRespond(p.id, 'accepted')} disabled={responding === p.id} className="bg-secondary text-secondary-foreground flex-1">
                            <Check size={14} /> Aceitar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRespond(p.id, 'rejected')} disabled={responding === p.id} className="flex-1">
                            <X size={14} /> Recusar
                          </Button>
                        </div>
                      </div>
                    )}
                    {isVenue && p.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleCancel(p.id)} className="text-destructive border-destructive/30">
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}