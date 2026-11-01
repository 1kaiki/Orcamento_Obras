import StepFrame from "../components/StepFrame";
import type { Orcamento } from "../domain/types";

interface Props {
  orc: Orcamento;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onProximo: () => void;
}

export default function StepObra({ orc, editar, onVoltar, onProximo }: Props) {
  return (
    <StepFrame orc={orc} passo={1} titulo="Qual é a obra?" botao="Próximo" onVoltar={onVoltar} onProximo={onProximo}>
      <div className="card stack">
        <div className="field">
          <label htmlFor="obra">Nome da obra</label>
          <input
            id="obra"
            className="input-solo"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Loja do Centro"
            value={orc.obra}
            onChange={(e) => editar({ obra: e.target.value })}
          />
          <span className="field-help">Se ficar vazio, o orçamento se chama "Sem nome".</span>
        </div>
        <div className="field">
          <label htmlFor="cliente">Cliente (opcional)</label>
          <input
            id="cliente"
            className="input-solo"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Maria Souza"
            value={orc.cliente}
            onChange={(e) => editar({ cliente: e.target.value })}
          />
        </div>
      </div>
    </StepFrame>
  );
}
