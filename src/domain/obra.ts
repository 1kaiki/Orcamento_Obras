import { MARKUP_ADITIVO } from "./defaults";
import { valorDaObra } from "./negociacao";
import { calcular } from "./pricing";
import type { CategoriaGasto, Orcamento } from "./types";

/** Uso do custo previsto a partir do qual a caderneta avisa. */
export const LIMITE_ALERTA = 0.9;

export const NOME_CATEGORIA: Record<CategoriaGasto, string> = {
  material: "Material",
  ferramenta: "Ferramenta",
  outro: "Outro",
};

export interface ResultadoAditivo {
  preco: number;
  imposto: number;
  lucro: number;
}

/** Material extra: preço de mercado + 15%, com o mesmo imposto da obra sobre a venda. */
export function resultadoAditivo(custo: number, impostoPct: number): ResultadoAditivo {
  const preco = custo * (1 + MARKUP_ADITIVO / 100);
  const imposto = (preco * impostoPct) / 100;
  return { preco, imposto, lucro: preco - custo - imposto };
}

export interface ResumoObra {
  valorContratado: number;
  vendaAditivos: number;
  custoAditivos: number;
  receita: number;
  moPrevista: number;
  moReal: number;
  materiaisPrevistos: number;
  materiaisReais: number;
  ferramentasPrevistas: number;
  ferramentasReais: number;
  outros: number;
  custoPrevisto: number;
  custoReal: number;
  /** Só o que já foi lançado, sem completar com o previsto */
  custoLancado: number;
  usoDoCusto: number;
  alerta: boolean;
  imposto: number;
  lucroPrevisto: number;
  lucroReal: number;
  margemReal: number;
}

/**
 * Compara o previsto com o que aconteceu, sem tocar na regra de preço.
 * Em andamento, cada parte usa o maior valor entre previsto e lançado: compra parcial não vira lucro falso.
 * Concluída, usa o lançado; uma parte sem nenhum lançamento fica com o previsto.
 */
export function resumoObra(o: Orcamento): ResumoObra {
  const r = calcular(o);
  const concluida = o.concluidaEm !== null;
  const soma = (c: CategoriaGasto) => o.gastos.filter((g) => g.categoria === c).reduce((s, g) => s + (g.valor || 0), 0);
  const tem = (c: CategoriaGasto) => o.gastos.some((g) => g.categoria === c);
  const parte = (c: CategoriaGasto, previsto: number) => (concluida ? (tem(c) ? soma(c) : previsto) : Math.max(previsto, soma(c)));

  const moLancada = o.diasReais === null ? 0 : o.diasReais * o.duplas * r.custoDuplaDia;
  const moReal = o.diasReais === null ? r.mo : concluida ? moLancada : Math.max(r.mo, moLancada);
  const materiaisReais = parte("material", r.materiais);
  const ferramentasReais = parte("ferramenta", r.ferramentas);
  const outros = soma("outro");

  const aprovados = o.aditivos.filter((a) => a.aprovado);
  const custoAditivos = aprovados.reduce((s, a) => s + (a.custo || 0), 0);
  const vendaAditivos = aprovados.reduce((s, a) => s + resultadoAditivo(a.custo || 0, o.imposto).preco, 0);

  const valorContratado = valorDaObra(o) ?? 0;
  const receita = valorContratado + vendaAditivos;
  const custoReal = moReal + materiaisReais + ferramentasReais + outros + custoAditivos;
  const custoLancado = moLancada + soma("material") + soma("ferramenta") + outros;
  const imposto = (receita * o.imposto) / 100;
  const lucroReal = receita - custoReal - imposto;
  const usoDoCusto = r.A === 0 ? 0 : custoLancado / r.A;

  return {
    valorContratado,
    vendaAditivos,
    custoAditivos,
    receita,
    moPrevista: r.mo,
    moReal,
    materiaisPrevistos: r.materiais,
    materiaisReais,
    ferramentasPrevistas: r.ferramentas,
    ferramentasReais,
    outros,
    custoPrevisto: r.A,
    custoReal,
    custoLancado,
    usoDoCusto,
    alerta: !concluida && usoDoCusto >= LIMITE_ALERTA,
    imposto,
    lucroPrevisto: valorContratado - r.A - (valorContratado * o.imposto) / 100,
    lucroReal,
    margemReal: receita === 0 ? 0 : lucroReal / receita,
  };
}
