import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

const normalize = (str) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const filterFn = (value, search) =>
  normalize(value).includes(normalize(search)) ? 1 : 0;

const MusicItem = memo(({ item, isSelected, onSelect }) => (
  <CommandItem
    value={`${item.titulo} ${item.artista_original || ""}`}
    onSelect={onSelect}
  >
    <Check className={cn("mr-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
    <div className="flex flex-col min-w-0">
      <span className="truncate">{item.titulo}</span>
      {!!item.artista_original && (
        <span className="text-xs text-muted-foreground truncate">{item.artista_original}</span>
      )}
    </div>
  </CommandItem>
));
MusicItem.displayName = "MusicItem";

export const MusicCombobox = memo(function MusicCombobox({
  open,
  onOpenChange,
  items,
  selectedTitle,
  onSelectTitle,
  triggerPlaceholder = "Selecione uma música...",
  searchPlaceholder = "Buscar música...",
  className,
  forceDrawer = false,
}) {
  const isMobile = useIsMobile();
  const useDrawer = isMobile || forceDrawer;

  const handleSelect = useCallback((titulo) => {
    onSelectTitle(titulo);
    onOpenChange(false);
  }, [onSelectTitle, onOpenChange]);

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-between font-normal", className)}
    >
      {selectedTitle ? selectedTitle : triggerPlaceholder}
      <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const list = (
    <Command shouldFilter={true} filter={filterFn}>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList className={cn(isMobile && "max-h-[60vh]")}>
        <CommandEmpty>Nenhuma música encontrada.</CommandEmpty>
        <CommandGroup>
          {items.map((m) => (
            <MusicItem
              key={m.id}
              item={m}
              isSelected={selectedTitle === m.titulo}
              onSelect={() => handleSelect(m.titulo)}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (useDrawer) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Escolha uma música</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">{list}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {list}
      </PopoverContent>
    </Popover>
  );
});
