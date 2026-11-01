export type FormaCompra = "faturamento_direto" | "meu_cnpj";

export type SituacaoOrcamento = "rascunho" | "enviado" | "aceito" | "perdido";
export type MotivoPerda = "preco" | "concorrente" | "desistiu" | "sem_resposta" | "outro";
export type CategoriaGasto = "material" | "ferramenta" | "outro";

export interface ItemMaterial {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  /** Quando o preço foi informado. Serve para avisar de preço velho; não entra na conta. */
  precoEm?: number;
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

export interface DadosEmpresa {
  nome: string;
  cnpj: string;
  telefone: string;
  /** Imagem PNG em data URL, já reduzida */
  logo: string;
}

export interface Ajustes extends Percentuais {
  diariaEletricista: number;
  diariaAjudante: number;
  passagem: number;
  almoco: number;
  validadeDias: number;
  empresa: DadosEmpresa;
}

/** Material ou serviço extra pedido durante a obra. */
export interface Aditivo {
  id: string;
  criadoEm: number;
  descricao: string;
  /** Preço de mercado, antes do acréscimo */
  custo: number;
  aprovado: boolean;
}

/** Gasto real lançado na caderneta da obra. */
export interface Gasto {
  id: string;
  criadoEm: number;
  categoria: CategoriaGasto;
  descricao: string;
  valor: number;
}

export interface Parcela {
  rotulo: string;
  percentual: number;
}

export interface Aceite {
  nome: string;
  /** Assinatura em PNG (data URL) */
  assinatura: string;
  em: number;
}

export interface Orcamento extends Percentuais {
  id: string;
  criadoEm: number;
  atualizadoEm: number;
  obra: string;
  cliente: string;
  telefone: string;
  escopo: string;
  dias: number;
  /** Duplas, ou eletricistas quando `semAjudante` */
  duplas: number;
  semAjudante: boolean;
  diariaEletricista: number;
  diariaAjudante: number;
  passagem: number;
  almoco: number;
  formaCompra: FormaCompra;
  materiais: ItemMaterial[];
  ferramentas: ItemFerramenta[];
  /** Itens marcados no checklist da visita */
  checklist: string[];

  situacao: SituacaoOrcamento;
  enviadoEm: number | null;
  retornoEm: number | null;
  decididoEm: number | null;
  motivoPerda: MotivoPerda | null;
  validadeDias: number;
  /** Valor combinado com o cliente. Nunca substitui o recomendado de `calcular`. */
  valorFechado: number | null;
  parcelas: Parcela[];
  aceite: Aceite | null;

  diasReais: number | null;
  gastos: Gasto[];
  aditivos: Aditivo[];
  concluidaEm: number | null;
}

/** Ponto de partida salvo a partir de uma obra parecida. */
export interface Modelo {
  id: string;
  nome: string;
  criadoEm: number;
  escopo: string;
  dias: number;
  duplas: number;
  semAjudante: boolean;
  formaCompra: FormaCompra;
  materiais: ItemMaterial[];
  ferramentas: ItemFerramenta[];
}

export interface ItemCatalogo {
  descricao: string;
  precoUnitario: number;
  atualizadoEm: number;
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
