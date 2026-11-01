import { MARKUP_ADITIVO } from "./defaults";
import { brl, numero, pct, pctInteiro } from "./format";
import { simularPreco } from "./negociacao";
import { resultadoAditivo } from "./obra";
import { calcular, precoParaMargem, TOM_STATUS } from "./pricing";
import type { Orcamento } from "./types";

export type Tom = "verde" | "amarelo" | "vermelho";

export type Bloco =
  | { tipo: "titulo"; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "tabela"; cabecalho?: string[]; linhas: string[][]; ultimaEmDestaque?: boolean }
  | { tipo: "caixa"; tom: Tom; titulo: string; textos: string[] };

const SEM_PRECO =
  "Com esse imposto e essa margem não existe preço possível (imposto + margem desejada chegam a 100% ou mais). Reduza o imposto ou a margem desejada.";

/** Títulos das seções: a tela usa os mesmos para montar os detalhes. */
export const TITULOS = {
  custo: "Quanto a obra custa para você",
  venda: "Quanto cobrar por cada parte",
  imposto: "O imposto da nota",
  sobra: "Quanto sobra no final",
  porque: "Por que esse valor",
  fechar: "Na hora de fechar",
  materiais: "Materiais contemplados",
  palavras: "O que cada palavra quer dizer",
} as const;

/** "Lucro de R$ 10,00" ou "Prejuízo de R$ 10,00": valor negativo nunca aparece como lucro. */
export function lucroOuPrejuizo(valor: number): string {
  return valor < 0 ? `Prejuízo de ${brl(-valor)}` : `Lucro de ${brl(valor)}`;
}

