import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Music, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/shared/StarRating';
import { Link } from 'react-router-dom';

export default function ArtistCard({ artist, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/artist/${artist.id}`} className="block">
        <div className="rounded-xl border border-border bg-card overflow-hidden group hover:border-primary/40 transition-all duration-300">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-br from-primary/30 to-secondary/30 relative overflow-hidden">
            {artist.cover_url && (
              <img src={artist.cover_url} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Avatar */}
          <div className="px-4 -mt-10 relative z-10">
            <div className="w-20 h-20 rounded-xl border-4 border-card bg-muted overflow-hidden">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.stage_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                  <Music className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 pt-2">
            <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">
              {artist.stage_name}
            </h3>

            <div className="flex items-center gap-1 mt-1">
              <StarRating rating={artist.avg_rating || 0} size={14} />
              <span className="text-xs text-muted-foreground ml-1">({artist.total_reviews || 0})</span>
            </div>

            {(artist.city || artist.state) && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin size={12} />
                <span>{[artist.city, artist.state].filter(Boolean).join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              {artist.genres?.slice(0, 3).map((g) => (
                <Badge key={g} variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  {g}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-secondary font-semibold">
                <DollarSign size={14} />
                <span className="text-sm">
                  {artist.base_price ? `R$ ${artist.base_price.toLocaleString('pt-BR')}` : 'A combinar'}
                </span>
              </div>
              {artist.performance_types?.[0] && (
                <span className="text-xs text-muted-foreground">{artist.performance_types[0]}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}