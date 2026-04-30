import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useFavorite(targetId, targetType) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user?.email || !targetId) return;
    const check = async () => {
      try {
        const favorites = await base44.entities.Favorite.filter({ 
          fan_email: user.email, 
          artist_profile_id: targetId 
        });
        setIsFavorited(favorites.length > 0);
      } catch (e) {
        console.error("Erro ao checar favorito:", e);
      }
    };
    check();
  }, [user?.email, targetId]);

  const toggle = async () => {
    if (!user?.email || !targetId || loading) return false;
    setLoading(true);
    try {
      if (isFavorited) {
        // Find the record to delete
        const favorites = await base44.entities.Favorite.filter({ 
          fan_email: user.email, 
          artist_profile_id: targetId 
        });
        if (favorites[0]) {
          await base44.entities.Favorite.delete(favorites[0].id);
        }
        setIsFavorited(false);
      } else {
        await base44.entities.Favorite.create({ 
          fan_email: user.email, 
          artist_profile_id: targetId 
        });
        setIsFavorited(true);
      }
      return true;
    } catch (e) {
      console.error("Erro ao toggle favorito:", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { isFavorited, toggle, loading, isLoggedIn: !!user };
}
