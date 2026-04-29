import React from 'react';
import { Music } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-secondary blur-lg opacity-40" />
      </div>
      <span className={`font-heading font-bold ${sizes[size]} bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
        TocaMais
      </span>
    </div>
  );
}