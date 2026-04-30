import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
      const votacoes = await base44.entities.Poll.filter({ 
        artista_id: artistaId, 
        status: "ativa" 
      });

      const activePoll = votacoes.find(v => new Date(v.expires_at) > new Date());

      if (!activePoll) {
        setVotacaoId(null);
        return;
      }

      setVotacaoId(activePoll.id);
      setExpiresAt(activePoll.expires_at);

      const opcoesData = await base44.entities.PollOption.filter({ 
        votacao_id: activePoll.id 
      });
      setOpcoes(opcoesData || []);

      const votos = await base44.entities.Vote.filter({ 
        votacao_id: activePoll.id 
      });
      
      const meuVoto = votos.find(v => userId ? v.user_id === userId : v.session_id === sessionId);
      
      if (meuVoto) {
        setVotedOpcaoId(meuVoto.opcao_id);
      }
    } catch (e) {
      console.log("Votacao features not available yet", e);
    }
  };

  const handleVote = async (opcaoId) => {
    if (votedOpcaoId || voting || !votacaoId) return;
    setVoting(true);

    try {
      await base44.entities.Vote.create({
        votacao_id: votacaoId,
        opcao_id: opcaoId,
        user_id: userId || null,
        session_id: userId ? null : sessionId,
      });

      // Manually increment count in mock (in real DB a trigger would do this)
      const opcao = opcoes.find(o => o.id === opcaoId);
      if (opcao) {
        await base44.entities.PollOption.update(opcaoId, {
          votos_count: (opcao.votos_count || 0) + 1
        });
      }

      setVotedOpcaoId(opcaoId);
      toast.success("Voto registrado! 🗳️");
      fetchVotacao(); // Refresh counts
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
