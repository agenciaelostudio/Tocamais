import React from 'react';
import logoImg from '@/assets/logo-tocamais.png';

export default function Logo({ size = 'md' }) {
  const containerSizes = {
    sm: 'h-8 md:h-10',
    md: 'h-12 md:h-14',
    lg: 'h-16 md:h-20',
    xl: 'h-24 md:h-32',
    '2xl': 'h-32 md:h-48',
    '3xl': 'h-40 md:h-64',
    '4xl': 'h-48 md:h-80 lg:h-96',
    '5xl': 'h-56 md:h-96 lg:h-[29rem]',
  };

  return (
    <div className="flex items-center group">
      <div className={`relative ${containerSizes[size] || containerSizes.md} aspect-square`}>
        <img 
          src={logoImg} 
          alt="TocaMais Logo" 
          className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
}