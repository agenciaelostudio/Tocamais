import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';
import StarRating from '@/components/shared/StarRating';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyReviews({ user }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['myReviews', user.email],
    queryFn: () => base44.entities.Review.filter({ fan_email: user.email }, '-created_date'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Minhas Avaliações ⭐</h1>
        <p className="text-muted-foreground mt-1">Suas avaliações de artistas</p>
      </motion.div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhuma avaliação</p>
          <p className="text-sm mt-1">Avalie os artistas após assistir um show</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <StarRating rating={r.rating} size={16} />
                <span className="text-xs text-muted-foreground">
                  {r.created_date && format(new Date(r.created_date), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}