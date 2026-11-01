import { BookmarkPlus, ClipboardList, Copy, FileSignature, FileSpreadsheet, FileText, HandCoins, Lightbulb, Loader2, MessageCircle, Monitor, MoreVertical, Pencil, Send, Trash2, WalletCards } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Aviso from "@/components/Aviso";
import BarraDinheiro from "@/components/BarraDinheiro";
import Campo from "@/components/Campo";
import Dinheiro from "@/components/Dinheiro";
import MarginGauge from "@/components/MarginGauge";
import NegociarSheet from "@/components/NegociarSheet";
import Relatorio, { COR_TOM, dividirRelatorio, TEXTO_TOM } from "@/components/Relatorio";
import RevisarPrecosSheet from "@/components/RevisarPrecosSheet";
import SituacaoSheet from "@/components/SituacaoSheet";
import StatusChip from "@/components/StatusChip";
import TopBar from "@/components/TopBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { itensSemPreco, precosParaRevisar } from "@/domain/catalogo";
import { modeloDeOrcamento } from "@/domain/defaults";
import { brl, dataBR, nomeArquivo, pct, pctInteiro } from "@/domain/format";
import { diasDesde, mudarSituacao, NOME_MOTIVO, NOME_SITUACAO, propostaVencida } from "@/domain/funil";
import { linkWhatsApp, mensagemProposta, mensagemRetorno } from "@/domain/mensagens";
import { simularPreco, valorDaObra } from "@/domain/negociacao";
import { calcular, TEXTO_STATUS, TOM_STATUS } from "@/domain/pricing";
import { gerarRelatorio, lucroOuPrejuizo, TITULOS } from "@/domain/report";
import type { Ajustes, ItemCatalogo, Orcamento, SituacaoOrcamento } from "@/domain/types";
import { baixar } from "@/export/download";
import { useContagem } from "@/lib/useContagem";
import { cn } from "@/lib/utils";
import { lerCatalogo, salvarModelo } from "@/storage/repo";

interface Props {
  orc: Orcamento;
  ajustes: Ajustes;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onEditar: () => void;
  onDuplicar: () => void;
  onExcluir: () => void;
  onCliente: () => void;
  onPagamento: () => void;
  onAceite: () => void;
  onObra: () => void;
}

const VARIANTE_SITUACAO: Record<SituacaoOrcamento, "neutral" | "warning" | "success" | "danger"> = {
  rascunho: "neutral",
  enviado: "warning",
  aceito: "success",
  perdido: "danger",
};

function ValorHeroi({ valor }: { valor: number }) {
  const mostrado = useContagem(valor, 700, 0);
  const texto = brl(valor);
  // Valores maiores encolhem para caber numa linha só.
  const tamanho = texto.length > 13 ? "text-display-lg" : texto.length > 12 ? "text-display-2xl" : "text-display-hero";
  return (
    <p className={cn("whitespace-nowrap font-display font-extrabold", tamanho)}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {/* A largura não muda durante a contagem: o texto final reserva o espaço */}
        <Dinheiro texto={brl(mostrado)} prefixoMenor />
      </span>
    </p>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: ReactNode; forte?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0", forte && "font-bold")}>
      <span className={forte ? undefined : "text-muted-foreground"}>{rotulo}</span>
      <span className="numeros text-right font-semibold">{valor}</span>
    </div>
  );
}

function AcaoBotao({ Icone, children, onClick, disabled }: { Icone: typeof Pencil; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="secondary" className="h-auto min-h-touch w-full justify-start whitespace-normal py-2 text-left" disabled={disabled} onClick={onClick}>
      <Icone aria-hidden="true" /> {children}
    </Button>
  );
}

