import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music, Save, Upload, MapPin, DollarSign, Instagram, Youtube, Play, Globe, ChevronDown, Link2, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AnimatedButton from '@/components/shared/AnimatedButton';
import ArtistTour from '@/components/ArtistTour';
import { toast } from 'sonner';

const GENRES = ['Sertanejo', 'MPB', 'Rock', 'Pop', 'Pagode', 'Forró', 'Jazz', 'Blues', 'Eletrônica', 'Reggae', 'Samba', 'Funk', 'Outro'];
const PERF_TYPES = ['Solo', 'Voz e Violão', 'Dupla', 'Trio', 'Banda', 'DJ'];
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function ArtistProfileEdit({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    stage_name: '', bio: '', city: '', state: '', base_price: 0,
    genres: [], performance_types: [], available_days: [],
    social_links: { instagram: '', youtube: '', spotify: '' },
    show_formats: {},
  });
  const [expandedFormat, setExpandedFormat] = useState(null);
  const [showTour, setShowTour] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['artistProfile', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.ArtistProfile.filter({ user_email: user.email });
      return profiles[0];
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        stage_name: profile.stage_name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        state: profile.state || '',
        base_price: profile.base_price || 0,
        genres: profile.genres || [],
        performance_types: profile.performance_types || [],
        available_days: profile.available_days || [],
        social_links: profile.social_links || { instagram: '', youtube: '', spotify: '' },
        show_formats: profile.show_formats || {},
      });
      // Show tour if not completed
      if (!profile.tour_complete) {
        setShowTour(true);
      }
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.ArtistProfile.update(profile.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
      toast.success('Perfil atualizado com sucesso! ✨');
    },
  });

  const updateFormatField = (format, field, value) => {
    setForm(prev => ({
      ...prev,
      show_formats: {
        ...prev.show_formats,
        [format]: {
          ...(prev.show_formats[format] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ArtistProfile.update(profile.id, { [field]: file_url });
      queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
      toast.success('Imagem atualizada! 📸');
    } catch (err) {
      toast.error('Erro ao subir imagem');
    }
  };

  const toggleArray = (arr, val) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-[60vh] flex items-center justify-center text-center p-8">
      <div>
        <Music className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <h2 className="text-2xl font-black mb-2">Perfil não encontrado</h2>
        <p className="text-muted-foreground">Seu perfil de artista ainda não foi criado.</p>
      </div>
    </div>
  );

  return (
    <>
    {showTour && profile && (
      <ArtistTour
        profileId={profile.id}
        onComplete={() => setShowTour(false)}
      />
    )}
    <div className="contents">
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Configurações de Perfil</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Minha <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Identidade</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg font-medium leading-relaxed">
              Personalize sua presença digital para atrair os melhores contratantes.
            </p>
          </div>
          
          <AnimatedButton 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending} 
            className="h-14 px-8 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            {saveMutation.isPending ? 'SALVANDO...' : <><Save size={18} className="mr-2" /> SALVAR PERFIL</>}
          </AnimatedButton>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 pb-20">
          
          {/* Media Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="group relative rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="relative shrink-0">
                <div className="w-40 h-40 rounded-[2rem] bg-background/60 border-4 border-white/10 overflow-hidden shadow-2xl relative group/avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                      <Music className="w-12 h-12 text-white opacity-40" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-white" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Alterar Foto</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'avatar_url')} />
                  </label>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Capa do Perfil</p>
                <div className="h-40 rounded-[2rem] bg-background/60 border border-white/10 overflow-hidden relative group/cover shadow-inner">
                  {profile?.cover_url ? (
                    <img src={profile.cover_url} className="w-full h-full object-cover transition-transform duration-700 group-hover/cover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Banner de Destaque</p>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                    <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-xl border border-white/20">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-xs font-black text-white uppercase tracking-widest">Subir Banner</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'cover_url')} />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Basic Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-primary rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Informações Básicas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Artístico</Label>
                <Input value={form.stage_name} onChange={(e) => setForm({ ...form, stage_name: e.target.value })} className="h-14 rounded-2xl bg-white/5 border-white/10 text-lg font-bold focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cachê Base (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-lg font-bold focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-base font-bold focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estado (UF)</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} className="h-14 rounded-2xl bg-white/5 border-white/10 text-base font-bold text-center focus:ring-primary/20 uppercase" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sua História / Biografia</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={5} className="rounded-2xl bg-white/5 border-white/10 p-6 text-base font-medium leading-relaxed resize-none focus:ring-primary/20" placeholder="Conte um pouco sobre sua trajetória musical..." />
            </div>
          </motion.div>

          {/* Artistic Specs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl space-y-10"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-secondary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Gêneros & Estilos</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {GENRES.map((g) => (
                  <button 
                    key={g} 
                    type="button" 
                    onClick={() => setForm({ ...form, genres: toggleArray(form.genres, g) })}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 border ${
                      form.genres.includes(g) 
                        ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20 scale-105' 
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-emerald-400 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Formatos de Show</h3>
              </div>
              
              <p className="text-sm text-muted-foreground font-medium -mt-4">
                Selecione os formatos e configure <strong className="text-foreground">preço, descrição e vídeo</strong> para cada um.
              </p>

              {/* Format selector pills */}
              <div className="flex flex-wrap gap-3">
                {PERF_TYPES.map((p) => (
                  <button 
                    key={p} 
                    type="button" 
                    onClick={() => {
                      setForm({ ...form, performance_types: toggleArray(form.performance_types, p) });
                      if (!form.performance_types.includes(p)) setExpandedFormat(p);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 border ${
                      form.performance_types.includes(p) 
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105' 
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Per-format detail editors */}
              <AnimatePresence>
                {form.performance_types.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {form.performance_types.map((fmt) => {
                      const isExpanded = expandedFormat === fmt;
                      const fmtData = form.show_formats[fmt] || {};
                      return (
                        <div key={fmt} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                          {/* Format header */}
                          <button
                            type="button"
                            onClick={() => setExpandedFormat(isExpanded ? null : fmt)}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Music className="w-4 h-4 text-emerald-400" />
                              </div>
                              <span className="font-black uppercase tracking-widest text-sm">{fmt}</span>
                              {fmtData.video_url && (
                                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest bg-pink-400/10 px-2 py-0.5 rounded-lg border border-pink-400/20">🎬 Vídeo</span>
                              )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Expanded fields */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-4">
                                  {/* Price */}
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor (R$)</Label>
                                    <div className="relative">
                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                      <Input
                                        type="number"
                                        placeholder="Ex: 1200"
                                        value={fmtData.price || ''}
                                        onChange={(e) => updateFormatField(fmt, 'price', Number(e.target.value))}
                                        className="h-12 pl-10 rounded-xl bg-white/5 border-white/10"
                                      />
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição Breve</Label>
                                    <Textarea
                                      rows={2}
                                      placeholder={`Ex: Show acústico de 60 min com repertório sertanejo e pop. Inclui sonorização básica.`}
                                      value={fmtData.description || ''}
                                      onChange={(e) => updateFormatField(fmt, 'description', e.target.value)}
                                      className="rounded-xl bg-white/5 border-white/10 resize-none"
                                    />
                                  </div>

                                  {/* Video URL */}
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vídeo do Formato</Label>
                                    
                                    {/* Instructional hint */}
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-pink-500/5 border border-pink-500/15">
                                      <Video className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                                      <div className="space-y-1">
                                        <p className="text-xs font-black text-pink-400 uppercase tracking-wider">📱 Use vídeo VERTICAL (9:16)</p>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                          Cole um link do <strong className="text-pink-400">Instagram Reels</strong>, <strong className="text-white">TikTok</strong> ou <strong className="text-red-400">YouTube Shorts</strong>. Grave ao vivo para impressionar mais contratantes!
                                        </p>
                                      </div>
                                    </div>

                                    <div className="relative">
                                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        placeholder="instagram.com/reel/... ou youtube.com/shorts/..."
                                        value={fmtData.video_url || ''}
                                        onChange={(e) => updateFormatField(fmt, 'video_url', e.target.value)}
                                        className="h-12 pl-10 rounded-xl bg-white/5 border-white/10 font-mono text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-primary rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Presença Digital</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-pink-500 transition-colors" />
                <Input placeholder="Instagram (@usuario)" value={form.social_links.instagram} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, instagram: e.target.value } })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20" />
              </div>
              <div className="relative group">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
                <Input placeholder="Link Canal YouTube" value={form.social_links.youtube} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, youtube: e.target.value } })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20" />
              </div>
              <div className="relative group">
                <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                <Input placeholder="Link Playlist Spotify" value={form.social_links.spotify} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, spotify: e.target.value } })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20" />
              </div>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Site Oficial / EPK" value={form.social_links.website || ''} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, website: e.target.value } })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
    </div>
    </>
  );
}