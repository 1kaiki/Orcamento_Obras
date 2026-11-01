import type { Ajustes, Orcamento } from "./types";

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
    dias: DIAS_PADRAO,
    duplas: DUPLAS_PADRAO,
    diariaEletricista: ajustes.diariaEletricista,
    diariaAjudante: ajustes.diariaAjudante,
    passagem: ajustes.passagem,
    almoco: ajustes.almoco,
    formaCompra: "faturamento_direto",
    materiais: [],
    ferramentas: [],
    imposto: ajustes.imposto,
    markupMO: ajustes.markupMO,
    markupFerramentas: ajustes.markupFerramentas,
    markupMaterialCnpj: ajustes.markupMaterialCnpj,
    markupMaterialDireto: ajustes.markupMaterialDireto,
    margemMin: ajustes.margemMin,
    margemMax: ajustes.margemMax,
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
