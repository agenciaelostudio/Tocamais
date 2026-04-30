import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, Music, Star, DollarSign, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const GENRES = ['Sertanejo', 'MPB', 'Rock', 'Pop', 'Pagode', 'Forró', 'Jazz', 'Blues', 'Samba', 'Funk'];

export default function CastingList() {
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['castingArtists'],
    queryFn: () => base44.entities.ArtistProfile.filter({ is_active: true }),
  });

  const filtered = useMemo(() => {
    let result = [...artists];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.stage_name?.toLowerCase().includes(s) ||
          a.city?.toLowerCase().includes(s) ||
          a.genres?.some((g) => g.toLowerCase().includes(s))
      );
    }
    if (genreFilter !== 'all') {
      result = result.filter((a) => a.genres?.includes(genreFilter));
    }
    if (sortBy === 'rating') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    if (sortBy === 'price_low') result.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
    if (sortBy === 'price_high') result.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
    return result;
  }, [artists, search, genreFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artista, cidade ou estilo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card/50 border-border"
          />
        </div>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-card/50 border-border">
            <SelectValue placeholder="Gênero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Estilos</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card/30 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground">Nenhum artista encontrado no casting.</p>
          </div>
        ) : (
          filtered.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:bg-white/10 hover:border-primary/30 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
              
              <div className="w-20 h-20 rounded-2xl bg-background/60 border border-white/10 overflow-hidden shrink-0 shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.stage_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Music className="text-primary w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="font-heading font-black text-xl tracking-tight group-hover:text-primary transition-colors">{artist.stage_name}</h3>
                  <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/20">
                    <Star size={12} fill="currentColor" />
                    {artist.avg_rating?.toFixed(1) || '4.9'}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary" />
                    {artist.city}
                  </span>
                  <span className="flex items-center gap-2 text-emerald-400">
                    <DollarSign size={14} />
                    Cachê base: R$ {artist.base_price?.toLocaleString('pt-BR') || 'Sob consulta'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {artist.genres?.slice(0, 3).map((g) => (
                    <Badge key={g} variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-white/10 bg-white/5 px-3 py-1 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 w-full sm:w-auto relative z-10">
                <Link to={`/artist/${artist.id}`} className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold h-12">Perfil</Button>
                </Link>
                <Link to={`/contratar/${artist.id}`} className="flex-1 sm:flex-none">
                  <Button className="w-full rounded-xl bg-foreground text-background hover:bg-primary hover:text-white font-black h-12 px-6 shadow-xl transition-all">Contratar</Button>
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
