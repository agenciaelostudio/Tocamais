import React, { useState } from 'react';
import { Play, ExternalLink, Instagram, Youtube, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function extractVideoInfo(url) {
  if (!url) return null;

  // YouTube Shorts
  const ytShorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShorts) return { type: 'youtube', id: ytShorts[1], embedUrl: `https://www.youtube.com/embed/${ytShorts[1]}?autoplay=0&mute=0&loop=1&playlist=${ytShorts[1]}&rel=0` };

  // YouTube normal
  const ytNormal = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytNormal) return { type: 'youtube', id: ytNormal[1], embedUrl: `https://www.youtube.com/embed/${ytNormal[1]}?autoplay=0&rel=0` };

  // Instagram Reels
  const igReel = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
  if (igReel) return { type: 'instagram', id: igReel[1], embedUrl: `https://www.instagram.com/reel/${igReel[1]}/embed/`, externalUrl: url };

  // Instagram post
  const igPost = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
  if (igPost) return { type: 'instagram', id: igPost[1], embedUrl: `https://www.instagram.com/p/${igPost[1]}/embed/`, externalUrl: url };

  // TikTok
  const tiktok = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tiktok) return { type: 'tiktok', id: tiktok[1], embedUrl: `https://www.tiktok.com/embed/v2/${tiktok[1]}`, externalUrl: url };

  return null;
}

const PLATFORM_LABELS = {
  youtube: { label: 'YouTube Shorts', color: 'text-red-400', icon: Youtube, bg: 'bg-red-400/10' },
  instagram: { label: 'Instagram Reels', color: 'text-pink-400', icon: Instagram, bg: 'bg-pink-400/10' },
  tiktok: { label: 'TikTok', color: 'text-foreground', icon: Play, bg: 'bg-white/10' },
};

export default function VerticalVideoPlayer({ url, formatName }) {
  const [loaded, setLoaded] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const info = extractVideoInfo(url);

  if (!url || !info) {
    return null;
  }

  const platform = PLATFORM_LABELS[info.type] || { label: 'Vídeo', color: 'text-primary', icon: Play, bg: 'bg-primary/10' };
  const PlatformIcon = platform.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${platform.bg} border border-white/5`}>
            <PlatformIcon className={`w-3.5 h-3.5 ${platform.color}`} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${platform.color}`}>
            {platform.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
           <Sparkles className="w-3 h-3 text-yellow-400" />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Demonstração ao Vivo</span>
        </div>
      </div>

      <div className="relative group/player">
        {!showEmbed ? (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEmbed(true)}
            className="w-full group relative aspect-[9/16] max-h-[500px] rounded-[2.5rem] bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center transition-all hover:border-primary/40 shadow-2xl"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card/60 to-secondary/20 transition-transform duration-1000 group-hover:scale-110" />
            
            {/* Glass Overlay */}
            <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]">
                  <Play className="w-10 h-10 text-white fill-white ml-1.5" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-white uppercase tracking-[0.3em] drop-shadow-lg">
                  VER SHOW: {formatName}
                </p>
                <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-[1px] bg-white/20" />
                   <p className={`text-[10px] font-black ${platform.color} uppercase tracking-widest`}>
                     {platform.label}
                   </p>
                   <div className="w-4 h-[1px] bg-white/20" />
                </div>
              </div>
            </div>

            {/* Corner Decorative Element */}
            <div className="absolute bottom-6 right-6 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
               <ExternalLink className="w-4 h-4 text-white" />
            </div>
          </motion.button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[9/16] max-h-[500px] rounded-[2.5rem] overflow-hidden bg-black/60 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
          >
            <AnimatePresence>
              {!loaded && (
                <motion.div 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 z-10 backdrop-blur-xl"
                >
                  <div className="relative">
                     <Loader2 className="w-12 h-12 text-primary animate-spin" />
                     <Music className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                    Sintonizando...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <iframe
              src={info.embedUrl}
              className="w-full h-full rounded-[2.5rem]"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              scrolling="no"
              onLoad={() => setLoaded(true)}
              title={`${formatName} — ${platform.label}`}
            />
          </motion.div>
        )}
      </div>

      {info.externalUrl && (
        <a
          href={info.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-all group w-fit mx-auto sm:mx-0"
        >
          <ExternalLink className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          Assistir no {platform.label}
        </a>
      )}
    </div>
  );
}
