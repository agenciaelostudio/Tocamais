import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Crop, ZoomIn, Check, X } from 'lucide-react';

export function ImageCropDialog({ open, onOpenChange, image, aspect = 1, onCrop }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;

    // We want the output to be high quality
    const outputWidth = aspect === 1 ? 500 : 1200;
    const outputHeight = outputWidth / aspect;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Calculate the scale between the displayed image and the original
    const rect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // The math:
    // We need to find what part of the ORIGINAL image is visible in the container
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    const sourceX = (rect.left - imgRect.left) * scaleX;
    const sourceY = (rect.top - imgRect.top) * scaleY;
    const sourceWidth = rect.width * scaleX;
    const sourceHeight = rect.height * scaleY;

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, outputWidth, outputHeight
    );

    const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
    onCrop(croppedImage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black/95 border-white/10 backdrop-blur-2xl p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-6 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <Crop className="w-5 h-5 text-primary" />
            Ajustar Imagem
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Crop Area */}
          <div className="relative flex items-center justify-center bg-white/5 rounded-2xl overflow-hidden aspect-video group">
             <div 
                ref={containerRef}
                style={{ 
                    aspectRatio: aspect,
                    width: aspect === 1 ? '300px' : '100%',
                    height: aspect === 1 ? '300px' : 'auto',
                }}
                className="relative overflow-hidden border-2 border-primary/50 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] z-10 pointer-events-none"
             >
                {/* The "visible" box is just a frame, the image is behind it but dragged */}
             </div>

             <motion.div
                drag
                dragMomentum={false}
                style={{ x: position.x, y: position.y, scale: zoom }}
                onDragEnd={(_, info) => setPosition(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))}
                className="absolute cursor-move touch-none"
             >
                <img 
                    ref={imageRef}
                    src={image} 
                    alt="To crop" 
                    className="max-w-none select-none pointer-events-auto"
                    style={{ maxHeight: 'none' }}
                />
             </motion.div>

             <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ZoomIn className="w-3 h-3" /> Zoom
                </span>
                <span className="text-[10px] font-black text-primary">{(zoom * 100).toFixed(0)}%</span>
             </div>
             <Slider 
                value={[zoom]} 
                min={0.5} 
                max={3} 
                step={0.01} 
                onValueChange={([v]) => setZoom(v)}
                className="py-4"
             />
          </div>
        </div>

        <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
          >
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
          <Button 
            onClick={handleCrop}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
          >
            <Check className="w-4 h-4 mr-2" /> Confirmar Corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
