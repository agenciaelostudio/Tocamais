import React, { useState } from 'react';
import { Play, ExternalLink, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  youtube: { label: 'YouTube Shorts', color: 'text-red-400', icon: Youtube },
  instagram: { label: 'Instagram Reels', color: 'text-pink-400', icon: Instagram },
  tiktok: { label: 'TikTok', color: 'text-foreground', icon: Play },
};

export default function VerticalVideoPlayer({ url, formatName }) {
  const [loaded, setLoaded] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const info = extractVideoInfo(url);

  if (!url || !info) {
    return null;
  }

  const platform = PLATFORM_LABELS[info.type] || { label: 'Vídeo', color: 'text-primary', icon: Play };
  const PlatformIcon = platform.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PlatformIcon className={`w-4 h-4 ${platform.color}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${platform.color}`}>
          {platform.label}
        </span>
      </div>

      {!showEmbed ? (
        <button
          onClick={() => setShowEmbed(true)}
          className="w-full group relative aspect-[9/16] max-h-[420px] rounded-3xl bg-background/60 border border-white/10 overflow-hidden flex items-center justify-center transition-all hover:border-primary/30"
        >
          {/* Thumbnail placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card/40 to-secondary/20" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300 shadow-2xl shadow-primary/20">
              <Play className="w-8 h-8 text-primary fill-primary ml-1" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-foreground uppercase tracking-widest">
                Assista: {formatName}
              </p>
              <p className={`text-[10px] font-bold ${platform.color} uppercase tracking-wide`}>
                {platform.label}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="relative aspect-[9/16] max-h-[420px] rounded-3xl overflow-hidden bg-background/60 border border-white/10 shadow-2xl">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          <iframe
            src={info.embedUrl}
            className="w-full h-full rounded-3xl"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            scrolling="no"
            onLoad={() => setLoaded(true)}
            title={`${formatName} — ${platform.label}`}
          />
        </div>
      )}

      {info.externalUrl && (
        <a
          href={info.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Abrir no {platform.label}
        </a>
      )}
    </div>
  );
}
