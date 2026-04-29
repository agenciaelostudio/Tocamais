import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Music, Star, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ArtistCard from '@/components/cards/ArtistCard';

export default function Marketplace({ user }) {
  const { data: profile } = useQuery({
    queryKey: ['artistProfile', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.ArtistProfile.filter({ user_email: user.email });
      return profiles[0];
    },
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Marketplace 🛒</h1>
        <p className="text-muted-foreground mt-1">Ofereça serviços extras e aumente seus ganhos</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-8 text-center"
      >
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-heading font-bold mb-2">Em Breve!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          O marketplace de serviços extras está sendo desenvolvido. Em breve você poderá oferecer shows especiais, eventos privados e muito mais.
        </p>
      </motion.div>

      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Seu Perfil Público</h2>
          <p className="text-sm text-muted-foreground mb-2">É assim que os donos de bar e fãs veem você:</p>
          <div className="max-w-sm">
            <ArtistCard artist={profile} />
          </div>
        </motion.div>
      )}
    </div>
  );
}