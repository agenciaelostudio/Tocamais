import { Toaster } from '@/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
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
import Hire from '@/pages/Marketplace';
import HireProfile from '@/pages/HireProfile';
import MyReviews from '@/pages/MyReviews';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import QueuePage from '@/pages/Queue';
import Contratacao from '@/pages/Contratacao';
import OrderPage from '@/pages/OrderPage';
import ResetPassword from '@/pages/ResetPassword';

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
  const location = useLocation();

  // Define routes that can be accessed without authentication
  const publicPaths = ['/queue', '/explore', '/reset-password'];
  const privatePaths = [
    '/dashboard', '/contratar', '/proposals', '/events', '/tips', 
    '/favorites', '/artist-profile', '/venue', '/chat', 
    '/marketplace', '/contratar-show', '/my-reviews', 
    '/notifications', '/settings', '/'
  ];

  const isPublicRoute = 
    location.pathname.startsWith('/artist/') || 
    location.pathname.startsWith('/pedido/') ||
    publicPaths.includes(location.pathname) ||
    (!privatePaths.filter(p => p !== '/').some(path => location.pathname.startsWith(path)) && location.pathname !== '/');

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  // If not logged in and not a public route, redirect to onboarding/login
  if (!user && !isPublicRoute) {
    return <Onboarding authError={authError} />;
  }

  // If logged in but onboarding not complete, force onboarding
  if (user && !user.onboarding_complete && !isPublicRoute) {
    return <Onboarding user={user} onComplete={refreshUser} authError={authError} />;
  }

  const userRole = user?.role || 'fan';

  return (
    <Routes>
      <Route element={<AppLayout userRole={userRole} user={user} />}>
        {/* Public Routes accessible to everyone */}
        <Route path="/artist/:id" element={<ArtistPublicProfile user={user} />} />
        <Route path="/pedido/:artistId" element={<OrderPage user={user} />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/explore" element={<Explore user={user} />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Private Routes requiring authentication */}
        <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/explore" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/explore" />} />
        <Route path="/contratar/:artistaId" element={user ? <Contratacao user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/proposals" element={user ? <Proposals user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/events" element={user ? <Events user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/tips" element={user ? <Tips user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/favorites" element={user ? <Favorites user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/artist-profile" element={user ? <ArtistProfileEdit user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/venue" element={user ? <VenueEdit user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/chat" element={user ? <Chat user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/marketplace" element={user ? <Hire user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/contratar-show/:artistId" element={user ? <HireProfile user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/my-reviews" element={user ? <MyReviews user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/notifications" element={user ? <Notifications user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/settings" element={user ? <Settings user={user} /> : <Navigate to="/onboarding" />} />
        
        {/* Dynamic Artist Slug - Must be last to not conflict with fixed routes */}
        <Route path="/:idOrSlug" element={<ArtistPublicProfile user={user} />} />
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
