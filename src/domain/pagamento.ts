import { simularPreco, valorDaObra } from "./negociacao";
import { calcular } from "./pricing";
import type { Orcamento, Parcela } from "./types";

export const PLANOS: { nome: string; parcelas: Parcela[] }[] = [
  {
    nome: "30 / 40 / 30",
    parcelas: [
      { rotulo: "Entrada", percentual: 30 },
      { rotulo: "No meio da obra", percentual: 40 },
      { rotulo: "Na entrega", percentual: 30 },
    ],
  },
  {
    nome: "50 / 50",
    parcelas: [
      { rotulo: "Entrada", percentual: 50 },
      { rotulo: "Na entrega", percentual: 50 },
    ],
  },
  {
    nome: "40 / 30 / 30",
    parcelas: [
      { rotulo: "Entrada", percentual: 40 },
      { rotulo: "No meio da obra", percentual: 30 },
      { rotulo: "Na entrega", percentual: 30 },
    ],
  },
];

export interface EtapaCaixa {
  rotulo: string;
  percentual: number;
  recebe: number;
  imposto: number;
  gasta: number;
  saldo: number;
}

export interface PlanoCaixa {
  valor: number;
  /** Faturamento direto: o cliente paga esse material na loja, fora das parcelas */
  materialDireto: number;
  aReceber: number;
  etapas: EtapaCaixa[];
  somaPercentuais: number;
  /** Maior valor que ele precisa ter no bolso em algum momento da obra */
  tiraDoBolso: number;
  lucro: number;
}

/**
 * Quando o dinheiro entra e sai. No fim, o saldo é igual ao lucro.
 * Material no meu CNPJ e aluguel saem logo na primeira etapa; a mão de obra se divide igualmente entre as etapas.
 */
export function planoDeCaixa(o: Orcamento, parcelas: Parcela[] = o.parcelas): PlanoCaixa {
  const r = calcular(o);
  const valor = valorDaObra(o) ?? 0;
  const s = simularPreco(o, valor);
  const direto = o.formaCompra === "faturamento_direto";
  const materialDireto = direto ? Math.min(r.materiais, valor) : 0;
  const aReceber = valor - materialDireto;
  const n = parcelas.length;
  const moEtapa = n ? r.mo / n : 0;
  const inicial = (direto ? 0 : r.materiais) + r.ferramentas;

  let saldo = 0;
  let menor = 0;
  const etapas = parcelas.map((p, i) => {
    const recebe = (aReceber * p.percentual) / 100;
    const imposto = (s.imposto * p.percentual) / 100;
    const gasta = moEtapa + (i === 0 ? inicial : 0);
    // Dentro da etapa, o dinheiro entra antes de sair (a entrada paga a compra).
    saldo += recebe - imposto - gasta;
    menor = Math.min(menor, saldo);
    return { rotulo: p.rotulo, percentual: p.percentual, recebe, imposto, gasta, saldo };
  });

  return {
    valor,
    materialDireto,
    aReceber,
    etapas,
    somaPercentuais: parcelas.reduce((t, p) => t + (p.percentual || 0), 0),
    tiraDoBolso: -menor,
    lucro: s.lucro,
  };
}
