import { del, entries, get, set } from "idb-keyval";
import { atualizarCatalogo } from "../domain/catalogo";
import { AJUSTES_PADRAO, novoId, novoOrcamento } from "../domain/defaults";
import type { Ajustes, CategoriaGasto, ItemCatalogo, ItemFerramenta, ItemMaterial, Modelo, MotivoPerda, Orcamento, SituacaoOrcamento } from "../domain/types";

const PREFIXO = "orc:";
const PREFIXO_MODELO = "mod:";
const CHAVE_AJUSTES = "ajustes";
const CHAVE_CATALOGO = "catalogo";

const num = (v: unknown, padrao: number): number => (typeof v === "number" && isFinite(v) ? v : padrao);
const numOuNulo = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);
const txt = (v: unknown): string => (typeof v === "string" ? v : "");
const lista = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

const SITUACOES: SituacaoOrcamento[] = ["rascunho", "enviado", "aceito", "perdido"];
const MOTIVOS: MotivoPerda[] = ["preco", "concorrente", "desistiu", "sem_resposta", "outro"];
const CATEGORIAS: CategoriaGasto[] = ["material", "ferramenta", "outro"];

function normalizarMateriais(v: unknown): ItemMaterial[] {
  return lista(v).map((m) => {
    const item: ItemMaterial = { descricao: txt(m.descricao), quantidade: num(m.quantidade, 1), precoUnitario: num(m.precoUnitario, 0) };
    const em = numOuNulo(m.precoEm);
    if (em !== null) item.precoEm = em;
    return item;
  });
}

function normalizarFerramentas(v: unknown): ItemFerramenta[] {
  return lista(v).map((f) => ({ descricao: txt(f.descricao), valor: num(f.valor, 0) }));
}

/** Completa campos que faltam (backup antigo ou arquivo editado à mão). */
export function normalizarOrcamento(raw: unknown): Orcamento {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const base = novoOrcamento();
  const aceite = r.aceite && typeof r.aceite === "object" ? (r.aceite as Record<string, unknown>) : null;
  return {
    id: txt(r.id) || novoId(),
    criadoEm: num(r.criadoEm, base.criadoEm),
    atualizadoEm: num(r.atualizadoEm, base.atualizadoEm),
    obra: txt(r.obra),
    cliente: txt(r.cliente),
    telefone: txt(r.telefone),
    escopo: txt(r.escopo),
    dias: num(r.dias, base.dias),
    duplas: num(r.duplas, base.duplas),
    semAjudante: r.semAjudante === true,
    diariaEletricista: num(r.diariaEletricista, base.diariaEletricista),
    diariaAjudante: num(r.diariaAjudante, base.diariaAjudante),
    passagem: num(r.passagem, base.passagem),
    almoco: num(r.almoco, base.almoco),
    formaCompra: r.formaCompra === "meu_cnpj" ? "meu_cnpj" : "faturamento_direto",
    materiais: normalizarMateriais(r.materiais),
    ferramentas: normalizarFerramentas(r.ferramentas),
    checklist: Array.isArray(r.checklist) ? r.checklist.filter((c): c is string => typeof c === "string") : [],
    imposto: num(r.imposto, base.imposto),
    markupMO: num(r.markupMO, base.markupMO),
    markupFerramentas: num(r.markupFerramentas, base.markupFerramentas),
    markupMaterialCnpj: num(r.markupMaterialCnpj, base.markupMaterialCnpj),
    markupMaterialDireto: num(r.markupMaterialDireto, base.markupMaterialDireto),
    margemMin: num(r.margemMin, base.margemMin),
    margemMax: num(r.margemMax, base.margemMax),
    situacao: SITUACOES.includes(r.situacao as SituacaoOrcamento) ? (r.situacao as SituacaoOrcamento) : "rascunho",
    enviadoEm: numOuNulo(r.enviadoEm),
    retornoEm: numOuNulo(r.retornoEm),
    decididoEm: numOuNulo(r.decididoEm),
    motivoPerda: MOTIVOS.includes(r.motivoPerda as MotivoPerda) ? (r.motivoPerda as MotivoPerda) : null,
    validadeDias: num(r.validadeDias, base.validadeDias),
    valorFechado: numOuNulo(r.valorFechado),
    parcelas: lista(r.parcelas).map((p) => ({ rotulo: txt(p.rotulo), percentual: num(p.percentual, 0) })),
    aceite: aceite && txt(aceite.assinatura) ? { nome: txt(aceite.nome), assinatura: txt(aceite.assinatura), em: num(aceite.em, base.criadoEm) } : null,
    diasReais: numOuNulo(r.diasReais),
    gastos: lista(r.gastos).map((g) => ({
      id: txt(g.id) || novoId(),
      criadoEm: num(g.criadoEm, base.criadoEm),
      categoria: CATEGORIAS.includes(g.categoria as CategoriaGasto) ? (g.categoria as CategoriaGasto) : "outro",
      descricao: txt(g.descricao),
      valor: num(g.valor, 0),
    })),
    aditivos: lista(r.aditivos).map((a) => ({
      id: txt(a.id) || novoId(),
      criadoEm: num(a.criadoEm, base.criadoEm),
      descricao: txt(a.descricao),
      custo: num(a.custo, 0),
      aprovado: a.aprovado === true,
    })),
    concluidaEm: numOuNulo(r.concluidaEm),
  };
}

