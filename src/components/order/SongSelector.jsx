import { useState, useEffect } from "react";
import { Search, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/api/supabaseClient";

export function SongSelector({ artistaId, onSelect, selectedSongId }) {
  const [musicas, setMusicas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artistaId) {
      loadMusicas();
    }
  }, [artistaId]);

  const loadMusicas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("musicas_repertorio")
      .select("*")
      .eq("artista_id", artistaId)
      .order("titulo", { ascending: true });

    if (!error) {
      setMusicas(data || []);
    }
    setLoading(false);
  };

  const filteredMusicas = musicas.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.titulo.toLowerCase().includes(term) ||
      (m.autor && m.autor.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar música ou artista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
        />
      </div>

      <ScrollArea className="h-[300px] rounded-xl border border-white/10 bg-black/20">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse">
              Carregando repertório...
            </div>
          ) : filteredMusicas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma música encontrada.
            </div>
          ) : (
            filteredMusicas.map((musica) => (
              <button
                key={musica.id}
                onClick={() => onSelect(musica)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${
                  selectedSongId === musica.id
                    ? "bg-primary border-2 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] ring-1 ring-primary/20 scale-[1.02]"
                    : "hover:bg-white/10 border-2 border-transparent bg-white/5"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedSongId === musica.id ? "bg-white text-primary shadow-lg" : "bg-white/10 text-muted-foreground group-hover:bg-white/20 transition-colors"}`}>
                  <Music className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base truncate ${selectedSongId === musica.id ? "text-white" : "text-white/90"}`}>
                    {musica.titulo}
                  </p>
                  <p className={`text-xs truncate ${selectedSongId === musica.id ? "text-white/70" : "text-muted-foreground"}`}>
                    {musica.autor || "Autor desconhecido"}
                  </p>
                </div>
                {selectedSongId === musica.id && (
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest opacity-50">
        {filteredMusicas.length} músicas disponíveis no setlist
      </p>
    </div>
  );
}
