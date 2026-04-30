import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Send, Check, X, Calendar, DollarSign, Music, ArrowRight, Filter, Search, ChevronRight } from 'lucide-react';
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
    if (user?.email) loadProposals();
  }, [user?.email, isArtist, isVenue]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      let data;
      if (isArtist) {
        data = await base44.entities.Proposal.filter({ artist_email: user.email }, '-created_date');
      } else {
        data = await base44.entities.Proposal.filter({ bar_owner_email: user.email }, '-created_date');
      }
      setProposals(data || []);
    } catch (err) {
      console.error("Erro ao carregar:", err);
      toast.error("Erro ao carregar propostas");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (propostaId, status) => {
    setResponding(propostaId);
    try {
      await base44.entities.Proposal.update(propostaId, { 
        status, 
        artist_response: responseMsg[propostaId] || null 
      });

      toast.success(status === 'accepted' ? 'Proposta aceita! 🚀' : 'Proposta recusada');
      loadProposals();
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao responder proposta");
    } finally {
      setResponding(null);
    }
  };

  const handleCancel = async (propostaId) => {
    if (!confirm("Tem certeza que deseja cancelar esta proposta?")) return;
    try {
      await base44.entities.Proposal.update(propostaId, { status: 'cancelled' });
      toast.success("Proposta cancelada com sucesso");
      loadProposals();
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao cancelar proposta");
    }
  };

  const filtered = tab === 'all' ? proposals : proposals.filter(p => p.status === tab);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Gestão de Contratos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Minhas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Propostas</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg font-medium">
              {isArtist ? 'Analise e responda às oportunidades de show recebidas.' : 'Acompanhe o status das suas negociações com os artistas.'}
            </p>
          </div>
          
          <div className="bg-card/40 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl shadow-xl flex items-center">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="bg-transparent border-0 gap-1">
                <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-background/80 font-bold">Todas</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-xl px-6 data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-bold">Pendentes</TabsTrigger>
                <TabsTrigger value="accepted" className="rounded-xl px-6 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary font-bold">Aceitas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 rounded-[2.5rem] bg-card/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 rounded-[3rem] bg-white/5 border border-dashed border-white/10"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
              <Send className="w-10 h-10 text-primary opacity-40" />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">SILÊNCIO NO CAMARIM</h3>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">Você ainda não tem propostas nesta categoria.</p>
            {!isArtist && (
              <Link to="/explore">
                <Button className="mt-8 rounded-xl bg-primary hover:bg-primary/90 font-bold px-8">Explorar Artistas</Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <Music className="w-10 h-10 text-primary" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-heading font-black text-2xl tracking-tight group-hover:text-primary transition-colors">
                            {isArtist ? p.venue_name || 'Estabelecimento' : p.artist_name || 'Artista'}
                          </h3>
                          <StatusBadge status={p.status} />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            <Calendar size={14} className="text-primary" /> 
                            {p.event_date && format(new Date(p.event_date), "dd 'de' MMMM", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-black text-emerald-400 uppercase tracking-widest">
                            <DollarSign size={14} /> 
                            R$ {p.offered_price?.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        
                        {p.message && (
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xl italic border-l-2 border-white/10 pl-4 py-1">
                            "{p.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                      {isArtist && p.status === 'pending' ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Mensagem opcional..."
                            value={responseMsg[p.id] || ''}
                            onChange={(e) => setResponseMsg({ ...responseMsg, [p.id]: e.target.value })}
                            className="bg-background/40 border-white/10 rounded-xl text-sm min-h-[80px] focus:ring-primary/20"
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleRespond(p.id, 'accepted')} 
                              disabled={responding === p.id} 
                              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-lg shadow-emerald-500/20"
                            >
                              {responding === p.id ? '...' : <><Check size={18} className="mr-2" /> Aceitar</>}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleRespond(p.id, 'rejected')} 
                              disabled={responding === p.id} 
                              className="flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 font-bold h-12"
                            >
                              <X size={18} />
                            </Button>
                          </div>
                        </div>
                      ) : p.status === 'accepted' ? (
                        <Link to="/chat" className="w-full">
                          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-12 gap-2 shadow-lg shadow-primary/20 group/btn">
                            Abrir Chat <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      ) : p.status === 'pending' && isVenue ? (
                        <Button 
                          variant="outline" 
                          onClick={() => handleCancel(p.id)} 
                          className="rounded-xl border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 font-bold h-12 transition-all"
                        >
                          Cancelar Proposta
                        </Button>
                      ) : (
                        <div className="text-center py-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Finalizado</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Interaction bar */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Ref: #{p.id?.slice(-6)}</span>
                      <span>Enviado em {p.created_at && format(new Date(p.created_at), "dd/MM/yy")}</span>
                    </div>
                    <Link to="/chat" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline">
                      Histórico de Negociação <ChevronRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}