export function normalizarAjustes(raw: unknown): Ajustes {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const e = (r.empresa && typeof r.empresa === "object" ? r.empresa : {}) as Record<string, unknown>;
  const p = AJUSTES_PADRAO;
  return {
    diariaEletricista: num(r.diariaEletricista, p.diariaEletricista),
    diariaAjudante: num(r.diariaAjudante, p.diariaAjudante),
    passagem: num(r.passagem, p.passagem),
    almoco: num(r.almoco, p.almoco),
    markupMO: num(r.markupMO, p.markupMO),
    markupFerramentas: num(r.markupFerramentas, p.markupFerramentas),
    markupMaterialCnpj: num(r.markupMaterialCnpj, p.markupMaterialCnpj),
    markupMaterialDireto: num(r.markupMaterialDireto, p.markupMaterialDireto),
    imposto: num(r.imposto, p.imposto),
    margemMin: num(r.margemMin, p.margemMin),
    margemMax: num(r.margemMax, p.margemMax),
    validadeDias: num(r.validadeDias, p.validadeDias),
    empresa: { nome: txt(e.nome), cnpj: txt(e.cnpj), telefone: txt(e.telefone), logo: txt(e.logo) },
  };
}

function normalizarModelo(raw: unknown): Modelo {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const base = novoOrcamento();
  return {
    id: txt(r.id) || novoId(),
    nome: txt(r.nome) || "Modelo",
    criadoEm: num(r.criadoEm, base.criadoEm),
    escopo: txt(r.escopo),
    dias: num(r.dias, base.dias),
    duplas: num(r.duplas, base.duplas),
    semAjudante: r.semAjudante === true,
    formaCompra: r.formaCompra === "meu_cnpj" ? "meu_cnpj" : "faturamento_direto",
    materiais: normalizarMateriais(r.materiais),
    ferramentas: normalizarFerramentas(r.ferramentas),
  };
}

function normalizarCatalogo(raw: unknown): ItemCatalogo[] {
  return lista(raw).map((c) => ({ descricao: txt(c.descricao), precoUnitario: num(c.precoUnitario, 0), atualizadoEm: num(c.atualizadoEm, 0) }));
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

/** A cópia é um orçamento novo: aproveita a conta, mas não a negociação nem o andamento da obra original. */
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
    situacao: "rascunho",
    enviadoEm: null,
    retornoEm: null,
    decididoEm: null,
    motivoPerda: null,
    valorFechado: null,
    aceite: null,
    diasReais: null,
    gastos: [],
    aditivos: [],
    concluidaEm: null,
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

/** Volta a regra aos padrões. Os dados da empresa e a validade não fazem parte da regra e continuam. */
export async function restaurarAjustesPadrao(): Promise<Ajustes> {
  const atuais = await lerAjustes();
  const novos = { ...AJUSTES_PADRAO, empresa: atuais.empresa, validadeDias: atuais.validadeDias };
  await set(CHAVE_AJUSTES, novos);
  return novos;
}

export async function listarModelos(): Promise<Modelo[]> {
  const todos = await entries();
  return todos
    .filter(([k]) => typeof k === "string" && k.startsWith(PREFIXO_MODELO))
    .map(([, v]) => normalizarModelo(v))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function salvarModelo(m: Modelo): Promise<void> {
  await set(PREFIXO_MODELO + m.id, m);
}

export async function excluirModelo(id: string): Promise<void> {
  await del(PREFIXO_MODELO + id);
}

export async function lerCatalogo(): Promise<ItemCatalogo[]> {
  return normalizarCatalogo(await get(CHAVE_CATALOGO));
}

export async function salvarCatalogo(c: ItemCatalogo[]): Promise<void> {
  await set(CHAVE_CATALOGO, c);
}

export async function guardarNoCatalogo(o: Orcamento): Promise<ItemCatalogo[]> {
  const novo = atualizarCatalogo(await lerCatalogo(), o.materiais, o.criadoEm);
  await salvarCatalogo(novo);
  return novo;
}

interface Backup {
  app: "orca-obra";
  versao: 1 | 2;
  exportadoEm: number;
  ajustes: Ajustes;
  orcamentos: Orcamento[];
  modelos?: Modelo[];
  catalogo?: ItemCatalogo[];
}

export async function gerarBackup(): Promise<Blob> {
  const dados: Backup = {
    app: "orca-obra",
    versao: 2,
    exportadoEm: Date.now(),
    ajustes: await lerAjustes(),
    orcamentos: await listarOrcamentos(),
    modelos: await listarModelos(),
    catalogo: await lerCatalogo(),
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
  for (const raw of Array.isArray(d.modelos) ? d.modelos : []) {
    const m = normalizarModelo(raw);
    await set(PREFIXO_MODELO + m.id, m);
  }
  if (Array.isArray(d.catalogo)) await salvarCatalogo(normalizarCatalogo(d.catalogo));
  return d.orcamentos.length;
}
