import { CircleCheck, MessageCircle, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import Aviso from "@/components/Aviso";
import Campo from "@/components/Campo";
import MoneyInput from "@/components/MoneyInput";
import Stepper from "@/components/Stepper";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { novoId, MARKUP_ADITIVO } from "@/domain/defaults";
import { brl, pct } from "@/domain/format";
import { linkWhatsApp, mensagemAditivo } from "@/domain/mensagens";
import { NOME_CATEGORIA, resultadoAditivo, resumoObra } from "@/domain/obra";
import { lucroOuPrejuizo } from "@/domain/report";
import type { Ajustes, CategoriaGasto, Orcamento } from "@/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  orc: Orcamento;
  ajustes: Ajustes;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
}

function Comparacao({ rotulo, previsto, real }: { rotulo: string; previsto: number; real: number }) {
  return (
    <tr className="border-b last:border-b-0">
      <th scope="row" className="py-2 text-left font-medium">
        {rotulo}
      </th>
      <td className="whitespace-nowrap py-2 pl-2 text-right text-muted-foreground">{brl(previsto)}</td>
      <td className="whitespace-nowrap py-2 pl-2 text-right font-semibold">{brl(real)}</td>
    </tr>
  );
}

export default function Obra({ orc, ajustes, editar, onVoltar }: Props) {
  const [categoria, setCategoria] = useState<CategoriaGasto>("material");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [extra, setExtra] = useState("");
  const [custoExtra, setCustoExtra] = useState(0);

  const s = resumoObra(orc);
  const concluida = orc.concluidaEm !== null;
  const simAditivo = resultadoAditivo(custoExtra, orc.imposto);
  const aditivo100 = resultadoAditivo(100, orc.imposto).lucro;

  function lancar() {
    editar({ gastos: [...orc.gastos, { id: novoId(), criadoEm: Date.now(), categoria, descricao: descricao.trim(), valor }] });
    setDescricao("");
    setValor(0);
  }

  function adicionarExtra() {
    editar({ aditivos: [...orc.aditivos, { id: novoId(), criadoEm: Date.now(), descricao: extra.trim(), custo: custoExtra, aprovado: false }] });
    setExtra("");
    setCustoExtra(0);
  }

  return (
    <>
      <TopBar titulo="Caderneta da obra" onVoltar={onVoltar} />
      <main className="mx-auto flex w-full max-w-content flex-col gap-4 px-gutter pb-section pt-4">
        <section aria-label="Lucro da obra" className="rounded-xl bg-panel p-5 text-panel-foreground">
          <div className="text-label text-panel-muted">{concluida ? "Resultado final" : "Se nada mais mudar"}</div>
          <p className={cn("numeros mt-1 font-display text-display-lg font-extrabold", s.lucroReal >= 0 && "text-primary")}>{lucroOuPrejuizo(s.lucroReal)}</p>
          <p className="numeros mt-2 text-label text-panel-muted">
            Previsto no início: {brl(s.lucroPrevisto)} · margem agora: {pct(s.margemReal)}
          </p>
        </section>

        {s.alerta && (
          <Aviso tom="vermelho">
            Você já lançou <strong>{pct(s.usoDoCusto, 0)}</strong> do custo previsto ({brl(s.custoLancado)} de {brl(s.custoPrevisto)}). Confira se dá para terminar sem estourar.
          </Aviso>
        )}

        <Card className="p-4">
          <table className="numeros w-full border-collapse text-label max-[374px]:text-caption">
            <thead>
              <tr className="border-b-2 border-foreground text-caption">
                <th scope="col" className="pb-1.5 text-left font-semibold">
                  Custo
                </th>
                <th scope="col" className="pb-1.5 pl-2 text-right font-semibold">
                  Previsto
                </th>
                <th scope="col" className="pb-1.5 pl-2 text-right font-semibold">
                  {concluida ? "Real" : "Até o fim"}
                </th>
              </tr>
            </thead>
            <tbody>
              <Comparacao rotulo="Mão de obra" previsto={s.moPrevista} real={s.moReal} />
              <Comparacao rotulo="Materiais" previsto={s.materiaisPrevistos} real={s.materiaisReais} />
              <Comparacao rotulo="Ferramentas" previsto={s.ferramentasPrevistas} real={s.ferramentasReais} />
              {s.outros > 0 && <Comparacao rotulo="Outros" previsto={0} real={s.outros} />}
              {s.custoAditivos > 0 && <Comparacao rotulo="Extras aprovados" previsto={0} real={s.custoAditivos} />}
            </tbody>
          </table>
          {!concluida && <p className="mt-2 text-caption text-muted-foreground">Enquanto a obra anda, cada linha usa o maior valor entre previsto e lançado, para compra parcial não parecer economia.</p>}
        </Card>

        <Card>
          <Stepper label="Dias na obra" ajuda={`Previstos: ${orc.dias}`} min={0} value={orc.diasReais ?? 0} onChange={(diasReais) => editar({ diasReais })} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lançar gasto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de gasto">
              {(Object.keys(NOME_CATEGORIA) as CategoriaGasto[]).map((c) => (
                <Button key={c} role="radio" aria-checked={categoria === c} variant={categoria === c ? "default" : "secondary"} className="px-1" onClick={() => setCategoria(c)}>
                  {NOME_CATEGORIA[c]}
                </Button>
              ))}
            </div>
            <Campo id="gasto-desc" label="Descrição">
              <Input id="gasto-desc" autoComplete="off" placeholder="Ex.: cabos na loja X" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </Campo>
            <MoneyInput label="Valor pago" vazioSeZero value={valor} onChange={setValor} />
            <Button variant="outline" className="w-full" disabled={!(valor > 0)} onClick={lancar}>
              <Plus aria-hidden="true" /> Lançar
            </Button>
            {orc.gastos.length > 0 && (
              <ul className="numeros flex flex-col divide-y text-label">
                {orc.gastos.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{g.descricao || NOME_CATEGORIA[g.categoria]}</span>
                      {g.descricao && <span className="block text-caption text-muted-foreground">{NOME_CATEGORIA[g.categoria]}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-semibold">
                      {brl(g.valor)}
                      <Button variant="ghost" size="icon" className="text-danger" aria-label={`Remover ${g.descricao || "gasto"}`} onClick={() => editar({ gastos: orc.gastos.filter((x) => x.id !== g.id) })}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extras pedidos na obra</CardTitle>
            <p className="text-label text-muted-foreground">Material fora do combinado: preço de mercado + {MARKUP_ADITIVO}%. Não lance o custo dele também em gastos.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {aditivo100 < 0 && (
              <Aviso>
                Com {orc.imposto}% de imposto, o extra a mercado + {MARKUP_ADITIVO}% dá prejuízo de {brl(-aditivo100)} a cada R$ 100,00 de material, se passar pela sua nota.
              </Aviso>
            )}
            <Campo id="extra-desc" label="O que foi pedido">
              <Input id="extra-desc" autoComplete="off" placeholder="Ex.: 3 tomadas a mais" value={extra} onChange={(e) => setExtra(e.target.value)} />
            </Campo>
            <MoneyInput label="Preço de mercado" vazioSeZero value={custoExtra} onChange={setCustoExtra} />
            {custoExtra > 0 && (
              <p className="numeros text-label">
                O cliente paga <strong>{brl(simAditivo.preco)}</strong>. {lucroOuPrejuizo(simAditivo.lucro)} depois do imposto.
              </p>
            )}
            <Button variant="outline" className="w-full" disabled={!(custoExtra > 0)} onClick={adicionarExtra}>
              <Plus aria-hidden="true" /> Adicionar extra
            </Button>
            {orc.aditivos.map((a) => (
              <div key={a.id} className="numeros flex flex-col gap-2 border-t pt-3 text-label">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 font-medium">{a.descricao || "Item extra"}</span>
                  <span className="shrink-0 font-semibold">{brl(resultadoAditivo(a.custo, orc.imposto).preco)}</span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Button variant="secondary" className="px-1" asChild>
                    <a href={linkWhatsApp(orc.telefone, mensagemAditivo(orc, a, ajustes.empresa))} target="_blank" rel="noopener noreferrer">
                      <MessageCircle aria-hidden="true" /> Pedir ok
                    </a>
                  </Button>
                  <Button
                    variant={a.aprovado ? "default" : "secondary"}
                    className="px-1"
                    aria-pressed={a.aprovado}
                    onClick={() => editar({ aditivos: orc.aditivos.map((x) => (x.id === a.id ? { ...x, aprovado: !x.aprovado } : x)) })}
                  >
                    <CircleCheck aria-hidden="true" /> {a.aprovado ? "Aprovado" : "Aprovar"}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-danger" aria-label={`Remover ${a.descricao || "extra"}`} onClick={() => editar({ aditivos: orc.aditivos.filter((x) => x.id !== a.id) })}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button variant={concluida ? "outline" : "default"} size="lg" className="w-full" onClick={() => editar({ concluidaEm: concluida ? null : Date.now() })}>
          {concluida ? <RotateCcw aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
          {concluida ? "Reabrir a obra" : "Concluir a obra"}
        </Button>
      </main>
    </>
  );
}
