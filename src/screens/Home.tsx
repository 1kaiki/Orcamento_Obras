import { ChevronRight, FilePlus2, MessageCircle, Plus, Settings, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import Dinheiro from "@/components/Dinheiro";
import QuadroVazio from "@/components/QuadroVazio";
import StatusChip from "@/components/StatusChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl, dataBR, pct } from "@/domain/format";
import { diasDesde, estatisticas, NOME_MOTIVO, NOME_SITUACAO, precisaRetorno } from "@/domain/funil";
import { linkWhatsApp, mensagemRetorno } from "@/domain/mensagens";
import { simularPreco, valorDaObra } from "@/domain/negociacao";
import { calcular } from "@/domain/pricing";
import { lucroOuPrejuizo } from "@/domain/report";
import type { DadosEmpresa, Modelo, Orcamento, SituacaoOrcamento } from "@/domain/types";
import { cn } from "@/lib/utils";
import { listarModelos, listarOrcamentos, salvarOrcamento } from "@/storage/repo";

interface Props {
  empresa: DadosEmpresa;
  onNovo: () => void;
  onNovoDeModelo: (m: Modelo) => void;
  onExemplo: () => void;
  onAbrir: (o: Orcamento) => void;
  onAjustes: () => void;
}

type Filtro = "todos" | "abertos" | "aceito" | "perdido";

const VARIANTE_SITUACAO: Record<SituacaoOrcamento, "neutral" | "warning" | "success" | "danger"> = {
  rascunho: "neutral",
  enviado: "warning",
  aceito: "success",
  perdido: "danger",
};

function saudacao(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

function Resumo({ lista }: { lista: Orcamento[] }) {
  const e = estatisticas(lista);
  const mes = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const decididos = e.aceitos + e.perdidos;
  return (
    <section aria-label="Resumo" className="rounded-xl bg-panel p-5 text-panel-foreground">
      <div className="text-label text-panel-muted">Fechado em {mes}</div>
      {/* Dinheiro nunca é cortado: totais grandes usam um tamanho menor da escala. */}
      <div className={cn("mt-1 whitespace-nowrap font-display font-extrabold text-primary", brl(e.fechadoNoMes).length > 13 ? "text-display-lg" : "text-display-xl")}>
        <Dinheiro texto={brl(e.fechadoNoMes)} prefixoMenor />
      </div>
      <dl className="numeros mt-3 flex flex-col gap-1 border-t border-panel-border pt-3 text-label">
        <div className="flex justify-between gap-3">
          <dt className="text-panel-muted">Em negociação</dt>
          <dd className="font-semibold">{brl(e.emNegociacao)}</dd>
        </div>
        {e.taxaFechamento !== null && (
          <div className="flex justify-between gap-3">
            <dt className="text-panel-muted">Taxa de fechamento</dt>
            <dd className="font-semibold">
              {pct(e.taxaFechamento, 0)} ({e.aceitos} de {decididos})
            </dd>
          </div>
        )}
        {e.motivoMaisComum && (
          <div className="flex justify-between gap-3">
            <dt className="text-panel-muted">Perde mais por</dt>
            <dd className="font-semibold">{NOME_MOTIVO[e.motivoMaisComum]}</dd>
          </div>
        )}
        {e.lucroRealConcluidas !== null && (
          <div className="flex justify-between gap-3">
            <dt className="text-panel-muted">Obras concluídas</dt>
            <dd className="font-semibold">{lucroOuPrejuizo(e.lucroRealConcluidas)}</dd>
          </div>
        )}
        {e.desvioDias !== null && Math.abs(e.desvioDias) >= 0.05 && (
          <div className="flex justify-between gap-3">
            <dt className="text-panel-muted">Dias de obra</dt>
            <dd className="font-semibold">
              {pct(Math.abs(e.desvioDias), 0)} {e.desvioDias > 0 ? "a mais" : "a menos"} que o previsto
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function CardOrcamento({ o, onAbrir }: { o: Orcamento; onAbrir: () => void }) {
  const r = calcular(o);
  const preco = valorDaObra(o);
  const s = preco === null ? null : simularPreco(o, preco);
  return (
    <button type="button" onClick={onAbrir} className="block w-full rounded-lg text-left transition-transform duration-fast active:scale-[0.98]">
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 break-words text-body-lg font-semibold">{o.obra.trim() || "Sem nome"}</span>
          <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="font-display text-display-md font-extrabold">{preco === null ? "Sem preço possível" : <Dinheiro texto={brl(preco)} />}</div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex flex-wrap items-center gap-1">
            <Badge variant={VARIANTE_SITUACAO[o.situacao]}>{NOME_SITUACAO[o.situacao]}</Badge>
            {/* A margem é a do valor mostrado no cartão, não a do preço pela regra. */}
            <StatusChip status={s?.status ?? r.status} texto={`Margem ${pct(s?.margem ?? r.margem)}`} />
          </span>
          <span className="numeros min-w-0 truncate text-caption text-muted-foreground">
            {o.cliente.trim() ? `${o.cliente.trim()}, ` : ""}
            {dataBR(o.atualizadoEm)}
          </span>
        </div>
      </Card>
    </button>
  );
}

export default function Home({ empresa, onNovo, onNovoDeModelo, onExemplo, onAbrir, onAjustes }: Props) {
  const [lista, setLista] = useState<Orcamento[] | null>(null);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [escolhendo, setEscolhendo] = useState(false);

  useEffect(() => {
    let vivo = true;
    listarOrcamentos().then((l) => vivo && setLista(l));
    listarModelos().then((m) => vivo && setModelos(m));
    return () => {
      vivo = false;
    };
  }, []);

  const semResposta = (lista ?? []).filter((o) => precisaRetorno(o));
  const filtrados = (lista ?? []).filter((o) => {
    if (filtro === "abertos") return o.situacao === "rascunho" || o.situacao === "enviado";
    return filtro === "todos" || o.situacao === filtro;
  });

  async function registrarRetorno(o: Orcamento) {
    const salvo = await salvarOrcamento({ ...o, retornoEm: Date.now() });
    setLista((l) => l?.map((x) => (x.id === salvo.id ? salvo : x)) ?? l);
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-content flex-col gap-section px-gutter pb-bar pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <header className="flex flex-col gap-3">
          <div className="-mr-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-label font-bold">
              <Zap className="size-5 fill-primary stroke-foreground" aria-hidden="true" />
              Orça Obra
            </span>
            <Button variant="ghost" size="icon" aria-label="Ajustes" onClick={onAjustes}>
              <Settings aria-hidden="true" />
            </Button>
          </div>
          <div>
            <h1 className="font-display text-display-xl font-extrabold">{saudacao()}</h1>
            <p className="mt-1 text-body-lg text-muted-foreground">Quanto cobrar nessa obra?</p>
          </div>
        </header>

        {lista !== null && lista.length === 0 && (
          <Card className="flex flex-col items-center gap-4 p-6 text-center">
            <QuadroVazio />
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-display-md font-bold">Nenhum orçamento ainda</h2>
              <p className="text-body text-muted-foreground">Responda 4 passos e veja o valor com a conta explicada. Quer ver como fica antes?</p>
            </div>
            <Button variant="outline" onClick={onExemplo}>
              Ver exemplo
            </Button>
          </Card>
        )}

        {lista !== null && lista.length > 0 && (
          <>
            <Resumo lista={lista} />

            {semResposta.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="font-display text-display-sm font-bold">Cobrar resposta</h2>
                {semResposta.map((o) => (
                  <Card key={o.id} className="flex items-center justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{o.obra.trim() || "Sem nome"}</span>
                      <span className="block text-caption text-muted-foreground">
                        Sem resposta há {diasDesde(Math.max(o.enviadoEm ?? 0, o.retornoEm ?? 0))} dias
                      </span>
                    </span>
                    <Button variant="secondary" className="shrink-0" asChild>
                      <a href={linkWhatsApp(o.telefone, mensagemRetorno(o, empresa))} target="_blank" rel="noopener noreferrer" onClick={() => void registrarRetorno(o)}>
                        <MessageCircle aria-hidden="true" /> Chamar
                      </a>
                    </Button>
                  </Card>
                ))}
              </section>
            )}

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-display-sm font-bold">Meus orçamentos</h2>
              <Tabs value={filtro} onValueChange={(f) => setFiltro(f as Filtro)}>
                <TabsList aria-label="Filtrar orçamentos">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="abertos">Abertos</TabsTrigger>
                  <TabsTrigger value="aceito">Aceitos</TabsTrigger>
                  <TabsTrigger value="perdido">Perdidos</TabsTrigger>
                </TabsList>
              </Tabs>
              {filtrados.map((o) => (
                <CardOrcamento key={o.id} o={o} onAbrir={() => onAbrir(o)} />
              ))}
              {filtrados.length === 0 && <p className="py-4 text-center text-body text-muted-foreground">Nenhum orçamento aqui.</p>}
            </section>
          </>
        )}

        <p className="text-center text-caption text-muted-foreground">Tudo fica salvo neste aparelho e funciona sem internet.</p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-safe">
        <div className="mx-auto w-full max-w-content p-3 px-gutter">
          <Button size="lg" className="w-full" onClick={() => (modelos.length ? setEscolhendo(true) : onNovo())}>
            <Plus aria-hidden="true" /> Novo orçamento
          </Button>
        </div>
      </div>

      <Sheet open={escolhendo} onOpenChange={setEscolhendo}>
        <SheetContent>
          <SheetTitle>Como começar?</SheetTitle>
          <SheetDescription>O modelo traz dias e materiais; os valores de mão de obra vêm dos Ajustes atuais.</SheetDescription>
          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full justify-start" onClick={onNovo}>
              <Plus aria-hidden="true" /> Em branco
            </Button>
            {modelos.map((m) => (
              <Button key={m.id} variant="secondary" size="lg" className="w-full justify-start" onClick={() => onNovoDeModelo(m)}>
                <FilePlus2 aria-hidden="true" /> <span className="truncate">{m.nome}</span>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
