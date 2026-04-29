import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, X, ListMusic, Music, Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ManageSetlistsDialog({ open, onOpenChange, artistId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [musicas, setMusicas] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [setlistMusicasIds, setSetlistMusicasIds] = useState(new Set());
  const [newSetlist, setNewSetlist] = useState({ nome: "", descricao: "" });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (open && artistId) {
      loadData();
    }
  }, [open, artistId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [musicasRes, setlistsRes] = await Promise.all([
        supabase.from("musicas_repertorio").select("*").eq("artista_id", artistId).order("titulo"),
        supabase.from("setlists").select("*").eq("artista_id", artistId).order("nome"),
      ]);
      setMusicas(musicasRes.data || []);
      setSetlists(setlistsRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSetlistMusicas = async (setlistId) => {
    const { data } = await supabase
      .from("setlist_musicas")
      .select("musica_id")
      .eq("setlist_id", setlistId);
    
    setSetlistMusicasIds(new Set((data || []).map(d => d.musica_id)));
  };

  const handleSelectSetlist = (setlist) => {
    setSelectedSetlist(setlist);
    loadSetlistMusicas(setlist.id);
  };

  const handleCreateSetlist = async (e) => {
    e.preventDefault();
    if (!newSetlist.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("setlists").insert({
        artista_id: artistId,
        nome: newSetlist.nome.trim(),
        descricao: newSetlist.descricao.trim() || null,
      }).select().single();

      if (error) throw error;
      
      setSetlists([...setlists, data]);
      setNewSetlist({ nome: "", descricao: "" });
      setShowNewForm(false);
      setSelectedSetlist(data);
      setSetlistMusicasIds(new Set());
      toast.success("Setlist criada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar setlist:", err);
      toast.error("Erro ao criar setlist");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetlist = async (setlist) => {
    if (!confirm(`Excluir setlist "${setlist.nome}"?`)) return;
    
    try {
      const { error } = await supabase.from("setlists").delete().eq("id", setlist.id);
      if (error) throw error;
      
      setSetlists(setlists.filter(s => s.id !== setlist.id));
      if (selectedSetlist?.id === setlist.id) {
        setSelectedSetlist(null);
        setSetlistMusicasIds(new Set());
      }
      toast.success("Setlist excluída");
    } catch (err) {
      console.error("Erro ao excluir:", err);
      toast.error("Erro ao excluir setlist");
    }
  };

  const handleToggleMusica = async (musica) => {
    if (!selectedSetlist) return;
    
    const isSelected = setlistMusicasIds.has(musica.id);
    const newIds = new Set(setlistMusicasIds);

    try {
      if (isSelected) {
        await supabase.from("setlist_musicas")
          .delete()
          .eq("setlist_id", selectedSetlist.id)
          .eq("musica_id", musica.id);
        newIds.delete(musica.id);
        toast.success("Música removida");
      } else {
        await supabase.from("setlist_musicas").insert({
          setlist_id: selectedSetlist.id,
          musica_id: musica.id,
          ordem: newIds.size,
        });
        newIds.add(musica.id);
        toast.success("Música adicionada");
      }
      setSetlistMusicasIds(newIds);
    } catch (err) {
      console.error("Erro ao atualizar música:", err);
      toast.error("Erro ao atualizar");
    }
  };

  const getMusicasCount = (setlistId) => {
    return setlists.find(s => s.id === setlistId)?._musicas_count || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            {selectedSetlist ? selectedSetlist.nome : "Gerenciar Setlists"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {selectedSetlist ? (
              <div className="flex-1 overflow-auto space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedSetlist(null); setSetlistMusicasIds(new Set()); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                  <Button variant="ghost" size="icon" className="ml-auto" onClick={() => handleDeleteSetlist(selectedSetlist)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {selectedSetlist.descricao && (
                  <p className="text-sm text-muted-foreground">{selectedSetlist.descricao}</p>
                )}

                {musicas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Nenhuma música cadastrada</p>
                    <p className="text-sm">Cadastre músicas primeiro no botão "Registrar Músicas"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Selecione as músicas para esta setlist:
                    </Label>
                    <div className="border rounded-lg divide-y">
                      {musicas.map((musica) => (
                        <div
                          key={musica.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleToggleMusica(musica)}
                        >
                          <Checkbox
                            checked={setlistMusicasIds.has(musica.id)}
                            onCheckedChange={() => handleToggleMusica(musica)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{musica.titulo}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {musica.autor && <span>{musica.autor}</span>}
                              {musica.genero && <span>• {musica.genero}</span>}
                            </div>
                          </div>
                          {setlistMusicasIds.has(musica.id) && (
                            <span className="text-xs text-primary font-medium">Na setlist</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-4">
                {!showNewForm ? (
                  <Button onClick={() => setShowNewForm(true)} className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Setlist
                  </Button>
                ) : (
                  <form onSubmit={handleCreateSetlist} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Nome da Setlist *</Label>
                      <Input
                        placeholder="Ex: Show Sexta-feira"
                        value={newSetlist.nome}
                        onChange={(e) => setNewSetlist({ ...newSetlist, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descrição opcional..."
                        value={newSetlist.descricao}
                        onChange={(e) => setNewSetlist({ ...newSetlist, descricao: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving} size="sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Criar
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowNewForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}

                {setlists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListMusic className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Nenhuma setlist criada</p>
                    <p className="text-sm">Crie uma setlist para organizar suas músicas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {setlists.map((setlist) => (
                      <div
                        key={setlist.id}
                        onClick={() => handleSelectSetlist(setlist)}
                        className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{setlist.nome}</p>
                            {setlist.descricao && (
                              <p className="text-sm text-muted-foreground">{setlist.descricao}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Editar</span>
                            <X className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}