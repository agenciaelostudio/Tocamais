import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Loader2, Music, Calendar, MapPin, Users, Volume2, DollarSign, Clock, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSessionId } from "@/hooks/useSessionId";

const TIPOS_EVENTO = [
  "Casamento", "Aniversário", "Festa corporativa", "Formatura",
  "Confraternização", "Bar/Restaurante", "Festival", "Outro"
];

const CACHE_SUGESTAO_POR_CONVIDADO = 30;

export default function Contratacao({ user }) {
  const { artistaId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = useSessionId();
  const [artista, setArtista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [form, setForm] = useState({
    tipo_evento: "",
    data_evento: "",
    horario_inicio: "",
    cep: "",
    local: "",
    numero: "",
    complemento: "",
    convidados: "50",
    tem_equipamento_som: false,
    descricao: "",
    cache_sugerido: "",
  });

  const cacheSugerido = Math.max(500, (parseInt(form.convidados) || 50) * CACHE_SUGESTAO_POR_CONVIDADO);

  useEffect(() => {
    if (artistaId) loadData();
  }, [artistaId]);

  useEffect(() => {
    if (!form.cache_sugerido || form.cache_sugerido === String(cacheSugerido)) {
      setForm(f => ({ ...f, cache_sugerido: String(cacheSugerido) }));
    }
  }, [cacheSugerido]);

  const loadData = async () => {
    try {
      const { data: artistaData, error } = await supabase
        .from("artist_profiles")
        .select("id, stage_name, avatar_url, genres, city")
        .eq("id", artistaId)
        .single();

      if (error || !artistaData) {
        toast.error("Artista não encontrado");
        navigate("/explore");
        return;
      }

      setArtista(artistaData);
      setForm(f => ({ ...f, cache_sugerido: String(cacheSugerido) }));
    } catch (err) {
      console.error("Erro ao carregar:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = useCallback(async (cep) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      const endereco = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`].filter(Boolean).join(", ");
      setForm(f => ({ ...f, local: endereco }));
      toast.success("Endereço encontrado!");
    } catch { toast.error("Erro ao buscar CEP"); }
    finally { setLoadingCep(false); }
  }, []);

  const handleCepChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm(f => ({ ...f, cep: formatted }));
    if (digits.length === 8) buscarCep(digits);
  };

  const handleSubmit = async () => {
    if (!user?.id || !artistaId) {
      toast.error("Você precisa estar logado para contratar");
      return;
    }
    if (!form.tipo_evento || !form.data_evento || !form.horario_inicio || !form.cache_sugerido) {
      toast.error("Preencha data, horário e valor da oferta");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("proposals").insert({
        venue_id: user.venue_id || null,
        venue_name: user.venue_name || null,
        artist_profile_id: artistaId,
        artist_name: artista?.stage_name || null,
        artist_email: user.artist_email || null,
        bar_owner_email: user.email || null,
        event_date: form.data_evento,
        start_time: form.horario_inicio,
        end_time: form.horario_inicio,
        offered_price: parseFloat(form.cache_sugerido),
        message: [form.local, form.numero && `nº ${form.numero}`, form.complemento].filter(Boolean).join(", ") || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Proposta enviada! O artista terá 48h para responder.");
      navigate(-1);
    } catch (err) {
      console.error("Erro ao enviar:", err);
      toast.error("Erro ao enviar proposta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <SEOHead title="Contratar Artista" description="Envie uma proposta de contratação" />

      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-primary">Contratar</span> Artista
            </h1>
            <p className="text-xs text-muted-foreground">Preencha os detalhes do seu evento</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 space-y-4 max-w-lg">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              Artista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {artista ? (
              <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">
                {artista.stage_name}
                {artista.genres?.[0] && <span className="text-muted-foreground ml-1">• {artista.genres[0]}</span>}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Artista não encontrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Detalhes do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de Evento *</Label>
              <Select value={form.tipo_evento} onValueChange={v => setForm(f => ({ ...f, tipo_evento: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Data *
                </Label>
                <Input type="date" value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Hora *
                </Label>
                <Input type="time" value={form.horario_inicio} onChange={e => setForm(f => ({ ...f, horario_inicio: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Search className="w-3 h-3" /> CEP
              </Label>
              <div className="flex gap-2 items-center">
                <Input placeholder="00000-000" value={form.cep} onChange={e => handleCepChange(e.target.value)} className="w-36" inputMode="numeric" />
                {loadingCep && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Endereço *
              </Label>
              <Input placeholder="Rua, bairro, cidade..." value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Número</Label>
                <Input placeholder="123" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Complemento</Label>
                <Input placeholder="Apto 101..." value={form.complemento} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> Convidados
              </Label>
              <Input type="number" placeholder="50" min="1" value={form.convidados} onChange={e => setForm(f => ({ ...f, convidados: e.target.value }))} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm flex items-center gap-2 cursor-pointer">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  Local tem sonorização
                </Label>
                <p className="text-xs text-muted-foreground ml-6">Artista não precisa levar equipamento</p>
              </div>
              <Switch checked={form.tem_equipamento_som} onCheckedChange={v => setForm(f => ({ ...f, tem_equipamento_som: v }))} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea placeholder="Detalhes adicionais, repertório preferido..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Cachê
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs text-muted-foreground">Valor sugerido para {form.convidados || 50} convidados:</p>
              <p className="text-lg font-bold text-primary">R$ {cacheSugerido.toLocaleString("pt-BR")}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sua oferta (R$)</Label>
              <Input type="number" placeholder="1500" min="0" step="50" value={form.cache_sugerido} onChange={e => setForm(f => ({ ...f, cache_sugerido: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto space-y-2">
          <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
            Enviar Proposta
          </Button>
          <p className="text-center text-xs text-muted-foreground">O artista terá 48h para responder</p>
        </div>
      </div>
    </div>
  );
}