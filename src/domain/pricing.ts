import type { Orcamento, ResultadoCalculo, StatusMargem } from "./types";

const EPS = 1e-9;

export function totalMateriais(o: Pick<Orcamento, "materiais">): number {
  return o.materiais.reduce((s, m) => s + (m.quantidade || 0) * (m.precoUnitario || 0), 0);
}

export function totalFerramentas(o: Pick<Orcamento, "ferramentas">): number {
  return o.ferramentas.reduce((s, f) => s + (f.valor || 0), 0);
}

export function statusDaMargem(margem: number, min: number, max: number): StatusMargem {
  if (margem < -EPS) return "prejuizo";
  if (margem < min - EPS) return "abaixo";
  if (margem > max + EPS) return "acima";
  return "dentro";
}

/** Preço que atinge a margem `m` mantendo o custo A: A ÷ (1 − imposto − m). Frações (0,15). */
export function precoParaMargem(A: number, imposto: number, m: number): number | null {
  const d = 1 - imposto - m;
  if (d <= EPS) return null;
  return A / d;
}

/** Toda a regra de negócio. Função pura: sem React, sem navegador. Percentuais do orçamento em % inteiro. */
export function calcular(o: Orcamento): ResultadoCalculo {
  const imposto = o.imposto / 100;
  const min = o.margemMin / 100;
  const max = o.margemMax / 100;

  const custoDuplaDia = o.diariaEletricista + o.diariaAjudante + o.passagem + o.almoco;
  const mo = o.dias * o.duplas * custoDuplaDia;
  const ferramentas = totalFerramentas(o);
  const materiais = totalMateriais(o);
  const A = mo + ferramentas + materiais;

  const markupMateriais = o.formaCompra === "meu_cnpj" ? o.markupMaterialCnpj : o.markupMaterialDireto;
  const B = mo * (1 + o.markupMO / 100);
  const C = ferramentas * (1 + o.markupFerramentas / 100);
  const D = materiais * (1 + markupMateriais / 100);
  const precoRegra = B + C + D;

  const E = precoRegra * imposto;
  const resultado = precoRegra - A - E;
  const margem = precoRegra === 0 ? 0 : resultado / precoRegra;
  const status = statusDaMargem(margem, min, max);

  const precoMin = precoParaMargem(A, imposto, min);
  const precoMax = precoParaMargem(A, imposto, max);

  let recomendado: number | null;
  if (A === 0) recomendado = 0;
  else if (status === "dentro") recomendado = precoRegra;
  else if (margem < min) recomendado = precoMin;
  else recomendado = precoMax;

  const impostoRecomendado = recomendado === null ? null : recomendado * imposto;
  const lucroRecomendado = recomendado === null ? null : recomendado - A - (impostoRecomendado as number);
  const margemRecomendada =
    recomendado === null ? null : recomendado === 0 ? 0 : (lucroRecomendado as number) / recomendado;

  return {
    custoDuplaDia,
    mo,
    ferramentas,
    materiais,
    A,
    B,
    C,
    D,
    markupMateriais,
    precoRegra,
    E,
    resultado,
    margem,
    status,
    precoMin,
    precoMax,
    recomendado,
    lucroRecomendado,
    margemRecomendada,
    impostoRecomendado,
    descontoMateriais5: materiais * 0.05,
  };
}

export const TEXTO_STATUS: Record<StatusMargem, string> = {
  prejuizo: "Prejuízo",
  abaixo: "Abaixo da faixa: risco de prejuízo",
  dentro: "Dentro da faixa ideal",
  acima: "Acima da faixa: pode perder a concorrência",
};

/** Cor semântica do status */
export const TOM_STATUS: Record<StatusMargem, "vermelho" | "verde" | "amarelo"> = {
  prejuizo: "vermelho",
  abaixo: "vermelho",
  dentro: "verde",
  acima: "amarelo",
};
