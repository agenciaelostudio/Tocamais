import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music, Save, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AnimatedButton from '@/components/shared/AnimatedButton';
import { toast } from 'sonner';

const GENRES = ['Sertanejo', 'MPB', 'Rock', 'Pop', 'Pagode', 'Forró', 'Jazz', 'Blues', 'Eletrônica', 'Reggae', 'Samba', 'Funk', 'Outro'];
const PERF_TYPES = ['Voz e Violão', 'Dupla', 'Trio', 'Banda Completa', 'DJ', 'Solo'];
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function ArtistProfileEdit({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    stage_name: '', bio: '', city: '', state: '', base_price: 0,
    genres: [], performance_types: [], available_days: [],
    social_links: { instagram: '', youtube: '', spotify: '' },
  });

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
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.ArtistProfile.update(profile.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
      toast.success('Perfil salvo!');
    },
  });

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ArtistProfile.update(profile.id, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
    toast.success('Imagem atualizada!');
  };

  const toggleArray = (arr, val) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Meu Perfil 🎸</h1>
        <p className="text-muted-foreground mt-1">Edite seu perfil artístico</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Photos */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden border-2 border-border relative group">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                  <Music className="w-8 h-8 text-white" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'avatar_url')} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Foto</p>
          </div>
          <div className="text-center flex-1">
            <div className="h-20 rounded-xl bg-muted overflow-hidden border-2 border-border relative group">
              {profile?.cover_url ? (
                <img src={profile.cover_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary/30 to-secondary/30" />
              )}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'cover_url')} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Capa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome Artístico</Label>
            <Input value={form.stage_name} onChange={(e) => setForm({ ...form, stage_name: e.target.value })} />
          </div>
          <div>
            <Label>Cachê Base (R$)</Label>
            <Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>Biografia</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} />
        </div>

        <div>
          <Label className="mb-2 block">Gêneros Musicais</Label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button key={g} type="button" onClick={() => setForm({ ...form, genres: toggleArray(form.genres, g) })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  form.genres.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Tipos de Apresentação</Label>
          <div className="flex flex-wrap gap-2">
            {PERF_TYPES.map((p) => (
              <button key={p} type="button" onClick={() => setForm({ ...form, performance_types: toggleArray(form.performance_types, p) })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  form.performance_types.includes(p) ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Dias Disponíveis</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button key={d} type="button" onClick={() => setForm({ ...form, available_days: toggleArray(form.available_days, d) })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  form.available_days.includes(d) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Redes Sociais</Label>
          <div className="space-y-2">
            <Input placeholder="Instagram (@usuario)" value={form.social_links.instagram} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, instagram: e.target.value } })} />
            <Input placeholder="YouTube (URL)" value={form.social_links.youtube} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, youtube: e.target.value } })} />
            <Input placeholder="Spotify (URL)" value={form.social_links.spotify} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, spotify: e.target.value } })} />
          </div>
        </div>

        <AnimatedButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-gradient-to-r from-primary to-secondary text-white border-0">
          <Save size={16} className="mr-2" /> {saveMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
        </AnimatedButton>
      </motion.div>
    </div>
  );
}