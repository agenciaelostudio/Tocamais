import React from 'react';
import BarOwnerDashboard from './BarOwnerDashboard';
import ArtistDashboard from './ArtistDashboard';
import Home from './Home';

export default function Dashboard({ user }) {
  const role = user?.role;

  // Use the new high-fidelity Home component for fans/clients
  if (role === 'bar_owner') return <BarOwnerDashboard user={user} />;
  if (role === 'artist') return <ArtistDashboard user={user} />;
  return <Home user={user} />;
}