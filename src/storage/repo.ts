import { del, entries, get, set } from "idb-keyval";
import { AJUSTES_PADRAO, novoId, novoOrcamento } from "../domain/defaults";
import type { Ajustes, Orcamento } from "../domain/types";

const PREFIXO = "orc:";
const CHAVE_AJUSTES = "ajustes";

const num = (v: unknown, padrao: number): number => (typeof v === "number" && isFinite(v) ? v : padrao);
const txt = (v: unknown): string => (typeof v === "string" ? v : "");

/** Completa campos que faltam (backup antigo ou arquivo editado à mão). */
export function normalizarOrcamento(raw: unknown): Orcamento {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const base = novoOrcamento();
  const lista = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  return {
    id: txt(r.id) || novoId(),
    criadoEm: num(r.criadoEm, base.criadoEm),
    atualizadoEm: num(r.atualizadoEm, base.atualizadoEm),
    obra: txt(r.obra),
    cliente: txt(r.cliente),
    dias: num(r.dias, base.dias),
    duplas: num(r.duplas, base.duplas),
    diariaEletricista: num(r.diariaEletricista, base.diariaEletricista),
    diariaAjudante: num(r.diariaAjudante, base.diariaAjudante),
    passagem: num(r.passagem, base.passagem),
    almoco: num(r.almoco, base.almoco),
    formaCompra: r.formaCompra === "meu_cnpj" ? "meu_cnpj" : "faturamento_direto",
    materiais: lista(r.materiais).map((m) => ({
      descricao: txt(m.descricao),
      quantidade: num(m.quantidade, 1),
      precoUnitario: num(m.precoUnitario, 0),
    })),
    ferramentas: lista(r.ferramentas).map((f) => ({ descricao: txt(f.descricao), valor: num(f.valor, 0) })),
    imposto: num(r.imposto, base.imposto),
    markupMO: num(r.markupMO, base.markupMO),
    markupFerramentas: num(r.markupFerramentas, base.markupFerramentas),
    markupMaterialCnpj: num(r.markupMaterialCnpj, base.markupMaterialCnpj),
    markupMaterialDireto: num(r.markupMaterialDireto, base.markupMaterialDireto),
    margemMin: num(r.margemMin, base.margemMin),
    margemMax: num(r.margemMax, base.margemMax),
  };
}

export function normalizarAjustes(raw: unknown): Ajustes {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = { ...AJUSTES_PADRAO };
  for (const k of Object.keys(out) as (keyof Ajustes)[]) out[k] = num(r[k], out[k]);
  return out;
}

export async function listarOrcamentos(): Promise<Orcamento[]> {
  const todos = await entries();
  return todos
    .filter(([k]) => typeof k === "string" && k.startsWith(PREFIXO))
    .map(([, v]) => normalizarOrcamento(v))
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}

export async function obterOrcamento(id: string): Promise<Orcamento | undefined> {
  const v = await get(PREFIXO + id);
  return v ? normalizarOrcamento(v) : undefined;
}

export async function salvarOrcamento(o: Orcamento): Promise<Orcamento> {
  const salvo = { ...o, atualizadoEm: Date.now() };
  await set(PREFIXO + salvo.id, salvo);
  return salvo;
}

export async function excluirOrcamento(id: string): Promise<void> {
  await del(PREFIXO + id);
}

export async function duplicarOrcamento(id: string): Promise<Orcamento | undefined> {
  const original = await obterOrcamento(id);
  if (!original) return undefined;
  const agora = Date.now();
  const copia: Orcamento = {
    ...structuredClone(original),
    id: novoId(),
    obra: `${original.obra.trim() || "Sem nome"} (cópia)`,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  await set(PREFIXO + copia.id, copia);
  return copia;
}

export async function lerAjustes(): Promise<Ajustes> {
  return normalizarAjustes(await get(CHAVE_AJUSTES));
}

export async function salvarAjustes(a: Ajustes): Promise<void> {
  await set(CHAVE_AJUSTES, a);
}

export async function restaurarAjustesPadrao(): Promise<Ajustes> {
  await del(CHAVE_AJUSTES);
  return { ...AJUSTES_PADRAO };
}

interface Backup {
  app: "orca-obra";
  versao: 1;
  exportadoEm: number;
  ajustes: Ajustes;
  orcamentos: Orcamento[];
}

export async function gerarBackup(): Promise<Blob> {
  const dados: Backup = {
    app: "orca-obra",
    versao: 1,
    exportadoEm: Date.now(),
    ajustes: await lerAjustes(),
    orcamentos: await listarOrcamentos(),
  };
  return new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
}

/** Importa um backup. Orçamentos com o mesmo id são substituídos. Devolve quantos entraram. */
export async function importarBackup(texto: string): Promise<number> {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error("Esse arquivo não é um backup válido.");
  }
  const d = dados as Partial<Backup>;
  if (!d || d.app !== "orca-obra" || !Array.isArray(d.orcamentos)) {
    throw new Error("Esse arquivo não é um backup do Orça Obra.");
  }
  if (d.ajustes) await salvarAjustes(normalizarAjustes(d.ajustes));
  for (const raw of d.orcamentos) {
    const o = normalizarOrcamento(raw);
    await set(PREFIXO + o.id, o);
  }
  return d.orcamentos.length;
}
