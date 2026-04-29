import React from 'react';
import BarOwnerDashboard from './BarOwnerDashboard';
import ArtistDashboard from './ArtistDashboard';
import FanDashboard from './FanDashboard';

export default function Dashboard({ user }) {
  const role = user?.role;

  if (role === 'bar_owner') return <BarOwnerDashboard user={user} />;
  if (role === 'artist') return <ArtistDashboard user={user} />;
  return <FanDashboard user={user} />;
}