export default function Result({ orc, ajustes, editar, onVoltar, onEditar, onDuplicar, onExcluir, onCliente, onPagamento, onAceite, onObra }: Props) {
  const r = calcular(orc);
  const [exportando, setExportando] = useState<"" | "xlsx" | "pdf" | "proposta">("");
  const [confirmando, setConfirmando] = useState(false);
  const [menu, setMenu] = useState(false);
  const [negociando, setNegociando] = useState(false);
  const [mudandoSituacao, setMudandoSituacao] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [nomeModelo, setNomeModelo] = useState<string | null>(null);
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);

  useEffect(() => {
    lerCatalogo().then(setCatalogo).catch(() => undefined);
  }, []);

  const preco = valorDaObra(orc);
  const sim = preco === null ? null : simularPreco(orc, preco);
  const combinado = orc.valorFechado !== null;
  const dif = r.recomendado !== null && Math.abs(r.recomendado - r.precoRegra) > 0.005;
  const tom = TOM_STATUS[r.status];
  const nome = orc.obra.trim() || "Sem nome";
  const pelaRegra = dif ? " pela regra" : "";
  const aberto = orc.situacao === "rascunho" || orc.situacao === "enviado";
  const aceito = orc.situacao === "aceito";
  const semPreco = itensSemPreco(orc);
  const revisar = aberto ? precosParaRevisar(orc, catalogo) : [];

  const { resumo, secoes } = dividirRelatorio(gerarRelatorio(orc));
  const secao = (titulo: string) => secoes.find((s) => s.titulo === titulo)?.blocos ?? [];
  const porQue = secao(TITULOS.porque);

  const detalhes = [
    { id: "custos", titulo: TITULOS.custo, valor: brl(r.A), blocos: secao(TITULOS.custo) },
    { id: "venda", titulo: TITULOS.venda, valor: `${brl(r.precoRegra)}${pelaRegra}`, blocos: secao(TITULOS.venda) },
    { id: "imposto", titulo: TITULOS.imposto, valor: `${brl(r.E)}${pelaRegra}`, blocos: secao(TITULOS.imposto) },
    { id: "resultado", titulo: TITULOS.sobra, valor: `${lucroOuPrejuizo(r.resultado)}${pelaRegra}`, blocos: secao(TITULOS.sobra) },
    { id: "fechar", titulo: TITULOS.fechar, valor: "Dicas e faixa para negociar", blocos: secao(TITULOS.fechar) },
    { id: "materiais", titulo: TITULOS.materiais, valor: brl(r.materiais), blocos: secao(TITULOS.materiais) },
    { id: "palavras", titulo: TITULOS.palavras, valor: "Custo, lucro, margem e faixa ideal", blocos: secao(TITULOS.palavras) },
  ].filter((d) => d.blocos.length > 0);

  async function exportar(tipo: "xlsx" | "pdf" | "proposta") {
    setExportando(tipo);
    setMenu(false);
    try {
      if (tipo === "xlsx") {
        const { gerarExcel } = await import("@/export/excel");
        await baixar(await gerarExcel(orc), nomeArquivo(orc.obra, "xlsx", "Relatorio-interno"));
      } else if (tipo === "pdf") {
        const { gerarPdf } = await import("@/export/pdf");
        await baixar(await gerarPdf(orc), nomeArquivo(orc.obra, "pdf", "Relatorio-interno"));
      } else {
        const { gerarProposta } = await import("@/export/proposta");
        const enviou = await baixar(await gerarProposta(orc, ajustes.empresa), nomeArquivo(orc.obra, "pdf", orc.aceite ? "Termo-de-aceite" : "Proposta"), mensagemProposta(orc, ajustes.empresa));
        if (enviou && orc.situacao === "rascunho") editar(mudarSituacao(orc, "enviado"));
      }
      toast.success(tipo === "xlsx" ? "Excel gerado" : tipo === "pdf" ? "Relatório interno gerado" : "Proposta gerada");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o arquivo. Tente de novo.");
    } finally {
      setExportando("");
    }
  }

  async function guardarModelo() {
    if (!nomeModelo?.trim()) return;
    await salvarModelo(modeloDeOrcamento(orc, nomeModelo.trim()));
    setNomeModelo(null);
    toast.success("Modelo salvo");
  }

  return (
    <>
      <TopBar
        titulo={nome}
        onVoltar={onVoltar}
        extra={
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações">
                <MoreVertical aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>{nome}</SheetTitle>
              <SheetDescription className="sr-only">Editar, duplicar, exportar ou excluir este orçamento.</SheetDescription>
              <div className="flex flex-col gap-2">
                {!aceito && (
                  <Button variant="secondary" size="lg" className="w-full justify-start" onClick={onEditar}>
                    <Pencil aria-hidden="true" /> Editar valores
                  </Button>
                )}
                <Button variant="secondary" size="lg" className="w-full justify-start" onClick={onDuplicar}>
                  <Copy aria-hidden="true" /> Duplicar
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full justify-start"
                  onClick={() => {
                    setMenu(false);
                    setNomeModelo(orc.obra.trim());
                  }}
                >
                  <BookmarkPlus aria-hidden="true" /> Salvar como modelo
                </Button>
                <p className="px-1 pt-2 text-caption font-semibold text-muted-foreground">Só para você: mostram custo e lucro</p>
                <Button variant="secondary" size="lg" className="w-full justify-start" disabled={!!exportando} onClick={() => void exportar("pdf")}>
                  <FileText aria-hidden="true" /> Relatório interno em PDF
                </Button>
                <Button variant="secondary" size="lg" className="w-full justify-start" disabled={!!exportando} onClick={() => void exportar("xlsx")}>
                  <FileSpreadsheet aria-hidden="true" /> Relatório interno em Excel
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start text-danger"
                  onClick={() => {
                    setMenu(false);
                    setConfirmando(true);
                  }}
                >
                  <Trash2 aria-hidden="true" /> Excluir
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      <main className="mx-auto flex w-full max-w-content flex-col gap-4 px-gutter pb-bar pt-4">
        <section aria-label="Valor a cobrar" className="rounded-xl bg-primary p-5 text-primary-foreground">
          <div className="text-body-lg font-semibold">{combinado ? "Valor combinado" : "Cobre do cliente"}</div>
          {preco === null || sim === null ? (
            <>
              <p className="mt-1 font-display text-display-xl font-extrabold">Sem preço possível</p>
              <p className="mt-2 text-body font-medium">Imposto + margem desejada chegam a 100% ou mais. Reduza um dos dois.</p>
            </>
          ) : (
            <>
              <ValorHeroi valor={preco} />
              <p className="numeros mt-2 text-body font-medium">{lucroOuPrejuizo(sim.lucro)} depois do imposto</p>
              {combinado && r.recomendado !== null && <p className="numeros text-label font-medium">Recomendado: {brl(r.recomendado)}</p>}
            </>
          )}
        </section>

        {semPreco > 0 && (
          <Aviso tom="vermelho">
            {semPreco === 1 ? "1 item está sem preço" : `${semPreco} itens estão sem preço`}: o valor acima ainda está incompleto.
            {!aceito && (
              <button type="button" className="mt-1 block font-semibold underline" onClick={onEditar}>
                Preencher agora
              </button>
            )}
          </Aviso>
        )}
        {propostaVencida(orc) && <Aviso>A validade da proposta acabou. Confira os preços antes de confirmar o valor.</Aviso>}
        {revisar.length > 0 && (
          <Aviso>
            {revisar.length === 1 ? "1 preço de material pode estar desatualizado." : `${revisar.length} preços de material podem estar desatualizados.`}
            <button type="button" className="mt-1 block font-semibold underline" onClick={() => setRevisando(true)}>
              Revisar preços
            </button>
          </Aviso>
        )}
        {sim !== null && sim.lucro < 0 && <Aviso tom="vermelho">Esse valor não paga os custos e o imposto da obra.</Aviso>}

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="font-display text-display-sm font-bold">Situação</h2>
              <Badge variant={VARIANTE_SITUACAO[orc.situacao]}>{NOME_SITUACAO[orc.situacao]}</Badge>
            </div>
            <Button variant="ghost" onClick={() => setMudandoSituacao(true)}>
              Mudar
            </Button>
          </div>
          {orc.situacao === "enviado" && orc.enviadoEm !== null && <p className="text-label text-muted-foreground">Enviado há {diasDesde(orc.enviadoEm)} dia(s). Vale {orc.validadeDias} dias.</p>}
          {orc.situacao === "perdido" && orc.motivoPerda && <p className="text-label text-muted-foreground">Motivo: {NOME_MOTIVO[orc.motivoPerda]}.</p>}
          {orc.aceite && (
            <p className="text-label text-muted-foreground">
              Assinado por {orc.aceite.nome} em {dataBR(orc.aceite.em)}.
            </p>
          )}
          <div className="grid gap-2 min-[400px]:grid-cols-2">
            {aberto && (
              <AcaoBotao Icone={HandCoins} onClick={() => setNegociando(true)}>
                O cliente pediu desconto
              </AcaoBotao>
            )}
            <AcaoBotao Icone={WalletCards} onClick={onPagamento}>
              Plano de pagamento
            </AcaoBotao>
            {aberto && (
              <AcaoBotao Icone={FileSignature} disabled={preco === null} onClick={onAceite}>
                Colher assinatura
              </AcaoBotao>
            )}
            {orc.situacao === "enviado" && (
              <Button variant="secondary" className="h-auto min-h-touch w-full justify-start whitespace-normal py-2 text-left" asChild>
                <a href={linkWhatsApp(orc.telefone, mensagemRetorno(orc, ajustes.empresa))} target="_blank" rel="noopener noreferrer" onClick={() => editar({ retornoEm: Date.now() })}>
                  <MessageCircle aria-hidden="true" /> Cobrar resposta
                </a>
              </Button>
            )}
            {aceito && (
              <AcaoBotao Icone={ClipboardList} onClick={onObra}>
                Caderneta da obra
              </AcaoBotao>
            )}
          </div>
        </Card>

        {preco !== null && sim !== null && (
          <Card className="flex flex-col gap-3 p-4">
            <h2 className="font-display text-display-sm font-bold">Para onde vai o dinheiro</h2>
            <BarraDinheiro preco={preco} custo={r.A} imposto={sim.imposto} lucro={sim.lucro} />
          </Card>
        )}

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-display-sm font-bold">Margem</h2>
            <StatusChip status={sim?.status ?? r.status} />
          </div>
          <MarginGauge margem={r.margem} margemRecomendada={sim?.margem ?? null} min={orc.margemMin} max={orc.margemMax} />
          <p className="text-caption text-muted-foreground">
            Margem é a parte do valor cobrado que vira lucro. Faixa ideal: {pctInteiro(orc.margemMin)} a {pctInteiro(orc.margemMax)}. Só somando as partes (pela regra), a margem seria {pct(r.margem)}: {TEXTO_STATUS[r.status].toLowerCase()}.
          </p>
        </Card>

        <section aria-labelledby="por-que" className={cn("flex flex-col gap-3 rounded-lg p-4", COR_TOM[tom])}>
          <h2 id="por-que" className="flex items-center gap-2 font-display text-display-md font-extrabold">
            <Lightbulb className={cn("size-6 shrink-0", TEXTO_TOM[tom])} aria-hidden="true" />
            Por que esse valor
          </h2>
          <Relatorio blocos={resumo} />
          {porQue.flatMap((b, i) =>
            b.tipo === "caixa"
              ? [
                  <div key={i} className="numeros flex flex-col gap-2 border-t border-foreground/20 pt-3 text-body">
                    <strong className={TEXTO_TOM[b.tom]}>{b.titulo}</strong>
                    {b.textos.map((t, k) => (
                      <p key={k}>{t}</p>
                    ))}
                  </div>,
                ]
              : [],
          )}
        </section>

        <Card className="px-4 py-1.5 text-body">
          <Linha
            rotulo="Faixa para negociar"
            valor={
              r.precoMin === null || r.precoMax === null ? (
                "-"
              ) : (
                <>
                  <span className="whitespace-nowrap">{brl(r.precoMin)}</span> a <span className="whitespace-nowrap">{brl(r.precoMax)}</span>
                </>
              )
            }
          />
          {dif && <Linha rotulo="Preço pela regra" valor={<span className="whitespace-nowrap">{brl(r.precoRegra)}</span>} />}
          <Linha rotulo={combinado ? "Valor combinado" : "Valor a cobrar"} valor={preco === null ? "-" : <span className="whitespace-nowrap">{brl(preco)}</span>} forte />
        </Card>

        <section aria-labelledby="detalhes" className="flex flex-col gap-3">
          <h2 id="detalhes" className="pt-2 font-display text-display-sm font-bold">
            A conta em detalhe
          </h2>
          <Card>
            <Accordion type="multiple">
              {detalhes.map((d) => (
                <AccordionItem key={d.id} value={d.id}>
                  <AccordionTrigger>
                    <span className="min-w-0">
                      <span className="block text-body-lg font-semibold">{d.titulo}</span>
                      <span className="numeros block text-label text-muted-foreground">{d.valor}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Relatorio blocos={d.blocos} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {aceito ? (
          <p className="text-center text-caption text-muted-foreground">Obra aceita: para editar os valores, volte a situação para rascunho.</p>
        ) : (
          <Button variant="outline" size="lg" className="w-full" onClick={onEditar}>
            <Pencil aria-hidden="true" /> Editar valores
          </Button>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-safe">
        <div className="mx-auto grid w-full max-w-content grid-cols-2 gap-2 p-3 px-gutter">
          <Button variant="outline" size="lg" className="px-2" disabled={preco === null} onClick={onCliente}>
            <Monitor aria-hidden="true" />
            <span>
              Mostrar<span className="max-[419px]:sr-only"> ao cliente</span>
            </span>
          </Button>
          <Button size="lg" className="px-2" disabled={!!exportando || preco === null} onClick={() => void exportar("proposta")}>
            {exportando === "proposta" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {exportando === "proposta" ? (
              "Gerando..."
            ) : (
              <span>
                Enviar<span className="max-[359px]:sr-only"> {orc.aceite ? "termo" : "proposta"}</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      <NegociarSheet orc={orc} aberto={negociando} onAberto={setNegociando} editar={editar} />
      <SituacaoSheet orc={orc} aberto={mudandoSituacao} onAberto={setMudandoSituacao} editar={editar} />
      <RevisarPrecosSheet orc={orc} revisar={revisar} catalogo={catalogo} aberto={revisando} onAberto={setRevisando} editar={editar} onEditarValores={onEditar} />

      <Dialog open={nomeModelo !== null} onOpenChange={(a) => !a && setNomeModelo(null)}>
        <DialogContent>
          <DialogTitle>Salvar como modelo</DialogTitle>
          <DialogDescription>Guarda dias, equipe, materiais e aluguéis para usar em obras parecidas. Cliente e valor combinado ficam de fora.</DialogDescription>
          <Campo id="nome-modelo" label="Nome do modelo">
            <Input id="nome-modelo" autoComplete="off" placeholder="Ex.: Loja pequena" value={nomeModelo ?? ""} onChange={(e) => setNomeModelo(e.target.value)} />
          </Campo>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button disabled={!nomeModelo?.trim()} onClick={() => void guardarModelo()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent>
          <DialogTitle>Excluir "{nome}"?</DialogTitle>
          <DialogDescription>Isso não pode ser desfeito.</DialogDescription>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onExcluir}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
