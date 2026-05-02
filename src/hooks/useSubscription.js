import { useState, useEffect } from "react";

export function useSubscription(artistaId) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    if (artistaId) {
      // Mock logic: artists with 'pro' in ID or specifically 'ypigxwetp' (our test artist) are PRO
      // In a real app, this would fetch from a 'subscriptions' table
      if (artistaId.includes('pro') || artistaId === 'ypigxwetp') {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
    }
  }, [artistaId]);

  return {
    isLoading,
    isPro,
    subscription,
    daysRemaining,
    refetch: async () => {},
  };
}
