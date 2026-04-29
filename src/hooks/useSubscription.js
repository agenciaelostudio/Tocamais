import { useState, useEffect } from "react";

export function useSubscription(artistaId) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  return {
    isLoading,
    isPro,
    subscription,
    daysRemaining,
    refetch: async () => {},
  };
}
