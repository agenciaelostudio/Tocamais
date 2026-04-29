import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ArtistCard from '@/components/cards/ArtistCard';

const GENRES = ['Sertanejo', 'MPB', 'Rock', 'Pop', 'Pagode', 'Forró', 'Jazz', 'Blues', 'Eletrônica', 'Reggae', 'Samba', 'Funk', 'Outro'];

export default function Explore() {
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists'],
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
    if (sortBy === 'reviews') result.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
    return result;
  }, [artists, search, genreFilter, sortBy]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Explorar Artistas</h1>
        <p className="text-muted-foreground mt-1">Encontre o artista perfeito para o seu evento</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade ou gênero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-card border-border">
            <SelectValue placeholder="Gênero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Gêneros</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48 bg-card border-border">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Melhor Avaliação</SelectItem>
            <SelectItem value="price_low">Menor Preço</SelectItem>
            <SelectItem value="price_high">Maior Preço</SelectItem>
            <SelectItem value="reviews">Mais Avaliações</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card h-72 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum artista encontrado</p>
          <p className="text-sm mt-1">Tente ajustar seus filtros de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <ArtistCard key={a.id} artist={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}