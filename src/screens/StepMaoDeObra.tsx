import MoneyInput from "@/components/MoneyInput";
import StepFrame from "@/components/StepFrame";
import Stepper from "@/components/Stepper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { brl } from "@/domain/format";
import { calcular } from "@/domain/pricing";
import type { Orcamento } from "@/domain/types";

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
      titulo="Quanto tempo de serviço?"
      texto={orc.semAjudante ? "Sem ajudante: conte só os eletricistas." : "Cada dupla é 1 eletricista + 1 ajudante."}
      botao="Próximo"
      total={{ rotulo: "Mão de obra", valor: r.mo }}
      onVoltar={onVoltar}
      onProximo={onProximo}
    >
      <Card className="divide-y">
        <Stepper label="Dias de serviço" value={orc.dias} onChange={(dias) => editar({ dias })} />
        <Stepper label={orc.semAjudante ? "Eletricistas" : "Duplas"} value={orc.duplas} onChange={(duplas) => editar({ duplas })} />
      </Card>

      <Card>
        <Accordion type="single" collapsible>
          <AccordionItem value="custo">
            <AccordionTrigger>
              <span className="min-w-0">
                <span className="block text-body font-semibold">{orc.semAjudante ? "Custo do eletricista por dia" : "Custo da dupla por dia"}</span>
                <span className="numeros block text-label text-muted-foreground">{brl(r.custoDuplaDia)}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3">
              <MoneyInput label="Diária do eletricista" value={orc.diariaEletricista} onChange={(v) => editar({ diariaEletricista: v })} />
              {!orc.semAjudante && <MoneyInput label="Diária do ajudante" value={orc.diariaAjudante} onChange={(v) => editar({ diariaAjudante: v })} />}
              <MoneyInput label={`Passagem (${orc.semAjudante ? "eletricista" : "dupla"}, por dia)`} value={orc.passagem} onChange={(v) => editar({ passagem: v })} />
              <MoneyInput label={`Almoço (${orc.semAjudante ? "eletricista" : "dupla"}, por dia)`} value={orc.almoco} onChange={(v) => editar({ almoco: v })} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </StepFrame>
  );
}
