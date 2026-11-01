import ItemList from "../components/ItemList";
import OptionCard from "../components/OptionCard";
import StepFrame from "../components/StepFrame";
import { brl, pctInteiro } from "../domain/format";
import { totalMateriais } from "../domain/pricing";
import type { Orcamento } from "../domain/types";

interface Props {
  orc: Orcamento;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onProximo: () => void;
}

export default function StepMateriais({ orc, editar, onVoltar, onProximo }: Props) {
  return (
    <StepFrame orc={orc} passo={3} titulo="Materiais" botao="Próximo" onVoltar={onVoltar} onProximo={onProximo}>
      <div className="stack">
        <span className="field-label">Como os materiais serão comprados?</span>
        <div className="options" role="radiogroup" aria-label="Forma de compra dos materiais">
          <OptionCard
            selecionado={orc.formaCompra === "faturamento_direto"}
            titulo={`Faturamento direto (+${pctInteiro(orc.markupMaterialDireto)})`}
            descricao="A nota sai no CNPJ do cliente."
            onSelect={() => editar({ formaCompra: "faturamento_direto" })}
          />
          <OptionCard
            selecionado={orc.formaCompra === "meu_cnpj"}
            titulo={`Compro no meu CNPJ (+${pctInteiro(orc.markupMaterialCnpj)})`}
            descricao="Você compra e repassa para o cliente."
            onSelect={() => editar({ formaCompra: "meu_cnpj" })}
          />
        </div>
      </div>

      <div className="tip">
        Use <strong>preço de mercado, sem desconto</strong>. Não tem a lista ainda? Coloque um item só com o valor total.
      </div>

      <ItemList modo="materiais" itens={orc.materiais} onChange={(materiais) => editar({ materiais })} />

      <div className="total-line">
        <span>Total de materiais</span>
        <span className="mono">{brl(totalMateriais(orc))}</span>
      </div>
    </StepFrame>
  );
}
