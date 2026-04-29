import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, Save, User } from 'lucide-react';
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

        <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>Estado</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
        </div>

        <AnimatedButton onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-primary to-secondary text-white border-0">
          <Save size={16} className="mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
        </AnimatedButton>
      </motion.div>
    </div>
  );
}