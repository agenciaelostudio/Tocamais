import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    refetchInterval: 5000,
  });

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
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Chat 💬</h1>
        <p className="text-muted-foreground mt-1">Converse sobre suas propostas</p>
      </motion.div>

      <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Conversations list */}
          <div className={`w-full sm:w-80 border-r border-border flex-shrink-0 overflow-y-auto ${selectedProposal ? 'hidden sm:block' : ''}`}>
            {proposals.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma conversa</p>
                </div>
              </div>
            ) : (
              proposals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProposal(p)}
                  className={`w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors ${
                    selectedProposal?.id === p.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <p className="font-medium text-sm truncate">{isArtist ? p.venue_name : p.artist_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.event_date && format(new Date(p.event_date), "dd MMM", { locale: ptBR })} · R$ {p.offered_price?.toLocaleString('pt-BR')}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!selectedProposal ? 'hidden sm:flex' : 'flex'}`}>
            {!selectedProposal ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Selecione uma conversa</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button onClick={() => setSelectedProposal(null)} className="sm:hidden">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <p className="font-heading font-bold text-sm">{isArtist ? selectedProposal.venue_name : selectedProposal.artist_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Proposta: {selectedProposal.event_date && format(new Date(selectedProposal.event_date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const isMe = m.sender_email === user.email;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}>
                          <p>{m.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {m.created_date && format(new Date(m.created_date), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!message.trim() || sendMutation.isPending} className="bg-primary">
                    <Send size={16} />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}