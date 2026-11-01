export type FormaCompra = "faturamento_direto" | "meu_cnpj";

export interface ItemMaterial {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
}

export interface ItemFerramenta {
  descricao: string;
  valor: number;
}

/** Percentuais da regra, em número inteiro de % (15 = 15%). */
export interface Percentuais {
  imposto: number;
  markupMO: number;
  markupFerramentas: number;
  markupMaterialCnpj: number;
  markupMaterialDireto: number;
  margemMin: number;
  margemMax: number;
}

export interface Ajustes extends Percentuais {
  diariaEletricista: number;
  diariaAjudante: number;
  passagem: number;
  almoco: number;
}

export interface Orcamento extends Percentuais {
  id: string;
  criadoEm: number;
  atualizadoEm: number;
  obra: string;
  cliente: string;
  dias: number;
  duplas: number;
  diariaEletricista: number;
  diariaAjudante: number;
  passagem: number;
  almoco: number;
  formaCompra: FormaCompra;
  materiais: ItemMaterial[];
  ferramentas: ItemFerramenta[];
}

export type StatusMargem = "prejuizo" | "abaixo" | "dentro" | "acima";

export interface ResultadoCalculo {
  custoDuplaDia: number;
  mo: number;
  ferramentas: number;
  materiais: number;
  /** Custo total */
  A: number;
  B: number;
  C: number;
  D: number;
  markupMateriais: number;
  precoRegra: number;
  /** Imposto */
  E: number;
  resultado: number;
  margem: number;
  status: StatusMargem;
  /** Preço para a margem mínima / máxima (15% e 20% por padrão).
   *  null quando não existe preço possível (1 − imposto − m ≤ 0) */
  precoMin: number | null;
  precoMax: number | null;
  recomendado: number | null;
  /** Lucro se cobrar o recomendado */
  lucroRecomendado: number | null;
  margemRecomendada: number | null;
  impostoRecomendado: number | null;
  descontoMateriais5: number;
}
