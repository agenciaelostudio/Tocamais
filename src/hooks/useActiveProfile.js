import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "tocamais_active_tipo";

export function useActiveProfile(userId) {
  const [baseTipo, setBaseTipo] = useState("cliente");
  const [activeType, setActiveType] = useState("cliente");
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [flagRes, profileRes, activeRes] = await Promise.all([
          supabase
            .from("admin_settings")
            .select("setting_value")
            .eq("setting_key", "multi_profile_enabled")
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("tipo")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("user_active_role")
            .select("active_tipo")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        const isEnabled = flagRes.data?.setting_value === "true";
        setEnabled(isEnabled);

        const base = profileRes.data?.tipo || "cliente";
        setBaseTipo(base);

        if (isEnabled && activeRes.data?.active_tipo) {
          const active = activeRes.data.active_tipo;
          setActiveType(active);
          localStorage.setItem(CACHE_KEY, active);
        } else {
          const cached = localStorage.getItem(CACHE_KEY);
          if (isEnabled && cached && canSwitchToType(base, cached)) {
            setActiveType(cached);
          } else {
            setActiveType(base);
            localStorage.setItem(CACHE_KEY, base);
          }
        }
      } catch (err) {
        console.error("[useActiveProfile] Error loading:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const canSwitchTo = useCallback(
    (tipo) => {
      if (!enabled) return false;
      return canSwitchToType(baseTipo, tipo);
    },
    [baseTipo, enabled]
  );

  const switchTo = useCallback(
    async (tipo) => {
      if (!userId || !enabled) return;
      if (!canSwitchToType(baseTipo, tipo)) return;

      setActiveType(tipo);
      localStorage.setItem(CACHE_KEY, tipo);

      const { error } = await supabase
        .from("user_active_role")
        .upsert(
          { user_id: userId, active_tipo: tipo, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("[useActiveProfile] Error saving:", error);
      }
    },
    [userId, baseTipo, enabled]
  );

  return { activeType, baseTipo, canSwitchTo, switchTo, loading, enabled };
}

function canSwitchToType(baseTipo, targetTipo) {
  if (baseTipo === targetTipo) return true;
  if (targetTipo === "cliente") return true;
  return false;
}
