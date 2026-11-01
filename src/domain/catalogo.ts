import { semAcentos } from "./format";
import type { ItemCatalogo, ItemMaterial, Orcamento } from "./types";

const DIA = 86_400_000;
export const DIAS_PRECO_VELHO = 30;

export const chaveMaterial = (descricao: string) => semAcentos(descricao).trim().toLowerCase().replace(/\s+/g, " ");

export function buscarNoCatalogo(catalogo: ItemCatalogo[], descricao: string): ItemCatalogo | undefined {
  const chave = chaveMaterial(descricao);
  return chave ? catalogo.find((c) => chaveMaterial(c.descricao) === chave) : undefined;
}

/**
 * Guarda os preços de uma lista no catálogo. Um preço só substitui outro se for mais novo:
 * reabrir um orçamento antigo não desfaz uma atualização.
 */
export function atualizarCatalogo(catalogo: ItemCatalogo[], materiais: ItemMaterial[], dataPadrao: number): ItemCatalogo[] {
  const saida = [...catalogo];
  for (const m of materiais) {
    if (!m.descricao.trim() || !(m.precoUnitario > 0)) continue;
    const em = m.precoEm ?? dataPadrao;
    const i = saida.findIndex((c) => chaveMaterial(c.descricao) === chaveMaterial(m.descricao));
    const item = { descricao: m.descricao.trim(), precoUnitario: m.precoUnitario, atualizadoEm: em };
    if (i < 0) saida.push(item);
    else if (em > saida[i].atualizadoEm) saida[i] = item;
  }
  return saida.sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
}

export interface PrecoParaRevisar {
  indice: number;
  descricao: string;
  atual: number;
  /** Preço mais novo do catálogo, se houver */
  novo: number | null;
  dias: number;
}

/** Materiais com preço velho, ou com preço mais novo no catálogo. */
export function precosParaRevisar(o: Orcamento, catalogo: ItemCatalogo[], agora = Date.now()): PrecoParaRevisar[] {
  const saida: PrecoParaRevisar[] = [];
  o.materiais.forEach((m, indice) => {
    if (!(m.precoUnitario > 0)) return;
    const em = m.precoEm ?? o.criadoEm;
    const dias = Math.floor((agora - em) / DIA);
    const c = buscarNoCatalogo(catalogo, m.descricao);
    const novo = c && c.atualizadoEm > em && c.precoUnitario !== m.precoUnitario ? c.precoUnitario : null;
    if (novo !== null || dias > DIAS_PRECO_VELHO) saida.push({ indice, descricao: m.descricao.trim() || "(sem descrição)", atual: m.precoUnitario, novo, dias });
  });
  return saida;
}

/** Troca pelos preços novos do catálogo. O que não tem preço novo continua como está. */
export function aplicarPrecosNovos(o: Orcamento, revisar: PrecoParaRevisar[], catalogo: ItemCatalogo[]): ItemMaterial[] {
  return o.materiais.map((m, i) => {
    const r = revisar.find((x) => x.indice === i);
    if (!r || r.novo === null) return m;
    return { ...m, precoUnitario: r.novo, precoEm: buscarNoCatalogo(catalogo, m.descricao)?.atualizadoEm };
  });
}

export function itensSemPreco(o: Pick<Orcamento, "materiais" | "ferramentas">): number {
  const usado = (d: string) => d.trim().length > 0;
  return o.materiais.filter((m) => usado(m.descricao) && !(m.precoUnitario > 0)).length + o.ferramentas.filter((f) => usado(f.descricao) && !(f.valor > 0)).length;
}
