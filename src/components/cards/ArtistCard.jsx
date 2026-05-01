import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Music, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/shared/StarRating';
import { Link } from 'react-router-dom';

export default function ArtistCard({ artist, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <Link to={`/artist/${artist.id}`} className="block">
        <div className="rounded-[2rem] border border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/40 hover:shadow-primary/10 relative">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          {/* Cover */}
          <div className="h-36 bg-gradient-to-br from-primary/30 to-secondary/30 relative overflow-hidden">
            {artist.cover_url ? (
              <img src={artist.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            
            {/* Status Badge if active */}
            {artist.is_active && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md shadow-lg z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Ao Vivo</span>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="px-6 -mt-12 relative z-20">
            <div className="w-24 h-24 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:border-primary/30 transition-colors">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.stage_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                  <Music className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-6 pt-3">
            <h3 className="font-heading font-black text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              {artist.stage_name}
            </h3>

            <div className="flex items-center gap-1.5 mt-1.5">
              <StarRating rating={artist.avg_rating || 0} size={16} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">({artist.total_reviews || 0})</span>
            </div>

            {(artist.city || artist.state) && (
              <div className="flex items-center gap-2 mt-4 text-sm font-semibold text-muted-foreground">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                  <MapPin size={12} className="text-primary" />
                </div>
                <span>{[artist.city, artist.state].filter(Boolean).join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-5">
              {artist.genres?.slice(0, 3).map((g) => (
                <Badge key={g} variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white/5 text-primary border-primary/20 rounded-lg px-2.5 py-1">
                  {g}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Cachê Base</span>
                <div className="flex items-center gap-1 text-emerald-400 font-black text-base tracking-tight">
                  <span className="text-sm font-bold opacity-80">R$</span>
                  <span>
                    {artist.base_price ? artist.base_price.toLocaleString('pt-BR') : 'A combinar'}
                  </span>
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-inner"
              >
                <ChevronRight size={18} />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}