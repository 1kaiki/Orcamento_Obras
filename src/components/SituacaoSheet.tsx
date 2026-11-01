import { useState } from "react";
import MoneyInput from "@/components/MoneyInput";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { mudarSituacao, NOME_MOTIVO, NOME_SITUACAO } from "@/domain/funil";
import type { MotivoPerda, Orcamento, SituacaoOrcamento } from "@/domain/types";

interface Props {
  orc: Orcamento;
  aberto: boolean;
  onAberto: (a: boolean) => void;
  editar: (parcial: Partial<Orcamento>) => void;
}

const SITUACOES: SituacaoOrcamento[] = ["rascunho", "enviado", "aceito"];

export default function SituacaoSheet({ orc, aberto, onAberto, editar }: Props) {
  const [perdendo, setPerdendo] = useState(false);

  const fechar = (a: boolean) => {
    setPerdendo(false);
    onAberto(a);
  };

  return (
    <Sheet open={aberto} onOpenChange={fechar}>
      <SheetContent>
        <SheetTitle>{perdendo ? "Por que perdeu?" : "Situação do orçamento"}</SheetTitle>
        <SheetDescription>{perdendo ? "Com o tempo, o app mostra o motivo mais comum." : "Ajuda a saber quem cobrar e quanto você está fechando."}</SheetDescription>
        {perdendo ? (
          <div className="flex flex-col gap-2">
            {(Object.keys(NOME_MOTIVO) as MotivoPerda[]).map((m) => (
              <Button
                key={m}
                variant="secondary"
                size="lg"
                className="w-full justify-start"
                onClick={() => {
                  editar(mudarSituacao(orc, "perdido", m));
                  fechar(false);
                }}
              >
                {NOME_MOTIVO[m]}
              </Button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {SITUACOES.map((s) => (
                <Button
                  key={s}
                  variant={orc.situacao === s ? "default" : "secondary"}
                  size="lg"
                  className="w-full justify-start"
                  aria-pressed={orc.situacao === s}
                  onClick={() => {
                    editar(mudarSituacao(orc, s));
                    fechar(false);
                  }}
                >
                  {NOME_SITUACAO[s]}
                </Button>
              ))}
              <Button variant={orc.situacao === "perdido" ? "default" : "secondary"} size="lg" className="w-full justify-start" aria-pressed={orc.situacao === "perdido"} onClick={() => setPerdendo(true)}>
                {NOME_SITUACAO.perdido}
              </Button>
            </div>
            {orc.aceite ? (
              <p className="text-label text-muted-foreground">Mudar a situação apaga a assinatura do cliente.</p>
            ) : (
              <MoneyInput label="Validade da proposta" prefixo="" sufixo="dias" variante="quantidade" value={orc.validadeDias} onChange={(validadeDias) => editar({ validadeDias })} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
