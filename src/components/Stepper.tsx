import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import Dinheiro from "./Dinheiro";

interface Props {
  value: number;
  onChange: (valor: number) => void;
  label: string;
  ajuda?: string;
  min?: number;
  max?: number;
}

export default function Stepper({ value, onChange, label, ajuda, min = 1, max = 999 }: Props) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div id={id} className="text-body-lg font-semibold">
          {label}
        </div>
        {ajuda && <div className="text-caption text-muted-foreground">{ajuda}</div>}
      </div>
      <div role="group" aria-labelledby={id} className="flex shrink-0 items-center gap-1">
        <Button variant="secondary" size="icon" className="size-cta" aria-label={`Diminuir ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          <Minus aria-hidden="true" />
        </Button>
        <output aria-live="polite" className="w-14 text-center font-display text-display-lg font-extrabold">
          <Dinheiro texto={String(value)} />
        </output>
        <Button variant="secondary" size="icon" className="size-cta" aria-label={`Aumentar ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
