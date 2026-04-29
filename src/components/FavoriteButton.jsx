import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorite } from "@/hooks/useFavorite";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function FavoriteButton({ targetId, targetType, size = "icon", className }) {
  const { isFavorited, toggle, loading, isLoggedIn } = useFavorite(targetId, targetType);
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast("Crie uma conta de fã para favoritar!", {
        action: { label: "Criar conta", onClick: () => navigate("/auth?tipo=cliente") },
      });
      return;
    }
    const success = await toggle();
    if (success) {
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos!");
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("shrink-0", className)}
      onClick={handleClick}
      disabled={loading}
      title={isFavorited ? "Remover dos favoritos" : "Favoritar"}
    >
      <Heart className={cn("w-5 h-5 transition-colors", isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </Button>
  );
}
