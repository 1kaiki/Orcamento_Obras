import { valorDaObra } from "./negociacao";
import { calcular } from "./pricing";
import { resumoObra } from "./obra";
import type { MotivoPerda, Orcamento, SituacaoOrcamento } from "./types";

const DIA = 86_400_000;
export const DIAS_PARA_RETORNO = 3;

export const NOME_SITUACAO: Record<SituacaoOrcamento, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  perdido: "Perdido",
};

export const NOME_MOTIVO: Record<MotivoPerda, string> = {
  preco: "Achou caro",
  concorrente: "Fechou com outro",
  desistiu: "Desistiu da obra",
  sem_resposta: "Não respondeu",
  outro: "Outro motivo",
};

export const diasDesde = (ts: number, agora = Date.now()) => Math.floor((agora - ts) / DIA);

/**
 * Mudança de situação, com as datas de cada uma. O aceite congela o valor: editar custos depois não muda o combinado.
 * Sair de "aceito" apaga a assinatura: o orçamento pode mudar e ela só vale para o que foi assinado.
 */
export function mudarSituacao(o: Orcamento, nova: SituacaoOrcamento, motivo: MotivoPerda | null = null, agora = Date.now()): Partial<Orcamento> {
  switch (nova) {
    case "rascunho":
      return { situacao: nova, enviadoEm: null, retornoEm: null, decididoEm: null, motivoPerda: null, aceite: null };
    case "enviado":
      return { situacao: nova, enviadoEm: o.enviadoEm ?? agora, decididoEm: null, motivoPerda: null, aceite: null };
    case "aceito":
      return { situacao: nova, enviadoEm: o.enviadoEm ?? agora, decididoEm: o.decididoEm ?? agora, motivoPerda: null, valorFechado: o.valorFechado ?? calcular(o).recomendado };
    case "perdido":
      return { situacao: nova, decididoEm: agora, motivoPerda: motivo ?? "outro", aceite: null };
  }
}

export function validaAte(o: Orcamento, agora = Date.now()): number {
  return (o.enviadoEm ?? agora) + o.validadeDias * DIA;
}

export const propostaVencida = (o: Orcamento, agora = Date.now()) => o.situacao === "enviado" && agora > validaAte(o, agora);

/** Enviado e sem contato há alguns dias. */
export function precisaRetorno(o: Orcamento, agora = Date.now()): boolean {
  if (o.situacao !== "enviado" || o.enviadoEm === null) return false;
  return diasDesde(Math.max(o.enviadoEm, o.retornoEm ?? 0), agora) >= DIAS_PARA_RETORNO;
}

export interface Estatisticas {
  fechadoNoMes: number;
  emNegociacao: number;
  aceitos: number;
  perdidos: number;
  /** Fração das decididas que foram aceitas; null sem nenhuma decidida */
  taxaFechamento: number | null;
  motivoMaisComum: MotivoPerda | null;
  /** Dias reais ÷ previstos − 1, nas obras concluídas; null sem dados */
  desvioDias: number | null;
  lucroRealConcluidas: number | null;
}

export function estatisticas(lista: Orcamento[], agora = Date.now()): Estatisticas {
  const hoje = new Date(agora);
  const noMes = (ts: number | null) => {
    if (ts === null) return false;
    const d = new Date(ts);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  };
  const aceitos = lista.filter((o) => o.situacao === "aceito");
  const perdidos = lista.filter((o) => o.situacao === "perdido");
  const decididos = aceitos.length + perdidos.length;

  const contagem = new Map<MotivoPerda, number>();
  for (const o of perdidos) if (o.motivoPerda) contagem.set(o.motivoPerda, (contagem.get(o.motivoPerda) ?? 0) + 1);
  const motivoMaisComum = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const concluidas = aceitos.filter((o) => o.concluidaEm !== null);
  const comDias = concluidas.filter((o) => o.diasReais !== null && o.dias > 0);
  const previstos = comDias.reduce((s, o) => s + o.dias, 0);
  const reais = comDias.reduce((s, o) => s + (o.diasReais as number), 0);

  return {
    fechadoNoMes: aceitos.filter((o) => noMes(o.decididoEm)).reduce((s, o) => s + (valorDaObra(o) ?? 0), 0),
    emNegociacao: lista.filter((o) => o.situacao === "enviado").reduce((s, o) => s + (valorDaObra(o) ?? 0), 0),
    aceitos: aceitos.length,
    perdidos: perdidos.length,
    taxaFechamento: decididos ? aceitos.length / decididos : null,
    motivoMaisComum,
    desvioDias: previstos ? reais / previstos - 1 : null,
    lucroRealConcluidas: concluidas.length ? concluidas.reduce((s, o) => s + resumoObra(o).lucroReal, 0) : null,
  };
}
