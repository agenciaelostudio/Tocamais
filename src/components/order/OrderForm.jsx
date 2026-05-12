import { useState } from "react";
import { SongSelector } from "./SongSelector";
import { DonationInput } from "./DonationInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Music2, Heart, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function OrderForm({ artistaId, artistName, onSubmit }) {
  const [step, setStep] = useState(1); // 1: Song, 2: Donation, 3: Review
  const [selectedSong, setSelectedSong] = useState(null);
  const [donationAmount, setDonationAmount] = useState(0);
  const [customSong, setCustomSong] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [dedication, setDedication] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceedStep1 = (selectedSong || customSong.trim()) && customerName.trim();
  const canSubmit = (selectedSong || customSong.trim()) && customerName.trim() && (donationAmount === 0 || donationAmount >= 2);

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    setCustomSong("");
    // Auto-advance to step 2 for faster experience
    setTimeout(() => setStep(2), 300);
  };

  const handleNext = () => {
    if (step === 1 && (selectedSong || (donationAmount >= 2 && customSong.trim()))) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        artista_id: artistaId,
        cliente_nome: customerName,
        musica_id: selectedSong?.id || null,
        musica_nome: selectedSong ? `${selectedSong.titulo} / ${selectedSong.autor}` : customSong,
        valor: donationAmount,
        mensagem: dedication,
        tipo: donationAmount > 0 ? 'pago' : 'gratis'
      };
      
      await onSubmit(payload);
      toast.success("Pedido enviado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-black/40 backdrop-blur-2xl border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
      {/* Header */}
      <div className="p-8 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Fazer <span className="text-emerald-400">Pedido</span>
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Para: <span className="text-white font-bold">{artistName}</span></p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === s ? "w-8 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" : 
                step > s ? "w-4 bg-emerald-500/40" : "w-4 bg-white/10"
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <Music2 className="h-4 w-4 text-emerald-400" />
                  Passo 1: Qual música?
                </Label>
                <SongSelector 
                  artistaId={artistaId} 
                  selectedSongId={selectedSong?.id}
                  onSelect={handleSongSelect}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30">Seu Nome / Mesa</Label>
                <Input 
                  placeholder="Como o artista deve te chamar?"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold focus:ring-emerald-500/20"
                />
              </div>

              {donationAmount >= 2 && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30">Música Personalizada (Fora do Setlist)</Label>
                  <div className="relative group">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 animate-pulse" />
                    <Input 
                      placeholder="Nome da música e artista..."
                      value={customSong}
                      onChange={(e) => {
                        setCustomSong(e.target.value);
                        setSelectedSong(null);
                      }}
                      className="pl-12 bg-white/5 border-white/10 h-16 rounded-2xl text-lg font-bold focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              )}

              {!selectedSong && (
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest opacity-40">
                  Ou selecione uma música do repertório acima
                </p>
              )}

              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={`w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-widest shadow-2xl transition-all duration-300 ${
                  canProceedStep1 ? "bg-emerald-500 hover:bg-emerald-400 text-black scale-[1.02]" : "bg-white/5 text-white/20"
                }`}
              >
                Próximo Passo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-400" />
                  Passo 2: Apoio ao Artista
                </Label>
                <p className="text-xs text-muted-foreground font-medium">Sua gorjeta incentiva o músico e libera mensagens personalizadas.</p>
                <DonationInput value={donationAmount} onChange={setDonationAmount} />
              </div>

              {donationAmount >= 2 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-2 pt-2"
                >
                  <Label className="text-sm font-medium text-white/80">Dedicatória / Mensagem</Label>
                  <Textarea 
                    placeholder="Escreva algo especial para o artista ou para quem você dedica essa música..."
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    className="bg-white/5 border-white/10 min-h-[100px] rounded-xl resize-none focus:ring-emerald-500/20"
                    maxLength={200}
                  />
                  <p className="text-[10px] text-right text-muted-foreground">{dedication.length}/200</p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-14 flex-1 rounded-2xl text-white/60 hover:text-white">
                  Voltar
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={donationAmount > 0 && donationAmount < 2}
                  className="h-14 flex-[2] rounded-2xl text-lg font-bold shadow-xl bg-emerald-500 hover:bg-emerald-400 text-black"
                >
                  Ver Resumo
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 h-24 w-24 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors" />
                <div className="relative z-10 space-y-4">
                  <div>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold mb-1">Música Selecionada</p>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {selectedSong?.titulo || customSong}
                    </h3>
                    <p className="text-sm text-white/60">
                      {selectedSong?.autor || "Música personalizada"}
                    </p>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t border-white/10">
                    <div>
                      <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold">Valor</p>
                      <p className="text-2xl font-black text-white font-heading">
                        {donationAmount > 0 ? `R$ ${donationAmount.toFixed(2)}` : "Grátis"}
                      </p>
                    </div>
                    {donationAmount > 0 && (
                      <div className="bg-emerald-500/20 p-2 rounded-xl">
                        <Sparkles className="h-6 w-6 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {dedication && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold mb-2">Mensagem</p>
                      <p className="text-sm italic text-white/80 leading-relaxed">"{dedication}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="h-14 flex-1 rounded-2xl text-white/60 hover:text-white">
                  Ajustar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-14 flex-[2] rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  {isSubmitting ? "Enviando..." : (donationAmount > 0 ? "Pagar via PIX" : "Enviar Pedido")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-white/5 text-center">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          Sua gorjeta vai direto para o artista
        </p>
      </div>
    </Card>
  );
}

function Label({ children, className, ...props }) {
  return (
    <label className={`block text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}
