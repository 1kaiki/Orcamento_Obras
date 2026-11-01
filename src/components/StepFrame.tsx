import type { ReactNode } from "react";
import { brl } from "../domain/format";
import { calcular } from "../domain/pricing";
import type { Orcamento } from "../domain/types";
import BottomBar from "./BottomBar";
import TopBar from "./TopBar";

interface Props {
  orc: Orcamento;
  passo: number;
  titulo: string;
  texto?: string;
  botao: string;
  onVoltar: () => void;
  onProximo: () => void;
  children: ReactNode;
}

export const TOTAL_PASSOS = 4;

/** Estrutura comum dos 4 passos: barra superior com progresso, conteúdo e rodapé com a prévia do valor. */
export default function StepFrame({ orc, passo, titulo, texto, botao, onVoltar, onProximo, children }: Props) {
  const r = calcular(orc);
  const previa = r.recomendado === null ? "sem preço possível" : brl(r.recomendado);
  return (
    <>
      <TopBar titulo={orc.obra.trim() || "Novo orçamento"} onVoltar={onVoltar} passo={{ atual: passo, total: TOTAL_PASSOS }} />
      <main className="page with-bar">
        <div>
          <h2 className="page-title">{titulo}</h2>
          {texto && <p className="lead">{texto}</p>}
        </div>
        {children}
      </main>
      <BottomBar previa={previa} botao={botao} onClick={onProximo} />
    </>
  );
}
