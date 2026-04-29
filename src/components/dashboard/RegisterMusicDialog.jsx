import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const GENEROS = [
  "Rock", "Pop", "MPB", "Sertanejo", "Forró", "Pagode", "Samba", 
  "Jazz", "Blues", "Classic", "Metal", "Indie", "Alternativo", 
  "Eletrônica", "Hip Hop", "R&B", "Soul", "Reggae", "Country", "Folk", "Outro"
];

export function RegisterMusicDialog({ open, onOpenChange, artistId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ titulo: "", autor: "", genero: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!artistId) {
      toast.error("ID do artista não encontrado");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("musicas_repertorio").insert({
        artista_id: artistId,
        titulo: form.titulo.trim(),
        autor: form.autor.trim() || null,
        genero: form.genero || null,
      });

      if (error) throw error;
      
      toast.success("Música cadastrada com sucesso!");
      setForm({ titulo: "", autor: "", genero: "" });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao cadastrar música:", err);
      toast.error("Erro ao cadastrar música");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Cadastrar Música
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Nome da música"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="autor">Autor/Compositor</Label>
            <Input
              id="autor"
              placeholder="Nome do autor ou compositor"
              value={form.autor}
              onChange={(e) => setForm({ ...form, autor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genero">Gênero</Label>
            <Select value={form.genero} onValueChange={(v) => setForm({ ...form, genero: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                {GENEROS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}