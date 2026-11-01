import MoneyInput from "../components/MoneyInput";
import Stepper from "../components/Stepper";
import StepFrame from "../components/StepFrame";
import { brl } from "../domain/format";
import { calcular } from "../domain/pricing";
import type { Orcamento } from "../domain/types";

interface Props {
  orc: Orcamento;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onProximo: () => void;
}

export default function StepMaoDeObra({ orc, editar, onVoltar, onProximo }: Props) {
  const r = calcular(orc);
  return (
    <StepFrame
      orc={orc}
      passo={2}
      titulo="Mão de obra"
      texto="Cada dupla é 1 eletricista + 1 ajudante."
      botao="Próximo"
      onVoltar={onVoltar}
      onProximo={onProximo}
    >
      <div className="live-strip" aria-live="polite">
        <div>
          <small>Dupla por dia</small>
          <span className="mono">{brl(r.custoDuplaDia)}</span>
        </div>
        <div>
          <small>Mão de obra</small>
          <span className="mono">{brl(r.mo)}</span>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <Stepper label="Dias de serviço" value={orc.dias} onChange={(dias) => editar({ dias })} />
          <Stepper label="Duplas" value={orc.duplas} onChange={(duplas) => editar({ duplas })} />
        </div>
      </div>

      <div className="card stack">
        <h3 className="card-title" style={{ marginBottom: 0 }}>
          Custo da dupla por dia
        </h3>
        <MoneyInput label="Diária do eletricista" value={orc.diariaEletricista} onChange={(v) => editar({ diariaEletricista: v })} />
        <MoneyInput label="Diária do ajudante" value={orc.diariaAjudante} onChange={(v) => editar({ diariaAjudante: v })} />
        <MoneyInput label="Passagem (dupla, por dia)" value={orc.passagem} onChange={(v) => editar({ passagem: v })} />
        <MoneyInput label="Almoço (dupla, por dia)" value={orc.almoco} onChange={(v) => editar({ almoco: v })} />
      </div>
    </StepFrame>
  );
}
