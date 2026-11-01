import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { calcular } from "@/domain/pricing";
import type { Orcamento } from "@/domain/types";
import { cn } from "@/lib/utils";
import BottomBar, { type TotalRodape } from "./BottomBar";
import TopBar from "./TopBar";

interface Props {
  orc: Orcamento;
  passo: number;
  titulo: string;
  texto?: string;
  botao: string;
  total?: TotalRodape;
  onVoltar: () => void;
  onProximo: () => void;
  children: ReactNode;
}

const ETAPAS = ["Obra", "Mão de obra", "Materiais", "Ferramentas"];
export const TOTAL_PASSOS = ETAPAS.length;

/** Estrutura comum dos 4 passos: progresso com o nome das etapas, uma pergunta e o rodapé com a prévia do valor. */
export default function StepFrame({ orc, passo, titulo, texto, botao, total, onVoltar, onProximo, children }: Props) {
  const r = calcular(orc);
  return (
    <>
      <TopBar titulo={orc.obra.trim() || "Novo orçamento"} onVoltar={onVoltar}>
        <Progress value={passo} max={TOTAL_PASSOS} aria-label={`Passo ${passo} de ${TOTAL_PASSOS}: ${ETAPAS[passo - 1]}`} />
        <ol aria-hidden="true" className="mt-1.5 grid grid-cols-4 gap-1 text-caption">
          {ETAPAS.map((nome, i) => {
            const n = i + 1;
            return (
              <li key={nome} className={cn("min-w-0 whitespace-nowrap", n === passo ? "font-bold text-foreground" : n < passo ? "font-medium text-foreground" : "text-muted-foreground")}>
                {nome}
              </li>
            );
          })}
        </ol>
      </TopBar>
      <main className={cn("passo-entra mx-auto flex w-full max-w-content flex-col gap-4 px-gutter pt-5", total ? "pb-bar-lg" : "pb-bar")}>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-display-lg font-extrabold">{titulo}</h2>
          {texto && <p className="text-body text-muted-foreground">{texto}</p>}
        </div>
        {children}
      </main>
      <BottomBar valor={r.recomendado} total={total} botao={botao} onClick={onProximo} />
    </>
  );
}
