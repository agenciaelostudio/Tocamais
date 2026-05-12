import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { BottomNav } from './BottomNav';
import ParticleBackground from '@/components/shared/ParticleBackground';
import { cn } from '@/lib/utils';

export default function AppLayout({ userRole, user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isGuest = !user;

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Header user={user} onMenuClick={() => setMobileMenuOpen(true)} />
      
      {!isGuest && (
        <Sidebar 
          userRole={userRole} 
          user={user} 
          mobileOpen={mobileMenuOpen} 
          setMobileOpen={setMobileMenuOpen} 
        />
      )}

      <main className={cn(
        "min-h-screen relative z-10 pb-32 pt-16 transition-all duration-500",
        !isGuest ? "lg:pl-72" : "lg:pl-0"
      )}>
        <div className="p-4 md:p-6 lg:p-8 pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {!isGuest && (
        <BottomNav 
          userRole={userRole} 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />
      )}
      
    </div>
  );
}
