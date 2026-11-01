import Aviso from "@/components/Aviso";
import PercentInput from "@/components/PercentInput";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brl } from "@/domain/format";
import { planoDeCaixa, PLANOS } from "@/domain/pagamento";
import { lucroOuPrejuizo } from "@/domain/report";
import type { Orcamento, Parcela } from "@/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  orc: Orcamento;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
}

export default function Pagamento({ orc, editar, onVoltar }: Props) {
  const plano = planoDeCaixa(orc);
  const direto = orc.formaCompra === "faturamento_direto";
  const fechado = Math.abs(plano.somaPercentuais - 100) < 0.001;
  // Depois de assinado, as parcelas fazem parte do que o cliente aceitou.
  const assinado = orc.aceite !== null;
  const iguais = (a: Parcela[], b: Parcela[]) => JSON.stringify(a) === JSON.stringify(b);

  return (
    <>
      <TopBar titulo="Plano de pagamento" onVoltar={onVoltar} />
      <main className="mx-auto flex w-full max-w-content flex-col gap-4 px-gutter pb-section pt-4">
        {assinado ? (
          <Aviso tom="neutro">Estas parcelas foram assinadas pelo cliente. Para mudar, volte a situação do orçamento: isso apaga a assinatura.</Aviso>
        ) : (
          <>
            <p className="text-body text-muted-foreground">Veja quando o dinheiro entra e sai, antes de combinar as parcelas. As parcelas escolhidas vão para a proposta.</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Parcelas">
              {PLANOS.map((p) => (
                <Button key={p.nome} variant={iguais(orc.parcelas, p.parcelas) ? "default" : "secondary"} className="px-1" onClick={() => editar({ parcelas: structuredClone(p.parcelas) })}>
                  {p.nome}
                </Button>
              ))}
            </div>
          </>
        )}

        {orc.parcelas.length > 0 && (
          <>
            {!assinado && (
              <Card className="flex flex-col gap-3 p-4">
                <div className={cn("grid items-end gap-2", orc.parcelas.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                  {orc.parcelas.map((p, i) => (
                    <PercentInput key={i} label={p.rotulo} value={p.percentual} onChange={(v) => editar({ parcelas: orc.parcelas.map((x, k) => (k === i ? { ...x, percentual: v } : x)) })} />
                  ))}
                </div>
                {!fechado && <Aviso tom="vermelho">As parcelas somam {plano.somaPercentuais}%. Ajuste para somar 100%.</Aviso>}
              </Card>
            )}

            {fechado &&
              (plano.tiraDoBolso > 0.005 ? (
                <Aviso tom="vermelho">
                  Em algum momento faltam <strong>{brl(plano.tiraDoBolso)}</strong>: esse dinheiro sai do seu bolso até a parcela seguinte. Uma entrada maior reduz esse valor.
                </Aviso>
              ) : (
                <Aviso tom="verde">Com essas parcelas, a obra se paga sozinha: você não precisa colocar dinheiro do bolso.</Aviso>
              ))}

            {direto && plano.materialDireto > 0 && <Aviso tom="neutro">O cliente paga {brl(plano.materialDireto)} de material direto na loja. As parcelas são sobre o restante: {brl(plano.aReceber)}.</Aviso>}

            <section className="flex flex-col gap-3">
              {plano.etapas.map((e, i) => (
                <Card key={i} className="numeros flex flex-col gap-1 p-4 text-body">
                  <h2 className="font-semibold">
                    {e.rotulo} ({e.percentual}%)
                  </h2>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Entra</span>
                    <span className="font-semibold">{brl(e.recebe)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Sai (custos)</span>
                    <span className="font-semibold">{brl(e.gasta)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Sai (imposto)</span>
                    <span className="font-semibold">{brl(e.imposto)}</span>
                  </div>
                  <div className={cn("mt-1 flex justify-between gap-3 border-t pt-2 font-bold", e.saldo < 0 && "text-danger")}>
                    <span>{e.saldo < 0 ? "Falta no caixa" : "Sobra no caixa"}</span>
                    <span>{brl(Math.abs(e.saldo))}</span>
                  </div>
                </Card>
              ))}
            </section>

            {fechado && <p className="numeros text-center text-body font-semibold">No fim da obra: {lucroOuPrejuizo(plano.lucro)}</p>}
            {!assinado && (
              <Button variant="ghost" className="w-full" onClick={() => editar({ parcelas: [] })}>
                Tirar as parcelas da proposta
              </Button>
            )}
          </>
        )}
      </main>
    </>
  );
}
