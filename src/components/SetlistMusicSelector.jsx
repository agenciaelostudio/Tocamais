import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SetlistMusicSelector({ setlistId, setlistName, artistaId, onUpdate, asTrigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [musicas, setMusicas] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && artistaId) loadMusicas();
  }, [open, artistaId]);

  const loadMusicas = async () => {
    setLoading(true);
    try {
      const [musicasRes, setlistMusicasRes] = await Promise.all([
        supabase.from("musicas_repertorio").select("id, titulo, autor").eq("artista_id", artistaId).order("titulo"),
        supabase.from("setlist_musicas").select("musica_id").eq("setlist_id", setlistId),
      ]);
      setMusicas(musicasRes.data || []);
      setSelectedIds(new Set((setlistMusicasRes.data || []).map(d => d.musica_id)));
    } catch (err) {
      console.error("Erro ao carregar músicas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (musicaId) => {
    const isSelected = selectedIds.has(musicaId);
    const newIds = new Set(selectedIds);

    try {
      if (isSelected) {
        await supabase.from("setlist_musicas").delete().eq("setlist_id", setlistId).eq("musica_id", musicaId);
        newIds.delete(musicaId);
        toast.success("Música removida da setlist");
      } else {
        await supabase.from("setlist_musicas").insert({ setlist_id: setlistId, musica_id: musicaId, ordem: newIds.size });
        newIds.add(musicaId);
        toast.success("Música adicionada à setlist");
      }
      setSelectedIds(newIds);
      onUpdate?.();
    } catch (err) {
      console.error("Erro ao atualizar setlist:", err);
      toast.error("Erro ao atualizar");
    }
  };

  if (asTrigger) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center w-full px-2 py-1.5 text-sm outline-none">
        <Music className="h-4 w-4 mr-2" /> Gerenciar Músicas
      </button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-8 w-8" title="Gerenciar músicas">
        <Music className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              {setlistName}
            </DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>
          ) : musicas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma música cadastrada</p>
              <p className="text-sm">Cadastre músicas primeiro no repertório</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="space-y-1 p-1">
                {musicas.map((musica) => (
                  <div
                    key={musica.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleToggle(musica.id)}
                  >
                    <Checkbox checked={selectedIds.has(musica.id)} onCheckedChange={() => handleToggle(musica.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{musica.titulo}</p>
                      {musica.autor && <p className="text-xs text-muted-foreground truncate">{musica.autor}</p>}
                    </div>
                    {selectedIds.has(musica.id) && (
                      <span className="text-xs text-primary font-medium shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Na setlist
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}