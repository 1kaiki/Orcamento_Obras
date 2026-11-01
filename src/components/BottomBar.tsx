import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { brl } from "@/domain/format";
import { useContagem } from "@/lib/useContagem";
import Dinheiro from "./Dinheiro";

export interface TotalRodape {
  rotulo: string;
  valor: number;
}

interface Props {
  /** Valor recomendado; null = não existe preço possível */
  valor: number | null;
  total?: TotalRodape;
  botao: string;
  onClick: () => void;
}

function ValorPrevia({ valor }: { valor: number }) {
  const mostrado = useContagem(valor);
  const [pulso, setPulso] = useState(0);
  const anterior = useRef(valor);

  useEffect(() => {
    if (anterior.current !== valor) {
      anterior.current = valor;
      setPulso((p) => p + 1);
    }
  }, [valor]);

  return (
    <>
      <span aria-hidden="true" key={pulso} className={`block origin-left whitespace-nowrap font-display text-display-md font-extrabold text-primary ${pulso ? "valor-pulsa" : ""}`}>
        <Dinheiro texto={brl(mostrado)} />
      </span>
      <span className="sr-only" aria-live="polite">
        {brl(valor)}
      </span>
    </>
  );
}

/** Cartão fixo dos passos: prévia do valor sempre à vista e o próximo passo. */
export default function BottomBar({ valor, total, botao, onClick }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-content rounded-t-xl bg-panel px-gutter pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 text-panel-foreground shadow-raised">
      {total && (
        <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-panel-border pb-2 text-label">
          <span className="text-panel-muted">{total.rotulo}</span>
          <span className="numeros font-semibold">{brl(total.valor)}</span>
        </div>
      )}
      {/* Se não couber lado a lado (tela estreita ou valor grande), o botão desce e ocupa a linha: o valor nunca é cortado. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="grow-[9999]">
          <div className="text-caption text-panel-muted">Valor recomendado</div>
          {valor === null ? <span className="block font-display text-display-sm font-extrabold text-primary">Sem preço possível</span> : <ValorPrevia valor={valor} />}
        </div>
        <Button size="lg" className="grow pr-4" onClick={onClick}>
          {botao}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
