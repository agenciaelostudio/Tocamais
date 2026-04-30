import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSupabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { MessageSquare, Send, ArrowLeft, Zap, Music, Calendar, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Chat({ user }) {
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const isArtist = user?.role === 'artist';

  const { data: proposals = [] } = useQuery({
    queryKey: ['chatProposals', user.email],
    queryFn: () => {
      if (isArtist) return base44.entities.Proposal.filter({ artist_email: user.email }, '-created_date');
      return base44.entities.Proposal.filter({ bar_owner_email: user.email }, '-created_date');
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['chatMessages', selectedProposal?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ proposal_id: selectedProposal.id }, 'created_date'),
    enabled: !!selectedProposal,
  });

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!selectedProposal || !isSupabaseConfigured) return;

    const supabase = getSupabase();
    
    // Subscribe to new messages for this proposal
    const channel = supabase
      .channel(`chat:${selectedProposal.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `proposal_id=eq.${selectedProposal.id}`,
        },
        (payload) => {
          // Instantly update the query cache with the new message
          queryClient.setQueryData(['chatMessages', selectedProposal.id], (old = []) => {
            // Avoid duplicates
            if (old.find(m => m.id === payload.new.id)) return old;
            return [...old, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedProposal, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const receiverEmail = isArtist ? selectedProposal.bar_owner_email : selectedProposal.artist_email;
      await base44.entities.ChatMessage.create({
        proposal_id: selectedProposal.id,
        sender_email: user.email,
        sender_name: user.full_name,
        receiver_email: receiverEmail,
        content: message,
      });
    },
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 h-[calc(100vh-140px)] flex flex-col">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Mensagens</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">Chat <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Direto</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Negocie e ajuste os detalhes do seu próximo show.</p>
          </div>
          {isSupabaseConfigured && (
            <div className="hidden md:flex items-center gap-2 text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 backdrop-blur-md">
              <Zap size={14} className="fill-emerald-400 animate-pulse" />
              REALTIME ATIVO
            </div>
          )}
        </motion.div>

        <div className="flex-1 rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Conversations list */}
          <div className={`w-full md:w-96 border-r border-white/5 flex flex-col flex-shrink-0 ${selectedProposal ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conversas Ativas</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {proposals.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Nenhuma proposta ainda</p>
                  </div>
                </div>
              ) : (
                proposals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProposal(p)}
                    className={`w-full p-6 text-left border-b border-white/5 transition-all relative group ${
                      selectedProposal?.id === p.id ? 'bg-primary/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {selectedProposal?.id === p.id && (
                      <motion.div layoutId="active-chat" className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-heading font-black text-base tracking-tight group-hover:text-primary transition-colors">
                        {isArtist ? p.venue_name || 'Estabelecimento' : p.artist_name || 'Artista'}
                      </p>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> {p.event_date && format(new Date(p.event_date), "dd MMM", { locale: ptBR })}</span>
                      <span className="flex items-center gap-1.5"><DollarSign size={12} className="text-emerald-400" /> R$ {p.offered_price?.toLocaleString('pt-BR')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col relative ${!selectedProposal ? 'hidden md:flex' : 'flex'}`}>
            {!selectedProposal ? (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-white/2">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="w-24 h-24 rounded-[2rem] bg-card/60 border border-white/10 flex items-center justify-center mx-auto relative z-10 shadow-2xl">
                      <MessageSquare className="w-10 h-10 text-primary opacity-40 animate-pulse-soft" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-black tracking-tight text-foreground/80">Sua Central de Negociação</h3>
                    <p className="text-sm font-medium opacity-40 max-w-xs mx-auto">Selecione uma proposta na lista ao lado para iniciar a conversa.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProposal(null)} className="md:hidden rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                      <ArrowLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 font-black text-primary shadow-inner">
                        {isArtist ? (selectedProposal.venue_name?.[0] || 'E') : (selectedProposal.artist_name?.[0] || 'A')}
                      </div>
                      <div>
                        <p className="font-heading font-black text-lg tracking-tight">{isArtist ? selectedProposal.venue_name : selectedProposal.artist_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Show em {selectedProposal.event_date && format(new Date(selectedProposal.event_date), "dd MMMM yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-5 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hidden sm:flex font-bold gap-2 transition-all"
                      onClick={() => {
                        const phone = "5511999999999"; 
                        const text = encodeURIComponent(`Olá! Te mandei uma mensagem no Tocamais sobre o show do dia ${format(new Date(selectedProposal.event_date), "dd/MM")}. Dá uma olhadinha lá!`);
                        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                      }}
                    >
                      <Zap size={14} className="fill-emerald-400" /> WhatsApp
                    </Button>
                    <div className="hidden sm:block">
                      <StatusBadge status={selectedProposal.status} />
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/2 scroll-smooth">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-40">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                        <Zap size={24} className="animate-pulse" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest italic">Inicie a conversa agora...</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMe = m.sender_email === user.email;
                      return (
                        <motion.div 
                          key={m.id} 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.05 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] px-6 py-4 rounded-[1.5rem] shadow-xl relative ${
                            isMe
                              ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                              : 'bg-card/60 backdrop-blur-md border border-white/10 rounded-bl-none'
                          }`}>
                            <p className="text-sm md:text-base leading-relaxed font-medium">{m.content}</p>
                            <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isMe ? 'text-white/50' : 'text-muted-foreground/50'}`}>
                              {m.created_at && format(new Date(m.created_at), "HH:mm")}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 bg-white/5 backdrop-blur-2xl border-t border-white/5">
                  <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escreva sua mensagem aqui..."
                      className="flex-1 h-14 px-6 bg-background/50 border-white/10 focus-visible:ring-primary/20 transition-all rounded-2xl text-base font-medium placeholder:text-muted-foreground/40"
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim() || sendMutation.isPending} 
                      className="h-14 w-14 p-0 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-white transition-all shadow-2xl group"
                    >
                      {sendMutation.isPending ? (
                        <Zap className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
