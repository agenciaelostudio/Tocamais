import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Store, Save, Upload, MapPin, Phone, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AnimatedButton from '@/components/shared/AnimatedButton';
import { toast } from 'sonner';

export default function VenueEdit({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', address: '', city: '', state: '', capacity: '', phone: '' });

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', user.email],
    queryFn: async () => {
      const venues = await base44.entities.Venue.filter({ owner_email: user.email });
      return venues[0];
    },
  });

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name || '',
        description: venue.description || '',
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        capacity: venue.capacity || '',
        phone: venue.phone || '',
      });
    }
  }, [venue]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Venue.update(venue.id, { ...form, capacity: Number(form.capacity) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue'] });
      toast.success('Bar atualizado! ✨');
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Venue.update(venue.id, { photo_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['venue'] });
      toast.success('Foto atualizada! 📸');
    } catch (err) {
      toast.error('Erro ao subir imagem');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Gestão de Espaço</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Meu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Estabelecimento</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg font-medium leading-relaxed">
              Mantenha os dados do seu bar atualizados para atrair os melhores talentos.
            </p>
          </div>
          
          <AnimatedButton 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending} 
            className="h-14 px-8 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            {saveMutation.isPending ? 'SALVANDO...' : <><Save size={18} className="mr-2" /> SALVAR DADOS</>}
          </AnimatedButton>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 pb-20">
          
          {/* Photo Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="group relative rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Imagem do Estabelecimento</p>
            <div className="h-64 rounded-[2rem] bg-background/60 border border-white/10 overflow-hidden relative group/cover shadow-2xl">
              {venue?.photo_url ? (
                <img src={venue.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover/cover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col items-center justify-center">
                  <Store className="w-16 h-16 text-primary opacity-20 mb-4" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sem foto cadastrada</p>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                <div className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/20">
                  <Upload className="w-6 h-6 text-white" />
                  <span className="text-sm font-black text-white uppercase tracking-widest">Alterar Imagem</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          </motion.div>

          {/* Form Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl space-y-10"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-primary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Informações do Bar</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Estabelecimento</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-14 rounded-2xl bg-white/5 border-white/10 text-lg font-bold focus:ring-primary/20 px-6" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone de Contato</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-base font-bold focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-14 rounded-2xl bg-white/5 border-white/10 text-base font-bold focus:ring-primary/20 px-6" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estado (UF)</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} className="h-14 rounded-2xl bg-white/5 border-white/10 text-base font-bold text-center focus:ring-primary/20 uppercase" />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço Completo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-base font-medium focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capacidade de Público</Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                    <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-lg font-bold focus:ring-primary/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-secondary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Descrição & Detalhes</h3>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sobre o Espaço</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className="rounded-2xl bg-white/5 border-white/10 p-6 text-base font-medium leading-relaxed resize-none focus:ring-primary/20" placeholder="Conte sobre o ambiente, som, palco..." />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>

  );
}