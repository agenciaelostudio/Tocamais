import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Save, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedButton from '@/components/shared/AnimatedButton';
import { toast } from 'sonner';

export default function Settings({ user }) {
  const [form, setForm] = useState({ phone: '', city: '', state: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    toast.success('Configurações salvas!');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Configurações ⚙️</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {user?.role === 'artist' ? (
          <div className="space-y-6">
             <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex flex-col items-center text-center gap-4 group hover:bg-primary/10 transition-all duration-500">
                <div className="w-16 h-16 rounded-[1.25rem] bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <User className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                   <p className="font-heading font-black text-xl">Perfil Artístico Ativo</p>
                   <p className="text-sm text-muted-foreground font-medium leading-relaxed">Sua localização detalhada e biografia são gerenciadas diretamente no seu perfil público para atrair contratantes.</p>
                </div>
                <AnimatedButton 
                  onClick={() => window.location.href = '/artist-profile'} 
                  className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20"
                >
                  EDITAR MEU PALCO
                </AnimatedButton>
             </div>
             
             <div className="pt-4 border-t border-border/50">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp de Contato</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className="h-14 rounded-2xl bg-white/5 border-white/10" />
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-14 rounded-2xl bg-white/5 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-14 rounded-2xl bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estado</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-14 rounded-2xl bg-white/5 border-white/10" />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          <AnimatedButton onClick={handleSave} disabled={saving} className="w-full h-16 rounded-[1.5rem] bg-foreground text-background hover:bg-foreground/90 font-black text-lg transition-all active:scale-95 shadow-2xl">
            {saving ? 'SINCRONIZANDO...' : <><Save size={20} className="mr-3" /> SALVAR CONFIGURAÇÕES</>}
          </AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
}