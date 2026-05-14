import React from "react";
import { Music, User, Building2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const profileConfig = {
  artista: { label: "Artista", icon: Music, color: "text-primary" },
  cliente: { label: "Cliente", icon: User, color: "text-accent" },
  estabelecimento: { label: "Estabelecimento", icon: Building2, color: "text-amber-400" },
};

export function ProfileSwitcher({ activeType, baseTipo, canSwitchTo, onSwitch, compact }) {
  const current = profileConfig[activeType] || profileConfig.cliente;
  const Icon = current.icon;

  const options = Object.keys(profileConfig).filter(
    (tipo) => tipo === activeType || canSwitchTo(tipo)
  );

  if (options.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
            "bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08]",
            "text-sm font-medium"
          )}
        >
          <Icon className={cn("w-4 h-4", current.color)} />
          {!compact && <span>{current.label}</span>}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {options.map((tipo) => {
          const config = profileConfig[tipo];
          const TypeIcon = config.icon;
          const isActive = tipo === activeType;
          return (
            <DropdownMenuItem
              key={tipo}
              onClick={() => !isActive && onSwitch(tipo)}
              className={cn("flex items-center gap-3 py-2.5", isActive && "bg-primary/10")}
            >
              <TypeIcon className={cn("w-4 h-4", config.color)} />
              <span className="flex-1">{config.label}</span>
              {tipo === baseTipo && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
              {isActive && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
