import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { BottomNav } from './BottomNav';
import ParticleBackground from '@/components/shared/ParticleBackground';

export default function AppLayout({ userRole, user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Header user={user} onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar 
        userRole={userRole} 
        user={user} 
        mobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
      />
      <main className="min-h-screen relative z-10 pb-32 pt-16 lg:pl-72">
        <div className="p-4 md:p-6 lg:p-8 pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav 
        userRole={userRole} 
        onMenuClick={() => setMobileMenuOpen(true)} 
      />
    </div>
  );
}
