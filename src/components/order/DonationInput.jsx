import { useState } from "react";
import { DollarSign, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DonationInput({ value, onChange }) {
  const presets = [2, 5, 10, 20, 50];
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (amount) => {
    setIsCustom(false);
    onChange(amount);
  };

  const handleCustomChange = (e) => {
    const val = parseFloat(e.target.value);
    onChange(isNaN(val) ? 0 : val);
  };

  return (
    <div className="space-y-6">
      {/* Custom Amount Header */}
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
          R$
        </div>
        <Input
          type="number"
          min="2"
          step="1"
          value={value || ""}
          onChange={(e) => {
            setIsCustom(true);
            handleCustomChange(e);
          }}
          onFocus={() => setIsCustom(true)}
          className={`pl-16 h-20 text-3xl font-black bg-white/5 border-2 rounded-[2rem] transition-all duration-300 ${
            isCustom ? "border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] bg-primary/5" : "border-white/10"
          }`}
          placeholder="Valor personalizado"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Dê o seu valor</span>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-5 gap-2">
        {presets.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handlePresetClick(amount)}
            className={`h-12 rounded-xl font-bold transition-all duration-300 border ${
              value === amount && !isCustom
                ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] scale-105"
                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
            }`}
          >
            {amount}
          </button>
        ))}
      </div>

      {value > 0 && value < 2 && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive text-center font-bold uppercase tracking-tighter"
        >
          Mínimo R$ 2,00 para apoiar o artista
        </motion.p>
      )}

      {value === 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center backdrop-blur-sm">
          <p className="text-sm text-white/80 font-medium">
            Pedido <span className="text-primary font-black uppercase tracking-tighter">Grátis</span> selecionado
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest opacity-60">
            Músicas personalizadas e dedicatórias apenas com gorjeta
          </p>
        </div>
      )}
    </div>
  );
}
