import { MARKUP_ADITIVO } from "./defaults";
import { dataBR, numero } from "./format";
import { validaAte } from "./funil";
import { valorDaObra } from "./negociacao";
import { planoDeCaixa } from "./pagamento";
import type { Aceite, DadosEmpresa, Orcamento } from "./types";

export interface Proposta {
  empresa: DadosEmpresa;
  obra: string;
  cliente: string;
  data: string;
  validaAte: string;
  escopo: string;
  prazo: string;
  /** null quando não há preço possível */
  valor: number | null;
  materiais: { descricao: string; quantidade: string }[];
  materialDireto: number;
  parcelas: { rotulo: string; percentual: number; valor: number }[];
  condicoes: string[];
  aceite: Aceite | null;
}

/**
 * O que o cliente pode ver. Tudo o que vai para a proposta, para a tela do cliente e para o aceite sai daqui.
 * Custo, imposto, lucro, margem e preço de cada material ficam de fora.
 */
export function dadosProposta(o: Orcamento, empresa: DadosEmpresa, agora = Date.now()): Proposta {
  const plano = planoDeCaixa(o);
  const direto = o.formaCompra === "faturamento_direto";
  const materiais = o.materiais
    .filter((m) => m.descricao.trim())
    .map((m) => ({ descricao: m.descricao.trim(), quantidade: numero(m.quantidade).replace(/,00$/, "") }));

  const condicoes = [
    "Esta proposta contempla somente os serviços e materiais listados aqui.",
    `Material extra será cobrado a preço de mercado + ${MARKUP_ADITIVO}%, com aprovação antes da compra.`,
    "Serviço fora deste escopo será orçado à parte e só começa depois de aprovado.",
    direto ? "Os materiais serão faturados diretamente no CNPJ do contratante." : "Os materiais serão comprados e fornecidos pelo contratado.",
  ];

  return {
    empresa,
    obra: o.obra.trim() || "Sem nome",
    cliente: o.cliente.trim(),
    data: dataBR(o.enviadoEm ?? agora),
    validaAte: dataBR(validaAte(o, agora)),
    escopo: o.escopo.trim(),
    prazo: `${o.dias} ${o.dias === 1 ? "dia" : "dias"} de serviço`,
    valor: valorDaObra(o),
    materiais,
    materialDireto: plano.materialDireto,
    parcelas: plano.etapas.map((e) => ({ rotulo: e.rotulo, percentual: e.percentual, valor: e.recebe })),
    condicoes,
    aceite: o.aceite,
  };
}
