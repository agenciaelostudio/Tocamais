import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Vote, Timer, CheckCircle2, Music } from "lucide-react";
import { toast } from "sonner";
import { useSessionId } from "@/hooks/useSessionId";

export function VotacaoFa({ artistaId, userId }) {
  const sessionId = useSessionId();
  const [votacaoId, setVotacaoId] = useState(null);
  const [opcoes, setOpcoes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [votedOpcaoId, setVotedOpcaoId] = useState(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchVotacao();
  }, [artistaId]);

  // Realtime for vote counts
  useEffect(() => {
    if (!votacaoId) return;
    const channel = supabase
      .channel(`votacao-fan-${votacaoId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "votacao_opcoes",
        filter: `votacao_id=eq.${votacaoId}`,
      }, (payload) => {
        setOpcoes(prev => prev.map(o => o.id === payload.new.id ? { ...o, votos_count: payload.new.votos_count } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [votacaoId]);

  // Countdown
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
        setVotacaoId(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const fetchVotacao = async () => {
    try {
      const { data } = await supabase
        .from("votacoes")
        .select("*")
        .eq("artista_id", artistaId)
        .eq("status", "ativa")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!data || data.length === 0) {
        setVotacaoId(null);
        return;
      }

      const v = data[0];
      setVotacaoId(v.id);
      setExpiresAt(v.expires_at);

      const { data: opcoesData } = await supabase
        .from("votacao_opcoes")
        .select("*")
        .eq("votacao_id", v.id);
      setOpcoes(opcoesData || []);

      // Check if already voted
      const { data: votoData } = await supabase
        .from("votacao_votos")
        .select("opcao_id")
        .eq("votacao_id", v.id)
        .or(userId ? `user_id.eq.${userId}` : `session_id.eq.${sessionId}`)
        .limit(1);
      
      if (votoData && votoData.length > 0) {
        setVotedOpcaoId(votoData[0].opcao_id);
      }
    } catch (e) {
      // Tables might not exist yet
      console.log("Votacao features not available yet");
    }
  };

  const handleVote = async (opcaoId) => {
    if (votedOpcaoId || voting || !votacaoId) return;
    setVoting(true);

    try {
      const { data, error } = await supabase.rpc("registrar_voto", {
        p_votacao_id: votacaoId,
        p_opcao_id: opcaoId,
        p_user_id: userId || null,
        p_session_id: userId ? null : sessionId,
      });

      if (error || !data?.success) {
        toast.error(data?.error === "already_voted" ? "Você já votou!" : "Erro ao votar");
        return;
      }

      setVotedOpcaoId(opcaoId);
      toast.success("Voto registrado! 🗳️");
    } catch (e) {
      toast.error("Votação não disponível");
    } finally {
      setVoting(false);
    }
  };

  if (!votacaoId || timeLeft <= 0) return null;

  const totalVotos = opcoes.reduce((s, o) => s + o.votos_count, 0);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Vote className="w-5 h-5 text-purple-500" />
            Vote na Próxima Música!
          </CardTitle>
          <Badge variant="outline" className="text-purple-500 border-purple-500/30 font-mono animate-pulse">
            <Timer className="w-3 h-3 mr-1" />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {opcoes.map((opcao) => {
          const percent = totalVotos > 0 ? (opcao.votos_count / totalVotos) * 100 : 0;
          const isVoted = votedOpcaoId === opcao.id;

          return (
            <Button
              key={opcao.id}
              variant={isVoted ? "default" : "outline"}
              className={`w-full justify-start h-auto py-3 px-4 ${isVoted ? "bg-purple-500 hover:bg-purple-600" : ""}`}
              disabled={!!votedOpcaoId || voting}
              onClick={() => handleVote(opcao.id)}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm flex items-center gap-1.5">
                    {isVoted && <CheckCircle2 className="w-4 h-4" />}
                    <Music className="w-3 h-3" />
                    {opcao.titulo}
                  </span>
                  {votedOpcaoId && (
                    <span className="text-xs opacity-80">{opcao.votos_count} votos</span>
                  )}
                </div>
                {opcao.artista_original && (
                  <span className="text-xs opacity-70">{opcao.artista_original}</span>
                )}
                {votedOpcaoId && (
                  <Progress value={percent} className="h-1.5 mt-1.5" />
                )}
              </div>
            </Button>
          );
        })}
        <p className="text-xs text-muted-foreground text-center pt-1">
          {votedOpcaoId ? `${totalVotos} votos no total` : "Escolha sua favorita!"}
        </p>
      </CardContent>
    </Card>
  );
}
