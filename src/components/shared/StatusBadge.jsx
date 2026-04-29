import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusStyles = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  accepted: 'bg-secondary/10 text-secondary border-secondary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-secondary/10 text-secondary border-secondary/20',
  confirmed: 'bg-secondary/10 text-secondary border-secondary/20',
};

const statusLabels = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
  scheduled: 'Agendado',
  completed: 'Concluído',
  confirmed: 'Confirmado',
};

export default function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`${statusStyles[status] || statusStyles.pending} border`}>
      {statusLabels[status] || status}
    </Badge>
  );
}