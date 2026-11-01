import { UserRound, UsersRound, Check, type LucideIcon } from "lucide-react";
import Campo from "@/components/Campo";
import ChecklistVisita from "@/components/ChecklistVisita";
import StepFrame from "@/components/StepFrame";
import { Input } from "@/components/ui/input";
import { valoresDeEquipe } from "@/domain/defaults";
import type { Ajustes, Orcamento } from "@/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  orc: Orcamento;
  ajustes: Ajustes;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onProximo: () => void;
}

function OpcaoEquipe({ selecionado, Icone, titulo, descricao, onSelect }: { selecionado: boolean; Icone: LucideIcon; titulo: string; descricao: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-lg border-2 p-3 text-left transition-[transform,background-color,border-color] duration-fast active:scale-[0.98]",
        selecionado ? "border-foreground bg-primary text-primary-foreground" : "border-input bg-card text-card-foreground",
      )}
    >
      <span className="flex items-center justify-between">
        <Icone className="size-6" aria-hidden="true" />
        <span className={cn("flex size-6 items-center justify-center rounded-full border-2", selecionado ? "border-foreground bg-primary-foreground text-primary" : "border-input")}>
          {selecionado && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
        </span>
      </span>
      <span className="text-body font-bold leading-tight">{titulo}</span>
      <span className={cn("text-caption", !selecionado && "text-muted-foreground")}>{descricao}</span>
    </button>
  );
}

export default function StepObra({ orc, ajustes, editar, onVoltar, onProximo }: Props) {
  return (
    <StepFrame orc={orc} passo={1} titulo="Qual é a obra?" botao="Próximo" onVoltar={onVoltar} onProximo={onProximo}>
      <div className="flex flex-col gap-4">
        <Campo id="obra" label="Nome da obra" ajuda='Se ficar vazio, o orçamento se chama "Sem nome".'>
          <Input id="obra" autoComplete="off" placeholder="Ex.: Loja do Centro" value={orc.obra} onChange={(e) => editar({ obra: e.target.value })} />
        </Campo>

        <div className="flex flex-col gap-1.5">
          <span id="equipe" className="text-label font-semibold">
            Quem vai trabalhar?
          </span>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="equipe">
            <OpcaoEquipe selecionado={!orc.semAjudante} Icone={UsersRound} titulo="Com ajudante" descricao="Eletricista + ajudante." onSelect={() => orc.semAjudante && editar(valoresDeEquipe(false, ajustes))} />
            <OpcaoEquipe selecionado={orc.semAjudante} Icone={UserRound} titulo="Sem ajudante" descricao="Só o eletricista." onSelect={() => !orc.semAjudante && editar(valoresDeEquipe(true, ajustes))} />
          </div>
        </div>

        <Campo id="cliente" label="Cliente (opcional)">
          <Input id="cliente" autoComplete="off" placeholder="Ex.: Maria Souza" value={orc.cliente} onChange={(e) => editar({ cliente: e.target.value })} />
        </Campo>
        <Campo id="telefone" label="WhatsApp do cliente (opcional)">
          <Input id="telefone" type="tel" inputMode="tel" autoComplete="off" placeholder="Ex.: 11 91234-5678" value={orc.telefone} onChange={(e) => editar({ telefone: e.target.value })} />
        </Campo>
        <Campo id="escopo" label="O que será feito (opcional)" ajuda="Aparece na proposta para o cliente.">
          <textarea
            id="escopo"
            rows={3}
            placeholder="Ex.: instalação elétrica completa da loja, com quadro novo e iluminação."
            value={orc.escopo}
            onChange={(e) => editar({ escopo: e.target.value })}
            className="w-full min-w-0 rounded-md border-2 border-input bg-card px-4 py-3 text-body-lg text-foreground transition-colors duration-fast placeholder:text-muted-foreground focus-visible:border-foreground"
          />
        </Campo>
        <ChecklistVisita orc={orc} editar={editar} />
      </div>
    </StepFrame>
  );
}
