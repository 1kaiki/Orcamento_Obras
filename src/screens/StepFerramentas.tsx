import ItemList from "../components/ItemList";
import PercentInput from "../components/PercentInput";
import StepFrame from "../components/StepFrame";
import { brl } from "../domain/format";
import { totalFerramentas } from "../domain/pricing";
import type { Orcamento } from "../domain/types";

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
      titulo="Ferramentas e imposto"
      texto="Só equipamento que precisa alugar. Pode deixar vazio."
      botao="Ver resultado"
      onVoltar={onVoltar}
      onProximo={onProximo}
    >
      <ItemList modo="ferramentas" itens={orc.ferramentas} onChange={(ferramentas) => editar({ ferramentas })} />

      {orc.ferramentas.length > 0 && (
        <div className="total-line">
          <span>Total de aluguel</span>
          <span className="mono">{brl(totalFerramentas(orc))}</span>
        </div>
      )}

      <div className="card stack">
        <PercentInput
          label="Imposto na nota"
          value={orc.imposto}
          onChange={(imposto) => editar({ imposto })}
          ajuda="% que você paga na emissão da nota, sobre o preço de venda."
        />
      </div>

      <details className="card">
        <summary>Percentuais da regra deste orçamento</summary>
        <div className="stack">
          <p className="field-help">Só mexa nisso em casos especiais. Valem apenas para este orçamento.</p>
          <PercentInput label="Acréscimo na mão de obra" value={orc.markupMO} onChange={(v) => editar({ markupMO: v })} />
          <PercentInput label="Acréscimo nas ferramentas" value={orc.markupFerramentas} onChange={(v) => editar({ markupFerramentas: v })} />
          <PercentInput label="Acréscimo no material (meu CNPJ)" value={orc.markupMaterialCnpj} onChange={(v) => editar({ markupMaterialCnpj: v })} />
          <PercentInput label="Acréscimo no material (faturamento direto)" value={orc.markupMaterialDireto} onChange={(v) => editar({ markupMaterialDireto: v })} />
          <div className="row">
            <PercentInput label="Margem mínima" value={orc.margemMin} onChange={(v) => editar({ margemMin: v })} />
            <PercentInput label="Margem máxima" value={orc.margemMax} onChange={(v) => editar({ margemMax: v })} />
          </div>
        </div>
      </details>
    </StepFrame>
  );
}
