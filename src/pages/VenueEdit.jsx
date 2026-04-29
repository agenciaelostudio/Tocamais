import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Store, Save, Upload } from 'lucide-react';
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
      toast.success('Bar atualizado!');
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Venue.update(venue.id, { photo_url: file_url });
    queryClient.invalidateQueries({ queryKey: ['venue'] });
    toast.success('Foto atualizada!');
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Meu Bar 🍺</h1>
        <p className="text-muted-foreground mt-1">Edite as informações do seu estabelecimento</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6 space-y-4">
        {/* Photo */}
        <div className="h-40 rounded-xl bg-muted overflow-hidden border-2 border-border relative group">
          {venue?.photo_url ? (
            <img src={venue.photo_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <Store className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
          <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Nome do Bar</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>Estado</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><Label>Capacidade</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
        </div>
        <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>

        <AnimatedButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-gradient-to-r from-primary to-secondary text-white border-0">
          <Save size={16} className="mr-2" /> {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </AnimatedButton>
      </motion.div>
    </div>
  );
}