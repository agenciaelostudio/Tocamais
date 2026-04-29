import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFavorite(targetId, targetType) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });
  }, []);

  useEffect(() => {
    if (!userEmail || !targetId) return;
    const check = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("fan_email", userEmail)
        .eq("artist_profile_id", targetId)
        .maybeSingle();
      setIsFavorited(!!data);
    };
    check();
  }, [userEmail, targetId]);

  const toggle = async () => {
    if (!userEmail || !targetId || loading) return false;
    setLoading(true);
    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("fan_email", userEmail)
          .eq("artist_profile_id", targetId);
        setIsFavorited(false);
      } else {
        await supabase
          .from("favorites")
          .insert({ fan_email: userEmail, artist_profile_id: targetId });
        setIsFavorited(true);
      }
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { isFavorited, toggle, loading, isLoggedIn: !!userEmail };
}
