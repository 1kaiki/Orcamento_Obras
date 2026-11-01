import { SlidersHorizontal } from "lucide-react";
import ItemList from "@/components/ItemList";
import PercentInput from "@/components/PercentInput";
import StepFrame from "@/components/StepFrame";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { totalFerramentas } from "@/domain/pricing";
import type { Orcamento } from "@/domain/types";

interface Props {
  orc: Orcamento;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onProximo: () => void;
}

export default function StepFerramentas({ orc, editar, onVoltar, onProximo }: Props) {
  return (
    <StepFrame
      orc={orc}
      passo={4}
      titulo="Vai alugar alguma ferramenta?"
      texto="Só equipamento que precisa alugar. Pode deixar vazio."
      botao="Ver resultado"
      total={{ rotulo: "Total de aluguel", valor: totalFerramentas(orc) }}
      onVoltar={onVoltar}
      onProximo={onProximo}
    >
      <ItemList modo="ferramentas" itens={orc.ferramentas} onChange={(ferramentas) => editar({ ferramentas })} />

      <div className="pt-2">
        <PercentInput label="Imposto na nota" value={orc.imposto} onChange={(imposto) => editar({ imposto })} ajuda="% que você paga na emissão da nota, sobre o preço de venda." />
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="w-full text-muted-foreground">
            <SlidersHorizontal aria-hidden="true" /> Percentuais da regra deste orçamento
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Percentuais da regra</SheetTitle>
          <SheetDescription>Só mexa nisso em casos especiais. Valem apenas para este orçamento.</SheetDescription>
          <PercentInput label="Acréscimo na mão de obra" value={orc.markupMO} onChange={(v) => editar({ markupMO: v })} />
          <PercentInput label="Acréscimo nas ferramentas" value={orc.markupFerramentas} onChange={(v) => editar({ markupFerramentas: v })} />
          <PercentInput label="Acréscimo no material (meu CNPJ)" value={orc.markupMaterialCnpj} onChange={(v) => editar({ markupMaterialCnpj: v })} />
          <PercentInput label="Acréscimo no material (faturamento direto)" value={orc.markupMaterialDireto} onChange={(v) => editar({ markupMaterialDireto: v })} />
          <div className="grid grid-cols-2 gap-3">
            <PercentInput label="Margem mínima" value={orc.margemMin} onChange={(v) => editar({ margemMin: v })} />
            <PercentInput label="Margem máxima" value={orc.margemMax} onChange={(v) => editar({ margemMax: v })} />
          </div>
        </SheetContent>
      </Sheet>
    </StepFrame>
  );
}
