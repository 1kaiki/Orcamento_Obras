import { calcular, precoParaMargem, statusDaMargem } from "./pricing";
import type { Orcamento, StatusMargem } from "./types";

export interface Simulacao {
  preco: number;
  imposto: number;
  lucro: number;
  margem: number;
  status: StatusMargem;
}

/** O que sobra cobrando um preço qualquer, com o mesmo custo A e o mesmo imposto de `calcular`. */
export function simularPreco(o: Orcamento, preco: number): Simulacao {
  const { A } = calcular(o);
  const imposto = (preco * o.imposto) / 100;
  const lucro = preco - A - imposto;
  const margem = preco === 0 ? 0 : lucro / preco;
  return { preco, imposto, lucro, margem, status: statusDaMargem(margem, o.margemMin / 100, o.margemMax / 100) };
}

/** Menor preço sem prejuízo: paga o custo e o imposto e o lucro fica zero. */
export function pisoSemPrejuizo(o: Orcamento): number | null {
  return precoParaMargem(calcular(o).A, o.imposto / 100, 0);
}

/** Valor combinado com o cliente ou, se ainda não houver, o recomendado. */
export function valorDaObra(o: Orcamento): number | null {
  return o.valorFechado ?? calcular(o).recomendado;
}

export const AVISO_SIMULACAO: Record<StatusMargem, string> = {
  prejuizo: "Prejuízo: você pagaria para trabalhar.",
  abaixo: "Ainda sobra lucro, mas menos que o mínimo desejado.",
  dentro: "Bom valor: dentro da faixa ideal.",
  acima: "Lucro acima da faixa: pode dar para ceder.",
};
