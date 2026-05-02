import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import { Download, QrCode, Share2, Music, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ArtistQRCard({ artistId, artistName, artistSlug }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const qrRef = useRef(null);
  
  const profileUrl = artistSlug 
    ? `${window.location.origin}/${artistSlug}`
    : `${window.location.origin}/artist/${artistId}`;

  useEffect(() => {
    if (artistId) {
      QRCode.toDataURL(profileUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Erro ao gerar QR Code:', err));
    }
  }, [artistId, profileUrl]);

  const handleDownload = async () => {
    if (!qrRef.current) return;
    
    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#000000',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `TocaMais_QR_${artistName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR Code pronto para impressão! 🖨️');
    } catch (err) {
      toast.error('Erro ao gerar imagem para download');
      console.error(err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${artistName} no TocaMais`,
        url: profileUrl,
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Link do perfil copiado!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Preview Card */}
        <div 
          ref={qrRef}
          className="relative w-full max-w-[320px] aspect-[3/4] rounded-[2.5rem] bg-black p-8 flex flex-col items-center justify-between overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 blur-[60px] rounded-full -ml-16 -mb-16" />
          
          <div className="relative z-10 w-full text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
               </div>
               <span className="font-heading font-black text-white text-xl tracking-tighter uppercase">TocaMais</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Peça sua música e apoie</p>
            <h3 className="text-2xl font-heading font-black text-white tracking-tight leading-none truncate w-full">
              {artistName}
            </h3>
          </div>

          <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center bg-muted animate-pulse rounded-xl" />
            )}
          </div>

          <div className="relative z-10 text-center space-y-1">
             <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Escaneie para pedir</span>
             </div>
             <p className="text-[8px] text-white/30 font-medium">{profileUrl.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Seu QR Code de Show 🎤</h3>
            <p className="text-muted-foreground leading-relaxed">
              Imprima este código e coloque nas mesas, balcões ou telões. Os clientes podem pedir músicas e enviar gorjetas diretamente pelo celular, sem precisar baixar nada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={handleDownload}
              className="h-16 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-white transition-all font-black uppercase tracking-widest text-xs"
            >
              <Download className="w-5 h-5 mr-3" /> Baixar para Impressão
            </Button>
            <Button 
              variant="outline"
              onClick={handleShare}
              className="h-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-xs"
            >
              <Share2 className="w-5 h-5 mr-3" /> Compartilhar Link
            </Button>
          </div>

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
             <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-primary" />
                <span className="text-sm font-black uppercase tracking-widest">Dica de Sucesso</span>
             </div>
             <p className="text-xs text-muted-foreground font-medium leading-relaxed">
               Artistas que colocam o QR Code visível aumentam em média <span className="text-primary font-bold">3x o volume de gorjetas</span> por show.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