/** Relatório "Por que esse valor": mesma lista de blocos na tela e no PDF. */
export function gerarRelatorio(o: Orcamento): Bloco[] {
  const r = calcular(o);
  const blocos: Bloco[] = [];
  const dif = r.recomendado !== null && Math.abs(r.recomendado - r.precoRegra) > 0.005;
  const direto = o.formaCompra === "faturamento_direto";
  const formaTxt = direto ? "nota no CNPJ do cliente" : "compra no seu CNPJ";
  const imp = pctInteiro(o.imposto);
  const min = pctInteiro(o.margemMin);
  const max = pctInteiro(o.margemMax);
  const equipe = o.semAjudante ? "eletricista(s)" : "dupla(s)";

  // Resumo: em uma frase, quanto cobrar e para onde vai o dinheiro
  const preco = o.valorFechado ?? r.recomendado;
  if (preco === null) {
    blocos.push({ tipo: "paragrafo", texto: SEM_PRECO });
  } else {
    const s = simularPreco(o, preco);
    const destino = s.lucro < 0 ? `e faltam ${brl(-s.lucro)}: é prejuízo` : `e ${brl(s.lucro)} ficam de lucro para você`;
    blocos.push({
      tipo: "paragrafo",
      texto: `${o.valorFechado === null ? "Cobre" : "Valor combinado com o cliente:"} ${brl(preco)}. Desse valor, ${brl(r.A)} pagam os custos da obra, ${brl(s.imposto)} vão para o imposto ${destino}.`,
    });
    if (s.lucro >= 0 && preco > 0) {
      blocos.push({ tipo: "paragrafo", texto: `Ou seja: de cada R$ 100,00 que o cliente paga, ${brl(s.margem * 100)} viram lucro. Essa é a sua margem de ${pct(s.margem)}.` });
    }
    if (o.valorFechado !== null && r.recomendado !== null) {
      blocos.push({ tipo: "paragrafo", texto: `O valor recomendado era ${brl(r.recomendado)}.` });
    }
  }

  // Custo
  blocos.push({ tipo: "titulo", texto: TITULOS.custo });
  blocos.push({
    tipo: "tabela",
    cabecalho: ["Item", "Conta", "Valor"],
    linhas: [
      ["Mão de obra", `${o.dias} dia(s) × ${o.duplas} ${equipe} × ${brl(r.custoDuplaDia)} por dia`, brl(r.mo)],
      ["Ferramentas alugadas", o.ferramentas.length ? `${o.ferramentas.length} item(ns)` : "nenhum aluguel", brl(r.ferramentas)],
      ["Materiais", `preço de mercado, sem desconto; ${formaTxt}`, brl(r.materiais)],
      ["Custo total (A)", "mão de obra + ferramentas + materiais", brl(r.A)],
    ],
    ultimaEmDestaque: true,
  });
  blocos.push({
    tipo: "paragrafo",
    texto: o.semAjudante
      ? `Custo do eletricista por dia, sem ajudante: ${brl(o.diariaEletricista)} de diária + ${brl(o.passagem)} de passagem + ${brl(o.almoco)} de almoço = ${brl(r.custoDuplaDia)}.`
      : `Custo da dupla por dia (1 eletricista + 1 ajudante): ${brl(o.diariaEletricista)} do eletricista + ${brl(o.diariaAjudante)} do ajudante + ${brl(o.passagem)} de passagem + ${brl(o.almoco)} de almoço = ${brl(r.custoDuplaDia)}.`,
  });

  // Venda
  blocos.push({ tipo: "titulo", texto: TITULOS.venda });
  blocos.push({
    tipo: "lista",
    itens: [
      `Mão de obra: +${pctInteiro(o.markupMO)}. Paga o seu lucro, os encargos e o tempo parado entre uma obra e outra.`,
      `Ferramentas: +${pctInteiro(o.markupFerramentas)}. Paga o trabalho de alugar, buscar e devolver o equipamento.`,
      direto
        ? `Materiais: +${pctInteiro(r.markupMateriais)}. A nota sai no CNPJ do cliente: você não adianta dinheiro nem corre o risco da compra.`
        : `Materiais: +${pctInteiro(r.markupMateriais)}. Você compra no seu CNPJ: adianta o dinheiro, paga imposto na revenda e assume o risco do material.`,
    ],
  });
  blocos.push({
    tipo: "tabela",
    cabecalho: ["Parte", "Conta", "Valor"],
    linhas: [
      ["Mão de obra (B)", `${brl(r.mo)} × ${numero(1 + o.markupMO / 100)}`, brl(r.B)],
      ["Ferramentas (C)", `${brl(r.ferramentas)} × ${numero(1 + o.markupFerramentas / 100)}`, brl(r.C)],
      ["Materiais (D)", `${brl(r.materiais)} × ${numero(1 + r.markupMateriais / 100)}`, brl(r.D)],
      ["Preço pela regra (B + C + D)", "", brl(r.precoRegra)],
    ],
    ultimaEmDestaque: true,
  });

  // Imposto
  blocos.push({ tipo: "titulo", texto: TITULOS.imposto });
  blocos.push({
    tipo: "paragrafo",
    texto: `Na emissão da nota, você paga ${imp} sobre o valor cobrado. Pelo preço da regra, isso dá ${brl(r.precoRegra)} × ${imp} = ${brl(r.E)} (E).`,
  });

  // Quanto sobra
  blocos.push({ tipo: "titulo", texto: TITULOS.sobra });
  const rotuloLucro = (v: number) => (v < 0 ? "Prejuízo" : "Lucro");
  if (dif) {
    const lucroRec = r.lucroRecomendado as number;
    blocos.push({
      tipo: "tabela",
      cabecalho: ["", "Pela regra", "Recomendado"],
      linhas: [
        ["Valor cobrado", brl(r.precoRegra), brl(r.recomendado as number)],
        ["menos custo (A)", brl(r.A), brl(r.A)],
        ["menos imposto", brl(r.E), brl(r.impostoRecomendado as number)],
        ["Sobra (lucro ou prejuízo)", brl(r.resultado), brl(lucroRec)],
        ["Parte que vira lucro (margem)", pct(r.margem), pct(r.margemRecomendada as number)],
      ],
    });
  } else {
    blocos.push({
      tipo: "tabela",
      linhas: [
        ["Valor cobrado", brl(r.precoRegra)],
        ["menos custo (A)", brl(r.A)],
        ["menos imposto (E)", brl(r.E)],
        [`${rotuloLucro(r.resultado)} (B + C + D - A - E)`, brl(Math.abs(r.resultado))],
        ["Parte que vira lucro (margem)", pct(r.margem)],
      ],
    });
  }

  // Por que esse valor
  blocos.push({ tipo: "titulo", texto: TITULOS.porque });
  const tom = TOM_STATUS[r.status];
  const conta = (m: string) => `${brl(r.A)} ÷ (100% - ${imp} de imposto - ${m} de margem)`;
  if (r.status === "dentro") {
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: "O preço da regra está bom",
      textos: [
        `Somando as partes, o preço é ${brl(r.precoRegra)}. Sobra ${pct(r.margem)} de lucro, dentro da faixa ideal de ${min} a ${max}.`,
        `Por isso a recomendação é cobrar esse mesmo valor: ${brl(r.precoRegra)}.`,
      ],
    });
  } else if (r.recomendado === null) {
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: r.status === "acima" ? "Acima da faixa" : "Abaixo da faixa",
      textos: [`Somando as partes, o preço é ${brl(r.precoRegra)} e a margem é ${pct(r.margem)}.`, SEM_PRECO],
    });
  } else if (r.status === "acima") {
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: "O preço da regra está alto demais",
      textos: [
        `Somando as partes, o preço seria ${brl(r.precoRegra)}. Sobraria ${pct(r.margem)} de lucro, mais que o teto de ${max}, e um preço assim pode fazer você perder a concorrência.`,
        `Para ficar nos ${max}, a conta é ${conta(max)} = ${brl(r.precoMax as number)}.`,
        `Por isso a recomendação é cobrar ${brl(r.recomendado)}, ${brl(r.precoRegra - r.recomendado)} a menos que o preço da regra.`,
      ],
    });
  } else {
    const prej = r.status === "prejuizo";
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: prej ? "O preço da regra dá prejuízo" : "O preço da regra deixa pouco lucro",
      textos: [
        `Somando as partes, o preço seria ${brl(r.precoRegra)}. ${prej ? `Faltariam ${brl(-r.resultado)} para pagar custos e imposto: cobrando isso, você perde dinheiro.` : `Sobrariam só ${brl(r.resultado)} (${pct(r.margem)}), abaixo do mínimo de ${min}. Qualquer imprevisto na obra pode virar prejuízo.`}`,
        `Para sobrar pelo menos ${min}, a conta é ${conta(min)} = ${brl(r.precoMin as number)}.`,
        `Por isso a recomendação é cobrar ${brl(r.recomendado)}, ${brl(r.recomendado - r.precoRegra)} a mais que o preço da regra.`,
      ],
    });
  }

  // Na hora de fechar
  const aditivo100 = resultadoAditivo(100, o.imposto).lucro;
  blocos.push({ tipo: "titulo", texto: TITULOS.fechar });
  blocos.push({
    tipo: "lista",
    itens: [
      "Passe o preço com os materiais sem desconto e deixe claro quais materiais estão incluídos.",
      `Na hora de comprar, pesquise e negocie: cada desconto vira lucro. Só 5% nos materiais valem ${brl(r.descontoMateriais5)}.`,
      `Deixe combinado por escrito que material extra custa preço de mercado + ${MARKUP_ADITIVO}%.`,
      ...(aditivo100 < 0
        ? [`Atenção: com ${imp} de imposto, material extra a mercado + ${MARKUP_ADITIVO}% deixa prejuízo de ${brl(-aditivo100)} a cada R$ 100,00 de material, se passar pela sua nota.`]
        : []),
      "Os valores de mão de obra e o imposto precisam refletir a realidade da sua região; ajuste-os se for preciso.",
    ],
  });
  if (r.precoMin !== null && r.precoMax !== null) {
    const piso = precoParaMargem(r.A, o.imposto / 100, 0) as number;
    blocos.push({
      tipo: "paragrafo",
      texto: `Faixa para negociar: de ${brl(r.precoMin)} (margem de ${min}) a ${brl(r.precoMax)} (margem de ${max}). Abaixo de ${brl(r.precoMin)} o lucro fica menor que o mínimo, e abaixo de ${brl(piso)} você tem prejuízo. Acima de ${brl(r.precoMax)} você corre o risco de perder a concorrência.`,
    });
  }

  // Materiais contemplados
  const descritos = o.materiais.filter((m) => m.descricao.trim() || m.quantidade || m.precoUnitario);
  if (descritos.length > 1 || descritos.some((m) => m.descricao.trim())) {
    blocos.push({ tipo: "titulo", texto: TITULOS.materiais });
    blocos.push({
      tipo: "tabela",
      cabecalho: ["Material", "Qtd", "Preço unit.", "Total"],
      linhas: [
        ...descritos.map((m) => [
          m.descricao.trim() || "(sem descrição)",
          numero(m.quantidade).replace(/,00$/, ""),
          brl(m.precoUnitario),
          brl(m.quantidade * m.precoUnitario),
        ]),
        ["Total", "", "", brl(r.materiais)],
      ],
      ultimaEmDestaque: true,
    });
  }

  // Glossário
  blocos.push({ tipo: "titulo", texto: TITULOS.palavras });
  blocos.push({
    tipo: "lista",
    itens: [
      "Custo: o que você gasta para fazer a obra.",
      "Acréscimo: o que você soma ao custo para formar o preço.",
      "Lucro: o que sobra depois de pagar os custos e o imposto.",
      "Margem: a parte do valor cobrado que vira lucro. Margem de 15% são R$ 15,00 de lucro em cada R$ 100,00.",
      `Faixa ideal: margem de ${min} a ${max}. Menos que isso deixa a obra sem folga; mais que isso pode encarecer demais.`,
      "Preço pela regra: a soma de cada parte com o seu acréscimo, antes de conferir se a margem está na faixa.",
    ],
  });

  return blocos;
}

const NUMERICO = /^-?(R\$ )?-?[\d.,]+%?$|^-$/;

/** Uma coluna é numérica (alinhada à direita) quando todas as células preenchidas são valores. */
export function colunaNumerica(b: Extract<Bloco, { tipo: "tabela" }>, coluna: number): boolean {
  if (coluna === 0 && (b.cabecalho?.length ?? b.linhas[0]?.length ?? 0) > 1) return false;
  const celulas = b.linhas.map((l) => l[coluna]).filter((c) => c && c.trim());
  return celulas.length > 0 && celulas.every((c) => NUMERICO.test(c.trim()));
}

/** Texto corrido de todos os blocos (usado nos testes). */
export function relatorioComoTexto(blocos: Bloco[]): string {
  return blocos
    .map((b) => {
      switch (b.tipo) {
        case "titulo":
        case "paragrafo":
          return b.texto;
        case "lista":
          return b.itens.join("\n");
        case "tabela":
          return [b.cabecalho, ...b.linhas].filter(Boolean).map((l) => (l as string[]).join(" | ")).join("\n");
        case "caixa":
          return [b.titulo, ...b.textos].join("\n");
      }
    })
    .join("\n");
}
