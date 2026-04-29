import { Toaster } from '@/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import React from 'react';

import AppLayout from '@/components/layout/AppLayout';

import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Explore from '@/pages/Explore';
import ArtistPublicProfile from '@/pages/ArtistPublicProfile';
import Proposals from '@/pages/Proposals';
import Events from '@/pages/Events';
import Tips from '@/pages/Tips';
import Favorites from '@/pages/Favorites';
import ArtistProfileEdit from '@/pages/ArtistProfileEdit';
import VenueEdit from '@/pages/VenueEdit';
import Chat from '@/pages/Chat';
import Marketplace from '@/pages/Marketplace';
import MyReviews from '@/pages/MyReviews';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import QueuePage from '@/pages/Queue';
import Contratacao from '@/pages/Contratacao';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, refreshUser, authError } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Onboarding authError={authError} />;
  }

  if (!user.onboarding_complete) {
    return <Onboarding user={user} onComplete={refreshUser} authError={authError} />;
  }

  const userRole = user.role || 'fan';

  return (
    <Routes>
      <Route element={<AppLayout userRole={userRole} user={user} />}>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/explore" element={<Explore user={user} />} />
        <Route path="/artist/:id" element={<ArtistPublicProfile user={user} />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/contratar/:artistaId" element={<Contratacao user={user} />} />
        <Route path="/proposals" element={<Proposals user={user} />} />
        <Route path="/events" element={<Events user={user} />} />
        <Route path="/tips" element={<Tips user={user} />} />
        <Route path="/favorites" element={<Favorites user={user} />} />
        <Route path="/artist-profile" element={<ArtistProfileEdit user={user} />} />
        <Route path="/venue" element={<VenueEdit user={user} />} />
        <Route path="/chat" element={<Chat user={user} />} />
        <Route path="/marketplace" element={<Marketplace user={user} />} />
        <Route path="/my-reviews" element={<MyReviews user={user} />} />
        <Route path="/notifications" element={<Notifications user={user} />} />
        <Route path="/settings" element={<Settings user={user} />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
