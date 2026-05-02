import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MusicCombobox } from "@/components/MusicCombobox";
import { 
  Copy, Check, QrCode, Clock, Loader2, ArrowLeft, ArrowRight, 
  CheckCircle2, Music, Sparkles, Heart, ShieldCheck, Zap,
  PartyPopper, Wallet, Info
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePixPayload, generatePixQRCodeDataUrl } from "@/lib/pix-qr-generator";
import { motion, AnimatePresence } from "framer-motion";
import TipBadge from "@/components/shared/TipBadge";
import { PLATFORM_CONFIG } from "@/config/platform";

export function TwoStepPixPaymentDialog({
  open,
  onOpenChange,
  artistaId,
  artistaNome,
  pixChave,
  pixTipoChave,
  isPro,
  clienteId,
  sessionId,
  musicas = [],
  estabelecimentoId,
  initialMusica,
  initialClienteNome,
  onSuccess,
}) {
  const [step, setStep] = useState('pedido'); // 'pedido', 'pagamento', 'sucesso'
  const [clienteNome, setClienteNome] = useState("");
  const [pedidoMusica, setPedidoMusica] = useState("");
  const [pedidoMensagem, setPedidoMensagem] = useState("");
  const [musicaCustomizada, setMusicaCustomizada] = useState(false);
  const [creatingPedido, setCreatingPedido] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [openMusicCombobox, setOpenMusicCombobox] = useState(false);
  const [valorGorjeta, setValorGorjeta] = useState("5,00");
  const [copiedCode, setCopiedCode] = useState(false);
  const [dynamicQrCode, setDynamicQrCode] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [confirmingPix, setConfirmingPix] = useState(false);

  useEffect(() => {
    if (open) {
      setPedidoMusica(initialMusica || "");
      setClienteNome(initialClienteNome || "");
      setMusicaCustomizada(false);
      setValorGorjeta("5,00");
    } else {
      setTimeout(() => {
        setStep('pedido');
        setClienteNome("");
        setPedidoMusica("");
        setPedidoMensagem("");
        setMusicaCustomizada(false);
        setPedidoId(null);
        setValorGorjeta("5,00");
        setDynamicQrCode(null);
      }, 500);
    }
  }, [open, initialMusica]);

  const formatCurrency = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue, 10) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrencyToNumber = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return 0;
    return parseInt(numericValue, 10) / 100;
  };

  const handleValorChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 10) {
      setValorGorjeta(formatCurrency(rawValue));
    }
  };

  const activePixInfo = useMemo(() => {
    if (isPro) {
      return { 
        key: pixChave, 
        type: pixTipoChave || 'aleatoria', 
        name: artistaNome 
      };
    }
    return { 
      key: PLATFORM_CONFIG.pix.key, 
      type: PLATFORM_CONFIG.pix.type, 
      name: PLATFORM_CONFIG.pix.merchant_name 
    };
  }, [isPro, pixChave, pixTipoChave, artistaNome]);

  const pixCopiaCola = useMemo(() => {
    if (!activePixInfo.key || !activePixInfo.type) return null;
    try {
      const valor = parseCurrencyToNumber(valorGorjeta);
      return generatePixPayload({
        pixKey: activePixInfo.key,
        keyType: activePixInfo.type,
        merchantName: activePixInfo.name,
        merchantCity: 'BRASIL',
        amount: valor && valor >= 1 ? valor : undefined
      });
    } catch {
      return null;
    }
  }, [activePixInfo, valorGorjeta]);

  useEffect(() => {
    if (step !== 'pagamento') return;
    const generateQr = async () => {
      if (!activePixInfo.key || !activePixInfo.type) return;
      const valor = parseCurrencyToNumber(valorGorjeta);
      if (valor >= 1) {
        setGeneratingQr(true);
        try {
          const qrDataUrl = await generatePixQRCodeDataUrl({
            pixKey: activePixInfo.key,
            keyType: activePixInfo.type,
            merchantName: activePixInfo.name,
            merchantCity: 'BRASIL',
            amount: valor
          });
          setDynamicQrCode(qrDataUrl);
        } catch (error) {
          setDynamicQrCode(null);
        } finally {
          setGeneratingQr(false);
        }
      } else {
        setDynamicQrCode(null);
      }
    };
    const timeoutId = setTimeout(generateQr, 500);
    return () => clearTimeout(timeoutId);
  }, [valorGorjeta, activePixInfo, step]);

  const handleCopyPixCode = async () => {
    if (!pixCopiaCola) return;
    try {
      await navigator.clipboard.writeText(pixCopiaCola);
      setCopiedCode(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      toast.error("Erro ao copiar código PIX");
    }
  };

  const handleCriarPedido = async () => {
    if (!clienteNome.trim()) {
      toast.error("Por favor, digite seu nome");
      return;
    }

    setCreatingPedido(true);
    try {
      const newPedidoId = crypto.randomUUID();
      const insertData = {
        id: newPedidoId,
        artista_id: artistaId,
        cliente_nome: clienteNome.trim(),
        session_id: sessionId,
        musica: pedidoMusica.trim() || "Gorjeta sem pedido de música",
        mensagem: pedidoMensagem.trim() || null,
        status: "aguardando_pix",
      };

      if (clienteId) insertData.cliente_id = clienteId;

      const { error } = await supabase.from("pedidos").insert(insertData);
      if (error) {
        console.error("Error inserting pedido:", error);
      }

      setPedidoId(newPedidoId);
      setStep('pagamento');
    } catch (error) {
      toast.error("Erro ao enviar pedido");
    } finally {
      setCreatingPedido(false);
    }
  };

  const handleConfirmPixPayment = async () => {
    const valor = parseCurrencyToNumber(valorGorjeta);
    if (!valorGorjeta || valor < 1) {
      toast.error("O valor mínimo do PIX é R$ 1,00");
      return;
    }
    if (!pedidoId) {
      toast.error("Pedido não encontrado. Tente novamente.");
      return;
    }

    setConfirmingPix(true);
    try {
      const { data, error } = await supabase.rpc('confirm_direct_pix_payment', {
        p_pedido_id: pedidoId,
        p_valor: valor,
        p_session_id: sessionId || null,
        p_cliente_id: clienteId || null,
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === 'VALOR_INVALIDO') toast.error('O valor mínimo do PIX é R$ 1,00');
        else if (data.error === 'SEM_PERMISSAO') toast.error('Sessão inválida. Tente recarregar a página.');
        else toast.error('Não foi possível registrar o PIX. Tente novamente.');
        return;
      }

      setStep('sucesso');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onOpenChange(false);
      }, 4000);
    } catch (error) {
      console.error('Erro ao confirmar PIX:', error);
      toast.error("Erro ao registrar PIX. Tente novamente.");
    } finally {
      setConfirmingPix(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-white/10 bg-black/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl">
        {/* Background Cinematic Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          {/* Header Area */}
          <div className="px-8 pt-8 pb-4 text-center">
             <div className="w-16 h-1 bg-white/10 rounded-full mx-auto mb-6" />
          </div>

          <AnimatePresence mode="wait">
            {step === 'pedido' ? (
              <motion.div
                key="step-pedido"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="px-8 pb-10 space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20 shadow-inner">
                      <Music className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-heading font-black tracking-tight text-white">
                      Pedir Música
                    </h2>
                    <p className="text-muted-foreground font-medium text-sm">
                      Dê um show no seu pedido para <span className="text-primary font-bold">{artistaNome}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="clienteNome" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Seu Nome ou Mesa</Label>
                    <Input
                      id="clienteNome"
                      placeholder="Como o artista deve te chamar?"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all text-lg font-bold placeholder:text-white/10"
                    />
                  </div>

                  {musicas.length > 0 ? (
                    !musicaCustomizada ? (
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Escolha no Repertório</Label>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {musicas.slice(0, 3).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setPedidoMusica(m.titulo);
                                setMusicaCustomizada(false);
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                pedidoMusica === m.titulo && !musicaCustomizada
                                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                  : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10'
                              }`}
                            >
                              {m.titulo}
                            </button>
                          ))}
                        </div>

                        <MusicCombobox
                          open={openMusicCombobox}
                          onOpenChange={setOpenMusicCombobox}
                          items={musicas}
                          selectedTitle={pedidoMusica}
                          onSelectTitle={setPedidoMusica}
                          forceDrawer
                          triggerPlaceholder="Selecione no repertório..."
                        />
                        <button
                          type="button"
                          className="w-full mt-3 text-xs text-primary/60 hover:text-primary transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                          onClick={() => {
                            setMusicaCustomizada(true);
                            setPedidoMusica("");
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Pedir música fora da lista
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-1">
                           <Label htmlFor="pedidoMusica" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome da Música</Label>
                           <button
                             type="button"
                             className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                             onClick={() => {
                               setMusicaCustomizada(false);
                               setPedidoMusica("");
                             }}
                           >
                             Ver Repertório
                           </button>
                        </div>
                        <Input
                          id="pedidoMusica"
                          placeholder="Ex: Evidências - Chitãozinho & Xororó"
                          value={pedidoMusica}
                          onChange={(e) => setPedidoMusica(e.target.value)}
                          className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all text-lg font-bold placeholder:text-white/10"
                        />
                      </div>
                    )
                  ) : (
                    <div className="space-y-2.5">
                      <Label htmlFor="pedidoMusica" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Música</Label>
                      <Input
                        id="pedidoMusica"
                        placeholder="Qual música você quer ouvir?"
                        value={pedidoMusica}
                        onChange={(e) => setPedidoMusica(e.target.value)}
                        className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all text-lg font-bold placeholder:text-white/10"
                      />
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <Label htmlFor="pedidoMensagem" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dedicatória Especial</Label>
                    <Textarea
                      id="pedidoMensagem"
                      placeholder="Mande um recado para o artista ou para alguém especial..."
                      value={pedidoMensagem}
                      onChange={(e) => setPedidoMensagem(e.target.value)}
                      rows={3}
                      className="bg-white/[0.03] border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all text-base font-medium placeholder:text-white/10 resize-none p-4"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleCriarPedido}
                    disabled={creatingPedido || !clienteNome.trim()}
                    className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-[1.5rem] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    {creatingPedido ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-3">
                        PRÓXIMO PASSO <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : step === 'pagamento' ? (
              <motion.div
                key="step-pagamento"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="px-8 pb-12 space-y-8"
              >
                  <div className="space-y-2 text-center">
                  <div className="inline-flex p-4 bg-emerald-500/20 rounded-3xl mb-2 border border-emerald-500/20 shadow-inner">
                    <Heart className="w-10 h-10 text-emerald-400 fill-emerald-400/20 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-heading font-black tracking-tight text-white">
                    Apoie o Palco
                  </h2>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium text-sm">
                      Sua gorjeta é o melhor aplauso para <span className="text-emerald-400 font-bold">{artistaNome}</span>
                    </p>
                    {!isPro && (
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 py-1 px-3 rounded-full inline-block border border-primary/20">
                        Contribuição Plataforma Tocamais (Taxa 30%)
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <TipBadge amount={parseCurrencyToNumber(valorGorjeta)} />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-emerald-500">R$</span>
                        <Input
                          id="valorGorjetaPix"
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={valorGorjeta}
                          onChange={handleValorChange}
                          className="h-28 bg-white/5 border-white/10 rounded-[2.5rem] text-5xl font-black text-center pl-16 focus:ring-emerald-500/30 focus:border-emerald-500/40 text-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {parseCurrencyToNumber(valorGorjeta) >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col items-center gap-6 p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5 backdrop-blur-xl"
                      >
                        <div className="relative group/qr">
                          <div className="absolute -inset-4 bg-white/10 rounded-[2rem] blur-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                          <div className="relative p-5 bg-white rounded-[2rem] shadow-2xl">
                            {generatingQr ? (
                              <div className="w-44 h-44 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gerando...</span>
                              </div>
                            ) : dynamicQrCode ? (
                              <img
                                src={dynamicQrCode}
                                alt="QR Code PIX"
                                className="w-44 h-44 object-contain"
                              />
                            ) : (
                              <div className="w-44 h-44 flex items-center justify-center text-muted-foreground text-[10px] font-black uppercase text-center p-6">
                                <Info className="w-6 h-6 mb-2 opacity-20 block mx-auto" />
                                Erro no QR Code
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {pixCopiaCola && (
                          <div className="w-full space-y-3">
                            <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                              <div className="flex-1 px-4 py-3 truncate font-mono text-[10px] text-white/40">
                                {pixCopiaCola}
                              </div>
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={handleCopyPixCode}
                                className="shrink-0 h-11 w-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl transition-all active:scale-95"
                              >
                                {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              </Button>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground opacity-40">
                               Copie o código acima ou escaneie o QR Code
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Pagamento 100% Seguro</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <Button
                    onClick={handleConfirmPixPayment}
                    disabled={confirmingPix || !valorGorjeta || parseCurrencyToNumber(valorGorjeta) < 1}
                    className="h-20 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg rounded-[1.5rem] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {confirmingPix ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6" /> JÁ REALIZEI O PAGAMENTO
                      </span>
                    )}
                  </Button>
                  <button
                    onClick={() => setStep('pedido')}
                    className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-all py-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o pedido
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-sucesso"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-8 pb-16 pt-8 text-center space-y-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="relative w-32 h-32 bg-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl"
                  >
                    <PartyPopper className="w-16 h-16 text-white" />
                  </motion.div>
                </div>

                <div className="space-y-3">
                   <h2 className="text-4xl font-heading font-black tracking-tighter text-white uppercase">
                      Show de Apoio!
                   </h2>
                   <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xs mx-auto">
                      Sua gorjeta foi enviada para processamento. {artistaNome} foi notificado e, assim que confirmar o recebimento, seu pedido entrará na fila!
                   </p>
                </div>

                <div className="flex flex-col items-center gap-4 pt-6">
                   <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                      <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-black uppercase tracking-widest text-white">Impacto Real no Artista</span>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 animate-pulse">
                      Fechando automaticamente...
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
