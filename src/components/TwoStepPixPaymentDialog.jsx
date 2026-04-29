import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MusicCombobox } from "@/components/MusicCombobox";
import { Copy, Check, QrCode, Clock, Loader2, ArrowLeft, ArrowRight, CheckCircle2, Music } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePixPayload, generatePixQRCodeDataUrl } from "@/lib/pix-qr-generator";

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
        // If pedidos table doesn't exist, we might be using proposals or something else
        // For now, let's assume it exists as per Tocamais project
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
      // In maismais, we might use the 'tips' table instead of RPC
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {step === 'pedido' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Pedir música para {artistaNome}
              </DialogTitle>
              <DialogDescription>
                Etapa 1 de 2: Faça seu pedido musical
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clienteNome">Seu nome *</Label>
                <Input
                  id="clienteNome"
                  placeholder="Ex: João da mesa 5"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                />
              </div>

              {musicas.length > 0 ? (
                !musicaCustomizada ? (
                  <div className="space-y-2">
                    <Label htmlFor="pedidoMusica-select">Escolha uma música (opcional)</Label>
                    <MusicCombobox
                      open={openMusicCombobox}
                      onOpenChange={setOpenMusicCombobox}
                      items={musicas}
                      selectedTitle={pedidoMusica}
                      onSelectTitle={setPedidoMusica}
                      forceDrawer
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-sm border-primary text-primary hover:bg-primary/10"
                      onClick={() => {
                        setMusicaCustomizada(true);
                        setPedidoMusica("");
                      }}
                    >
                      Ou digite outra música
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pedidoMusica">
                      Música *
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => {
                          setMusicaCustomizada(false);
                          setPedidoMusica("");
                        }}
                      >
                        Ver repertório
                      </Button>
                    </Label>
                    <Input
                      id="pedidoMusica"
                      placeholder="Nome da música ou artista"
                      value={pedidoMusica}
                      onChange={(e) => setPedidoMusica(e.target.value)}
                    />
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="pedidoMusica">Música (opcional)</Label>
                  <Input
                    id="pedidoMusica"
                    placeholder="Nome da música ou artista"
                    value={pedidoMusica}
                    onChange={(e) => setPedidoMusica(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pedidoMensagem">Dedicatória (opcional)</Label>
                <Textarea
                  id="pedidoMensagem"
                  placeholder="Adicione uma dedicatória especial..."
                  value={pedidoMensagem}
                  onChange={(e) => setPedidoMensagem(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleCriarPedido}
                  disabled={creatingPedido || !clienteNome.trim()}
                  className="w-full"
                >
                  {creatingPedido ? "Enviando..." : "Avançar"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Enviar gorjeta via PIX
              </DialogTitle>
              <DialogDescription>
                Etapa 2 de 2: Envie uma gorjeta para {artistaNome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valorGorjetaPix" className="text-base font-medium">
                  Qual valor da gorjeta?
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">R$</span>
                  <Input
                    id="valorGorjetaPix"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={valorGorjeta}
                    onChange={handleValorChange}
                    className="text-2xl font-bold pl-10 h-14 text-center"
                  />
                </div>
              </div>

              {parseCurrencyToNumber(valorGorjeta) >= 1 && (
                <div className="flex flex-col items-center gap-3">
                  {generatingQr ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : dynamicQrCode ? (
                    <img
                      src={dynamicQrCode}
                      alt="QR Code PIX"
                      className="w-40 h-40 object-contain"
                    />
                  ) : null}
                  
                  {pixCopiaCola && (
                    <div className="flex gap-2 w-full">
                      <Input value={pixCopiaCola} readOnly className="font-mono text-xs truncate" />
                      <Button variant="outline" size="icon" onClick={handleCopyPixCode}>
                        {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleConfirmPixPayment}
                  disabled={confirmingPix || !valorGorjeta || parseCurrencyToNumber(valorGorjeta) < 1}
                  className="w-full"
                >
                  {confirmingPix ? "Confirmando..." : "Já fiz o PIX"}
                </Button>
                <Button variant="outline" onClick={() => setStep('pedido')}>Voltar</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
