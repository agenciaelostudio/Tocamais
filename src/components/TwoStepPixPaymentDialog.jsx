import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MusicCombobox } from "@/components/MusicCombobox";
import { Copy, Check, Clock, Loader2, ArrowRight, Music, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePixPayload, generatePixQRCodeDataUrl } from "@/lib/pix-qr-generator";
import { motion, AnimatePresence } from "framer-motion";

export function TwoStepPixPaymentDialog({
  open,
  onOpenChange,
  artistaId,
  artistaNome,
  pixChave,
  pixTipoChave,
  clienteId,
  sessionId,
  musicas = [],
  estabelecimentoId,
  initialMusica,
  initialClienteNome,
}) {
  const [step, setStep] = useState('pedido');
  const [clienteNome, setClienteNome] = useState("");
  const [pedidoMusica, setPedidoMusica] = useState("");
  const [pedidoMensagem, setPedidoMensagem] = useState("");
  const [musicaCustomizada, setMusicaCustomizada] = useState(false);
  const [creatingPedido, setCreatingPedido] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [openMusicCombobox, setOpenMusicCombobox] = useState(false);
  const [valorGorjeta, setValorGorjeta] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [dynamicQrCode, setDynamicQrCode] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [confirmingPix, setConfirmingPix] = useState(false);

  useEffect(() => {
    if (open) {
      setPedidoMusica(initialMusica || "");
      setClienteNome(initialClienteNome || "");
      setMusicaCustomizada(false);
    } else {
      setStep('pedido');
      setClienteNome("");
      setPedidoMusica("");
      setPedidoMensagem("");
      setMusicaCustomizada(false);
      setPedidoId(null);
      setValorGorjeta("");
      setDynamicQrCode(null);
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

  const pixCopiaCola = useMemo(() => {
    if (!pixChave || !pixTipoChave) return null;
    try {
      const valor = parseCurrencyToNumber(valorGorjeta);
      return generatePixPayload({
        pixKey: pixChave,
        keyType: pixTipoChave,
        merchantName: artistaNome,
        merchantCity: 'BRASIL',
        amount: valor && valor >= 1 ? valor : undefined
      });
    } catch {
      return null;
    }
  }, [pixChave, pixTipoChave, artistaNome, valorGorjeta]);

  useEffect(() => {
    if (step !== 'pagamento') return;
    const generateQr = async () => {
      if (!pixChave || !pixTipoChave) return;
      const valor = parseCurrencyToNumber(valorGorjeta);
      if (valor >= 1) {
        setGeneratingQr(true);
        try {
          const qrDataUrl = await generatePixQRCodeDataUrl({
            pixKey: pixChave,
            keyType: pixTipoChave,
            merchantName: artistaNome,
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
  }, [valorGorjeta, pixChave, pixTipoChave, artistaNome, step]);

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

    setConfirmingPix(true);
    try {
      const { error } = await supabase.from("tips").insert({
        artist_profile_id: artistaId,
        fan_name: clienteNome,
        amount: valor,
        message: pedidoMensagem || pedidoMusica,
      });

      if (error) throw error;

      toast.success("PIX registrado!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao confirmar PIX");
    } finally {
      setConfirmingPix(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-black/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl">
        {/* Background Cinematic Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 p-8 space-y-6">
          <AnimatePresence mode="wait">
            {step === 'pedido' ? (
              <motion.div
                key="step-pedido"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-2xl">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                      Pedir música
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-sm pl-1">
                    Faça seu pedido para <span className="text-primary font-medium">{artistaNome}</span>
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="clienteNome" className="text-white/80 font-medium ml-1">Seu nome</Label>
                    <Input
                      id="clienteNome"
                      placeholder="Ex: João da mesa 5"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-white/20"
                    />
                  </div>

                  {musicas.length > 0 ? (
                    !musicaCustomizada ? (
                      <div className="space-y-2.5">
                        <Label className="text-white/80 font-medium ml-1">Escolha no repertório</Label>
                        <MusicCombobox
                          open={openMusicCombobox}
                          onOpenChange={setOpenMusicCombobox}
                          items={musicas}
                          selectedTitle={pedidoMusica}
                          onSelectTitle={setPedidoMusica}
                          forceDrawer
                        />
                        <button
                          type="button"
                          className="w-full mt-2 text-xs text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 font-medium"
                          onClick={() => {
                            setMusicaCustomizada(true);
                            setPedidoMusica("");
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          Ou peça uma música fora da lista
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <Label htmlFor="pedidoMusica" className="text-white/80 font-medium ml-1 flex justify-between">
                          Música
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => {
                              setMusicaCustomizada(false);
                              setPedidoMusica("");
                            }}
                          >
                            Ver repertório
                          </button>
                        </Label>
                        <Input
                          id="pedidoMusica"
                          placeholder="Nome da música ou artista"
                          value={pedidoMusica}
                          onChange={(e) => setPedidoMusica(e.target.value)}
                          className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-white/20"
                        />
                      </div>
                    )
                  ) : (
                    <div className="space-y-2.5">
                      <Label htmlFor="pedidoMusica" className="text-white/80 font-medium ml-1">Música</Label>
                      <Input
                        id="pedidoMusica"
                        placeholder="Nome da música ou artista"
                        value={pedidoMusica}
                        onChange={(e) => setPedidoMusica(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-white/20"
                      />
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <Label htmlFor="pedidoMensagem" className="text-white/80 font-medium ml-1">Dedicatória (opcional)</Label>
                    <Textarea
                      id="pedidoMensagem"
                      placeholder="Adicione uma dedicatória especial..."
                      value={pedidoMensagem}
                      onChange={(e) => setPedidoMensagem(e.target.value)}
                      rows={3}
                      className="bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-white/20 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleCriarPedido}
                    disabled={creatingPedido || !clienteNome.trim()}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {creatingPedido ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Avançar para Pagamento <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-pagamento"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <div className="inline-flex p-3 bg-secondary/20 rounded-2xl mb-2">
                    <Heart className="w-8 h-8 text-secondary fill-secondary/20" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Apoie o Artista
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Sua gorjeta incentiva <span className="text-secondary font-medium">{artistaNome}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-white/80 font-medium text-center block w-full">Valor da Gorjeta</Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-secondary/10 rounded-3xl blur-xl group-hover:bg-secondary/20 transition-all" />
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-secondary">R$</span>
                        <Input
                          id="valorGorjetaPix"
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={valorGorjeta}
                          onChange={handleValorChange}
                          className="h-20 bg-white/10 border-white/10 rounded-[2rem] text-4xl font-bold text-center pl-12 focus:ring-secondary/50 focus:border-secondary text-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {parseCurrencyToNumber(valorGorjeta) >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="flex flex-col items-center gap-5 p-6 bg-white/5 rounded-[2rem] border border-white/10"
                      >
                        <div className="relative p-3 bg-white rounded-2xl shadow-2xl">
                          {generatingQr ? (
                            <div className="w-40 h-40 flex items-center justify-center">
                              <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                          ) : dynamicQrCode ? (
                            <img
                              src={dynamicQrCode}
                              alt="QR Code PIX"
                              className="w-40 h-40 object-contain"
                            />
                          ) : (
                            <div className="w-40 h-40 flex items-center justify-center text-muted-foreground text-xs text-center p-4">
                              Erro ao gerar QR Code
                            </div>
                          )}
                        </div>
                        
                        {pixCopiaCola && (
                          <div className="flex gap-2 w-full max-w-[280px]">
                            <div className="flex-1 bg-black/40 rounded-xl px-4 py-3 border border-white/5 truncate font-mono text-[10px] text-white/60">
                              {pixCopiaCola}
                            </div>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={handleCopyPixCode}
                              className="shrink-0 h-10 w-10 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-lg"
                            >
                              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                          <Clock className="w-3 h-3" /> Pagamento instantâneo via PIX
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={handleConfirmPixPayment}
                    disabled={confirmingPix || !valorGorjeta || parseCurrencyToNumber(valorGorjeta) < 1}
                    className="h-14 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-2xl shadow-lg shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {confirmingPix ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Já realizei o pagamento"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setStep('pedido')}
                    className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    Voltar para o pedido
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
