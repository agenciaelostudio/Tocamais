import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SEOHead } from "@/components/SEOHead";
import { GlassCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Music, 
  Calendar, 
  MapPin, 
  Users, 
  Volume2, 
  DollarSign, 
  Clock, 
  Search, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { useSessionId } from "@/hooks/useSessionId";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS_EVENTO = [
  "Casamento", "Aniversário", "Festa corporativa", "Formatura",
  "Confraternização", "Bar/Restaurante", "Festival", "Outro"
];

const CACHE_SUGESTAO_POR_CONVIDADO = 30;

export default function Contratacao({ user }) {
  const { artistaId } = useParams();
  const navigate = useNavigate();
  const [artista, setArtista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [searchParams] = useSearchParams();
  const initialFormat = searchParams.get("format") || "";
  const initialPrice = searchParams.get("price") || "";

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
    descricao: initialFormat ? `Formato escolhido: ${initialFormat}` : "",
    cache_sugerido: initialPrice || "",
  });

  const cacheSugerido = useMemo(() => 
    Math.max(500, (parseInt(form.convidados) || 50) * CACHE_SUGESTAO_POR_CONVIDADO),
    [form.convidados]
  );

  useEffect(() => {
    if (artistaId) loadData();
  }, [artistaId]);

  useEffect(() => {
    if (!form.cache_sugerido || (form.cache_sugerido === String(cacheSugerido) && !initialPrice)) {
      setForm(f => ({ ...f, cache_sugerido: String(cacheSugerido) }));
    }
  }, [cacheSugerido, initialPrice]);

  const loadData = async () => {
    try {
      const profiles = await base44.entities.ArtistProfile.filter({ id: artistaId });
      const artistaData = profiles[0];

      if (!artistaData) {
        toast.error("Artista não encontrado");
        navigate("/explore");
        return;
      }

      setArtista({
        id: artistaData.id,
        stage_name: artistaData.stage_name,
        avatar_url: artistaData.avatar_url,
        genres: artistaData.genres,
        city: artistaData.city
      });
      
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
    setSubmitting(true);
    try {
      await base44.entities.Proposal.create({
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
        message: [form.local, form.numero && `nº ${form.numero}`, form.complemento, form.descricao].filter(Boolean).join(", ") || null,
        status: "pending",
      });

      toast.success("Proposta enviada com sucesso! 🚀");
      navigate("/proposals");
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
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Music className="w-8 h-8 text-primary animate-pulse-soft" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Preparando contrato...</p>
        </div>
      </div>
    );
  }

  const nextStep = () => {
    if (step === 1 && (!form.data_evento || !form.horario_inicio || !form.local)) {
      toast.error("Preencha data, hora e local do show");
      return;
    }
    if (step === 2 && !form.tipo_evento) {
      toast.error("Selecione o tipo de evento");
      return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8">
      <SEOHead title={`Contratar ${artista?.stage_name} — Tocamais`} description={`Envie uma proposta de contratação para ${artista?.stage_name}.`} />

      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <header className="sticky top-0 z-50 mb-8">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-2xl rounded-3xl border border-white/5" />
        <div className="relative container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading font-black text-xl tracking-tight">Proposta de Show</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`h-1.5 rounded-full transition-all duration-700 ${s <= step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'w-2 bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Etapa {step} de 3</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl pb-40 relative z-10">
        {/* Artist Quick Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="relative group rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="relative">
                <Avatar className="w-20 h-20 rounded-2xl ring-4 ring-background shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <AvatarImage src={artista?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-black text-2xl">{artista?.stage_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center border-2 border-background shadow-lg">
                  <Music className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Contratação Oficial</p>
                <h2 className="text-3xl font-heading font-black tracking-tight">{artista?.stage_name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {artista?.city}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> 4.9
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              <div className="space-y-3 px-2">
                <h3 className="text-3xl font-heading font-black tracking-tight text-foreground">Logística do Show</h3>
                <p className="text-muted-foreground text-lg font-medium">Defina onde e quando a mágica vai acontecer.</p>
              </div>

              <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Data do Evento</Label>
                    <Input type="date" value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))} min={new Date().toISOString().split("T")[0]} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Clock className="w-4 h-4" /> Horário de Início</Label>
                    <Input type="time" value={form.horario_inicio} onChange={e => setForm(f => ({ ...f, horario_inicio: e.target.value }))} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-bold" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Search className="w-4 h-4" /> Localização (CEP)</Label>
                    <div className="relative group">
                      <Input placeholder="00000-000" value={form.cep} onChange={e => handleCepChange(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-lg font-black tracking-tighter pl-6" inputMode="numeric" />
                      {loadingCep && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço Oficial</Label>
                    <Input placeholder="Ex: Rua das Flores, 123 — Centro" value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Número</Label>
                      <Input placeholder="123" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Complemento</Label>
                      <Input placeholder="Apto, Sala..." value={form.complemento} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              <div className="space-y-3 px-2">
                <h3 className="text-3xl font-heading font-black tracking-tight text-foreground">Perfil do Evento</h3>
                <p className="text-muted-foreground text-lg font-medium">Conte os detalhes para o artista se preparar.</p>
              </div>

              <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary">Tipo de Celebração</Label>
                  <Select value={form.tipo_evento} onValueChange={v => setForm(f => ({ ...f, tipo_evento: v }))}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 text-base font-bold"><SelectValue placeholder="Escolha o tipo de evento" /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 backdrop-blur-3xl bg-card/90">
                      {TIPOS_EVENTO.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Users className="w-4 h-4" /> Público Esperado</Label>
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <Input type="number" value={form.convidados} onChange={e => setForm(f => ({ ...f, convidados: e.target.value }))} className="h-14 w-32 rounded-xl bg-background border-white/10 text-center font-black text-2xl tracking-tighter" />
                    <p className="text-sm font-bold text-muted-foreground">convidados vibrando na pista.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary/5 border border-secondary/10 group transition-all hover:bg-secondary/10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                      <Volume2 className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight">Som Próprio Local?</p>
                      <p className="text-xs font-bold text-muted-foreground">O artista usará a estrutura da casa.</p>
                    </div>
                  </div>
                  <Switch checked={form.tem_equipamento_som} onCheckedChange={v => setForm(f => ({ ...f, tem_equipamento_som: v }))} className="data-[state=checked]:bg-secondary" />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary">Mensagem para o Artista</Label>
                  <Textarea placeholder="Descreva o clima, peça músicas especiais ou dê instruções de acesso..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={4} className="rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 p-6 text-base font-medium resize-none leading-relaxed" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              <div className="space-y-3 px-2">
                <h3 className="text-3xl font-heading font-black tracking-tight text-foreground">Acordo Comercial</h3>
                <p className="text-muted-foreground text-lg font-medium">Valorize o talento com uma proposta justa.</p>
              </div>

              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 backdrop-blur-xl p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="flex items-start gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Sugestão Tocamais</p>
                    <p className="text-sm font-bold text-foreground/80 leading-snug">Cachê ideal para {form.convidados} convidados:</p>
                  </div>
                </div>
                <div className="text-5xl font-heading font-black tracking-tighter text-primary relative z-10 flex items-end gap-2">
                  <span className="text-xl font-bold opacity-60 mb-2">R$</span>
                  {cacheSugerido.toLocaleString("pt-BR")}
                </div>
              </div>

              <div className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary">Sua Oferta Final</Label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/40 tracking-tight">R$</div>
                    <Input 
                      type="number" 
                      value={form.cache_sugerido} 
                      onChange={e => setForm(f => ({ ...f, cache_sugerido: e.target.value }))} 
                      className="h-24 pl-20 rounded-[2rem] bg-white/5 border-primary/20 focus:border-primary text-4xl font-heading font-black tracking-tighter shadow-inner transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-[0.2em] pt-2">O valor final pode ser ajustado no chat 💬</p>
                </div>
              </div>

              {/* Preview Summary */}
              <div className="relative p-10 rounded-[3rem] bg-white/5 border border-dashed border-white/10 overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
                
                <h4 className="relative z-10 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Checklist da Proposta
                </h4>
                
                <div className="relative z-10 grid grid-cols-2 gap-y-8 gap-x-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Performance</p>
                    <p className="text-base font-black text-foreground tracking-tight">
                      {form.data_evento ? (
                        (() => {
                          try {
                            const d = new Date(form.data_evento + 'T12:00:00'); // Safety for timezone
                            return isNaN(d.getTime()) ? "--" : format(d, "dd 'de' MMMM", { locale: ptBR });
                          } catch { return "--"; }
                        })()
                      ) : "--"}
                    </p>
                    <p className="text-xs font-bold text-primary/70">{form.horario_inicio ? `Início às ${form.horario_inicio}` : "Horário pendente"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Público & Som</p>
                    <p className="text-base font-black text-foreground tracking-tight">{form.convidados} convidados</p>
                    <p className="text-xs font-bold text-secondary/70">{form.tem_equipamento_som ? "Som da Casa" : "Artista leva o som"}</p>
                  </div>
                  
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Local do Evento</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-base font-black text-foreground tracking-tight leading-tight">
                        {form.local ? `${form.local}${form.numero ? `, nº ${form.numero}` : ""}` : "Endereço não definido"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-background via-background/95 to-transparent z-50">
        <div className="max-w-2xl mx-auto flex gap-4">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={prevStep} className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          
          {step < 3 ? (
            <Button className="flex-1 h-16 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-lg font-black tracking-tight shadow-2xl transition-all" onClick={nextStep}>
              PRÓXIMO PASSO <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          ) : (
            <Button 
              className="flex-1 h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 text-lg font-black tracking-tight shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] transition-all disabled:opacity-50" 
              onClick={handleSubmit} 
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
              ) : (
                <Send className="w-6 h-6 mr-3" />
              )}
              {submitting ? "ENVIANDO..." : "ENVIAR PROPOSTA"}
            </Button>
          )}
        </div>
        {step === 3 && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center text-[10px] text-muted-foreground mt-4 font-black uppercase tracking-[0.2em]"
          >
            NOTIFICAÇÃO INSTANTÂNEA PARA O ARTISTA ⚡
          </motion.p>
        )}
      </div>
    </div>
  );
}