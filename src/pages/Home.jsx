import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, LogOut, Settings, Eye, ArrowLeft, Music, Radio, Trophy, 
  Heart, QrCode, Sparkles, ChevronRight, Star, Zap, Target 
} from "lucide-react";
import logoTocaMais from "@/assets/logo-tocamais.png";
import { toast } from "sonner";
import NotificationBell from "@/components/shared/NotificationBell";
import { ProfileSwitcher } from "@/components/shared/ProfileSwitcher";
import { useActiveProfile } from "@/hooks/useActiveProfile";

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [artists, setArtists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const activeProfile = useActiveProfile(user?.id);
  

  
  const isPreviewMode = searchParams.get('preview') === 'true';

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchFavorites = async () => {
      const { data: favs } = await supabase
        .from("user_favorites")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "artista");
      if (!favs || favs.length === 0) return;
      const ids = favs.map((f) => f.target_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      setFavoriteArtists(profiles || []);
    };
    fetchFavorites();
  }, [user?.id]);



  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tipo", "artista")
        .order("nome");
      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      toast.error("Erro ao carregar artistas");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/landing");
  };

  const filteredArtists = artists.filter(
    (artist) =>
      artist.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.estilo_musical?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredArtists = filteredArtists.slice(0, 3); // Placeholder for featured
  const liveArtists = filteredArtists.filter((a) => a.ativo_ao_vivo);
  const regularArtists = filteredArtists;


  return (
    <div className="min-h-screen bg-background">
      {showOnboarding && (
        <OnboardingWizard userType={activeProfile.activeType} userName={user?.full_name} onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0e12]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoTocaMais} alt="Toca Mais" className="h-14 w-auto object-contain" />
            <ProfileSwitcher
              activeType={activeProfile.activeType}
              baseTipo={activeProfile.baseTipo}
              canSwitchTo={activeProfile.canSwitchTo}
              onSwitch={async (tipo) => {
                await activeProfile.switchTo(tipo);
                // The Dashboard switcher in Dashboard.jsx will handle the view change
              }}
              compact
            />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell userId={user?.id} />
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="h-9 w-9">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-24 pt-6">

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3 mb-8">
          <GlassCard className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/explore")}>
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-sm uppercase italic">Escanear</p>
            </div>
          </GlassCard>
          <GlassCard className="cursor-pointer hover:border-secondary/30 transition-all" onClick={() => navigate("/explore")}>
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <Radio className="w-6 h-6 text-secondary" />
              </div>
              <p className="font-bold text-sm uppercase italic">Ao Vivo</p>
            </div>
          </GlassCard>
        </section>

        {/* Search */}
        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar artistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl focus-visible:ring-primary/20 text-lg font-bold"
            />
          </div>
        </div>

        {/* Featured */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black uppercase italic tracking-tight">Em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArtists.map((artist) => (
              <GlassCard key={artist.id} className="cursor-pointer hover:border-primary/20 transition-all" onClick={() => navigate(`/artist/${artist.id}`)}>
                <div className="p-4 flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarImage src={artist.foto_url} />
                    <AvatarFallback>{artist.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase italic truncate">{artist.nome}</p>
                    <p className="text-xs text-muted-foreground">{artist.estilo_musical}</p>
                    {artist.ativo_ao_vivo && (
                      <Badge className="mt-2 bg-live-indicator text-white text-[10px] animate-pulse">AO VIVO</Badge>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Regular list */}
        <section>
          <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">Descobrir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularArtists.map((artist) => (
              <GlassCard key={artist.id} className="cursor-pointer" onClick={() => navigate(`/artist/${artist.id}`)}>
                <div className="p-4 flex items-center gap-4">
                   <Avatar className="w-12 h-12">
                    <AvatarImage src={artist.foto_url} />
                    <AvatarFallback>{artist.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{artist.nome}</p>
                    <p className="text-xs text-muted-foreground">{artist.estilo_musical}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
