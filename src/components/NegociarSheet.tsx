import { useEffect, useState } from "react";
import Aviso from "@/components/Aviso";
import MoneyInput from "@/components/MoneyInput";
import StatusChip from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { brl, pct } from "@/domain/format";
import { AVISO_SIMULACAO, pisoSemPrejuizo, simularPreco, valorDaObra } from "@/domain/negociacao";
import { calcular } from "@/domain/pricing";
import { lucroOuPrejuizo } from "@/domain/report";
import type { Orcamento } from "@/domain/types";

interface Props {
  orc: Orcamento;
  aberto: boolean;
  onAberto: (a: boolean) => void;
  editar: (parcial: Partial<Orcamento>) => void;
}

/** Simula outro valor sem mexer no preço calculado: o valor combinado fica em um campo próprio. */
export default function NegociarSheet({ orc, aberto, onAberto, editar }: Props) {
  const [preco, setPreco] = useState(0);
  const r = calcular(orc);
  const piso = pisoSemPrejuizo(orc);
  const s = simularPreco(orc, preco);

  useEffect(() => {
    if (aberto) setPreco(valorDaObra(orc) ?? 0);
    // Só ao abrir: depois disso o campo é do usuário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  return (
    <Sheet open={aberto} onOpenChange={onAberto}>
      <SheetContent>
        <SheetTitle>O cliente pediu desconto</SheetTitle>
        <SheetDescription>Digite o valor pedido e veja o que sobra para você. O preço recomendado não muda.</SheetDescription>
        <MoneyInput label="Valor que o cliente quer pagar" value={preco} onChange={setPreco} />
        {preco > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="numeros font-display text-display-sm font-bold">{lucroOuPrejuizo(s.lucro)}</strong>
              <StatusChip status={s.status} texto={`Margem ${pct(s.margem)}`} />
            </div>
            <Aviso tom={s.status === "prejuizo" ? "vermelho" : "amarelo"}>
              {AVISO_SIMULACAO[s.status]} Desse valor, {brl(s.imposto)} vão para o imposto.
            </Aviso>
          </>
        )}
        <dl className="numeros flex flex-col gap-1 text-label">
          {r.recomendado !== null && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Recomendado</dt>
              <dd className="font-semibold">{brl(r.recomendado)}</dd>
            </div>
          )}
          {piso !== null && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Abaixo disso é prejuízo</dt>
              <dd className="font-semibold">{brl(piso)}</dd>
            </div>
          )}
        </dl>
        <Button
          size="lg"
          className="w-full"
          disabled={!(preco > 0)}
          onClick={() => {
            editar({ valorFechado: preco });
            onAberto(false);
            toast.success("Valor combinado guardado");
          }}
        >
          Combinar esse valor
        </Button>
        {orc.valorFechado !== null && orc.situacao !== "aceito" && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              editar({ valorFechado: null });
              onAberto(false);
            }}
          >
            Voltar ao valor recomendado
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
