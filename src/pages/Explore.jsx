import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, Music, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 pb-20 pt-8">
      {/* Background Decorative Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[40%] left-[20%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12 md:space-y-20 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-8 pt-12 md:pt-20 pb-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-4 shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Discover Excellence</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-9xl font-heading font-black tracking-tighter leading-[0.85] text-foreground"
          >
            A TRILHA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient-x">PERFEITA</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Encontre artistas talentosos que transformam qualquer ambiente em uma experiência inesquecível.
          </motion.p>
        </div>

        {/* Floating Search & Filter Toolbar */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky top-6 z-50 px-2"
        >
          <div className="bg-card/40 backdrop-blur-[40px] border border-white/10 p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/50 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Busque por artista, cidade ou gênero musical..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-16 pl-16 bg-white/5 border-transparent focus-visible:ring-primary/30 rounded-[1.8rem] text-lg font-bold placeholder:text-muted-foreground/30 transition-all shadow-inner"
              />
            </div>
            
            <div className="flex w-full md:w-auto gap-4">
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="h-16 w-full md:w-56 bg-white/5 border-transparent rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all px-8">
                  <div className="flex items-center gap-3">
                    <Music className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="Gênero" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-3xl border-white/10 backdrop-blur-3xl bg-card/90">
                  <SelectItem value="all" className="font-bold">Todos os Gêneros</SelectItem>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g} className="font-medium">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-16 w-full md:w-56 bg-white/5 border-transparent rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all px-8">
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-4 h-4 text-secondary" />
                    <SelectValue placeholder="Ordenar" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-3xl border-white/10 backdrop-blur-3xl bg-card/90">
                  <SelectItem value="rating" className="font-bold">Melhor Avaliação</SelectItem>
                  <SelectItem value="price_low" className="font-bold">Menor Preço</SelectItem>
                  <SelectItem value="price_high" className="font-bold">Maior Preço</SelectItem>
                  <SelectItem value="reviews" className="font-bold">Mais Avaliações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="relative pt-10">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="rounded-[2.5rem] border border-white/5 bg-card/40 h-[450px] animate-pulse" />
                ))}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-40 rounded-[3rem] bg-white/5 border border-dashed border-white/10"
              >
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Music className="w-16 h-16 text-primary/30" />
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tighter">O PALCO ESTÁ VAZIO</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto text-lg">Não encontramos artistas com esses critérios. Experimente outros filtros.</p>
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearch(''); setGenreFilter('all'); }}
                  className="mt-8 text-primary font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary/10 h-12 px-8 rounded-xl"
                >
                  Resetar Busca
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12"
              >
                {filtered.map((a, i) => (
                  <ArtistCard key={a.id} artist={a} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}