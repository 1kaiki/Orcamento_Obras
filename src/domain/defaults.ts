import type { Ajustes, Modelo, Orcamento } from "./types";

export const AJUSTES_PADRAO: Ajustes = {
  diariaEletricista: 250,
  diariaAjudante: 100,
  passagem: 20,
  almoco: 50,
  markupMO: 100,
  markupFerramentas: 15,
  markupMaterialCnpj: 40,
  markupMaterialDireto: 15,
  imposto: 15,
  margemMin: 15,
  margemMax: 20,
  validadeDias: 15,
  empresa: { nome: "", cnpj: "", telefone: "", logo: "" },
};

export const DIAS_PADRAO = 15;
export const DUPLAS_PADRAO = 1;
/** Material extra (aditivo): preço de mercado + 15% */
export const MARKUP_ADITIVO = 15;

export function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function novoOrcamento(ajustes: Ajustes = AJUSTES_PADRAO): Orcamento {
  const agora = Date.now();
  return {
    id: novoId(),
    criadoEm: agora,
    atualizadoEm: agora,
    obra: "",
    cliente: "",
    telefone: "",
    escopo: "",
    dias: DIAS_PADRAO,
    duplas: DUPLAS_PADRAO,
    semAjudante: false,
    diariaEletricista: ajustes.diariaEletricista,
    diariaAjudante: ajustes.diariaAjudante,
    passagem: ajustes.passagem,
    almoco: ajustes.almoco,
    formaCompra: "faturamento_direto",
    materiais: [],
    ferramentas: [],
    checklist: [],
    imposto: ajustes.imposto,
    markupMO: ajustes.markupMO,
    markupFerramentas: ajustes.markupFerramentas,
    markupMaterialCnpj: ajustes.markupMaterialCnpj,
    markupMaterialDireto: ajustes.markupMaterialDireto,
    margemMin: ajustes.margemMin,
    margemMax: ajustes.margemMax,
    situacao: "rascunho",
    enviadoEm: null,
    retornoEm: null,
    decididoEm: null,
    motivoPerda: null,
    validadeDias: ajustes.validadeDias,
    valorFechado: null,
    parcelas: [],
    aceite: null,
    diasReais: null,
    gastos: [],
    aditivos: [],
    concluidaEm: null,
  };
}

/**
 * Liga ou desliga o ajudante mudando só os valores de entrada: a fórmula de `calcular` continua a mesma.
 * Passagem e almoço são da dupla, então sem ajudante ficam pela metade. Os campos continuam editáveis.
 */
export function valoresDeEquipe(semAjudante: boolean, ajustes: Ajustes = AJUSTES_PADRAO): Pick<Orcamento, "semAjudante" | "diariaAjudante" | "passagem" | "almoco"> {
  return {
    semAjudante,
    diariaAjudante: semAjudante ? 0 : ajustes.diariaAjudante,
    passagem: semAjudante ? ajustes.passagem / 2 : ajustes.passagem,
    almoco: semAjudante ? ajustes.almoco / 2 : ajustes.almoco,
  };
}

/** Modelo usa materiais e dias da obra parecida, mas sempre os valores atuais dos Ajustes. */
export function orcamentoDeModelo(m: Modelo, ajustes: Ajustes = AJUSTES_PADRAO): Orcamento {
  return {
    ...novoOrcamento(ajustes),
    ...valoresDeEquipe(m.semAjudante, ajustes),
    escopo: m.escopo,
    dias: m.dias,
    duplas: m.duplas,
    formaCompra: m.formaCompra,
    materiais: structuredClone(m.materiais),
    ferramentas: structuredClone(m.ferramentas),
  };
}

export function modeloDeOrcamento(o: Orcamento, nome: string): Modelo {
  return {
    id: novoId(),
    nome,
    criadoEm: Date.now(),
    escopo: o.escopo,
    dias: o.dias,
    duplas: o.duplas,
    semAjudante: o.semAjudante,
    formaCompra: o.formaCompra,
    materiais: structuredClone(o.materiais),
    ferramentas: structuredClone(o.ferramentas),
  };
}

/** Caso de teste da especificação (faturamento direto). */
export function orcamentoExemplo(ajustes: Ajustes = AJUSTES_PADRAO): Orcamento {
  return {
    ...novoOrcamento(ajustes),
    obra: "Loja exemplo (caso de teste)",
    cliente: "Cliente exemplo",
    materiais: [{ descricao: "Materiais elétricos (valor total)", quantidade: 1, precoUnitario: 45000 }],
    ferramentas: [{ descricao: "Aluguel de equipamento", valor: 500 }],
  };
}
