import { MARKUP_ADITIVO } from "./defaults";
import { brl, numero, pct, pctInteiro } from "./format";
import { calcular, TOM_STATUS } from "./pricing";
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

/** Relatório "Por que esse valor": mesma lista de blocos na tela e no PDF. */
export function gerarRelatorio(o: Orcamento): Bloco[] {
  const r = calcular(o);
  const blocos: Bloco[] = [];
  const dif = r.recomendado !== null && Math.abs(r.recomendado - r.precoRegra) > 0.005;
  const direto = o.formaCompra === "faturamento_direto";
  const formaTxt = direto ? "faturamento direto (nota no CNPJ do cliente)" : "compra no seu CNPJ";
  const imp = pctInteiro(o.imposto);
  const min = pctInteiro(o.margemMin);
  const max = pctInteiro(o.margemMax);

  // Resumo
  if (r.recomendado === null) {
    blocos.push({ tipo: "paragrafo", texto: SEM_PRECO });
  } else {
    blocos.push({
      tipo: "paragrafo",
      texto:
        `Cobre ${brl(r.recomendado)}. Depois de pagar todos os custos e ${brl(r.impostoRecomendado as number)} de imposto, ` +
        `sobram ${brl(r.lucroRecomendado as number)} de lucro, ou ${pct(r.margemRecomendada as number)} do valor da obra.`,
    });
  }

  // A) Custo
  blocos.push({ tipo: "titulo", texto: "A) Quanto a obra custa para você" });
  blocos.push({
    tipo: "tabela",
    cabecalho: ["Item", "Conta", "Valor"],
    linhas: [
      ["Mão de obra", `${o.dias} dia(s) × ${o.duplas} dupla(s) × ${brl(r.custoDuplaDia)} por dia`, brl(r.mo)],
      ["Ferramentas (aluguel)", o.ferramentas.length ? `${o.ferramentas.length} item(ns)` : "nenhum aluguel", brl(r.ferramentas)],
      ["Materiais", `preço de mercado, sem desconto; ${formaTxt}`, brl(r.materiais)],
      ["Custo total (A)", "mão de obra + ferramentas + materiais", brl(r.A)],
    ],
    ultimaEmDestaque: true,
  });
  blocos.push({
    tipo: "paragrafo",
    texto:
      `Custo da dupla por dia (1 eletricista + 1 ajudante): ${brl(o.diariaEletricista)} de diária do eletricista + ` +
      `${brl(o.diariaAjudante)} de diária do ajudante + ${brl(o.passagem)} de passagem + ${brl(o.almoco)} de almoço = ${brl(r.custoDuplaDia)}.`,
  });

  // B, C, D
  blocos.push({ tipo: "titulo", texto: "B, C, D) Quanto vender cada parte" });
  blocos.push({
    tipo: "lista",
    itens: [
      `Mão de obra (B): +${pctInteiro(o.markupMO)}. É o seu trabalho e o do ajudante: o acréscimo paga o seu lucro, os encargos e o tempo parado entre obras.`,
      `Ferramentas (C): +${pctInteiro(o.markupFerramentas)}. Cobre o trabalho de alugar, transportar e devolver o equipamento.`,
      direto
        ? `Materiais (D): +${pctInteiro(r.markupMateriais)}, porque é faturamento direto: a nota sai no CNPJ do cliente e você não adianta dinheiro nem corre o risco da compra.`
        : `Materiais (D): +${pctInteiro(r.markupMateriais)}, porque você compra no seu CNPJ: adianta o dinheiro, paga imposto sobre a revenda e assume o risco do material.`,
    ],
  });
  blocos.push({
    tipo: "tabela",
    cabecalho: ["Parte", "Conta", "Valor"],
    linhas: [
      ["B) Mão de obra", `${brl(r.mo)} × ${numero(1 + o.markupMO / 100)}`, brl(r.B)],
      ["C) Ferramentas", `${brl(r.ferramentas)} × ${numero(1 + o.markupFerramentas / 100)}`, brl(r.C)],
      ["D) Materiais", `${brl(r.materiais)} × ${numero(1 + r.markupMateriais / 100)}`, brl(r.D)],
      ["Preço pela regra (B + C + D)", "", brl(r.precoRegra)],
    ],
    ultimaEmDestaque: true,
  });

  // E) Imposto
  blocos.push({ tipo: "titulo", texto: "E) Imposto" });
  blocos.push({
    tipo: "paragrafo",
    texto: `O imposto de ${imp} é pago na emissão da nota e incide sobre o preço de venda: ${brl(r.precoRegra)} × ${imp} = ${brl(r.E)}.`,
  });

  // Resultado
  blocos.push({ tipo: "titulo", texto: "Resultado" });
  if (dif) {
    blocos.push({
      tipo: "tabela",
      cabecalho: ["", "Pela regra", "Recomendado"],
      linhas: [
        ["Valor cobrado", brl(r.precoRegra), brl(r.recomendado as number)],
        ["menos custo (A)", brl(r.A), brl(r.A)],
        ["menos imposto (E)", brl(r.E), brl(r.impostoRecomendado as number)],
        ["Lucro", brl(r.resultado), brl(r.lucroRecomendado as number)],
        ["Margem sobre a venda", pct(r.margem), pct(r.margemRecomendada as number)],
      ],
    });
  } else {
    blocos.push({
      tipo: "tabela",
      linhas: [
        ["Valor cobrado", brl(r.precoRegra)],
        ["menos custo (A)", brl(r.A)],
        ["menos imposto (E)", brl(r.E)],
        ["Lucro (B + C + D - A - E)", brl(r.resultado)],
        ["Margem sobre a venda", pct(r.margem)],
      ],
    });
  }

  // Por que esse valor
  blocos.push({ tipo: "titulo", texto: "Por que esse valor" });
  const tom = TOM_STATUS[r.status];
  const conta = (m: string) => `A ÷ (1 - ${imp} de imposto - ${m} de margem)`;
  if (r.status === "dentro") {
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: "Dentro da faixa ideal",
      textos: [
        `Pela regra o preço é ${brl(r.precoRegra)} e a margem é ${pct(r.margem)}, dentro da faixa ideal de ${min} a ${max}.`,
        `O valor recomendado é o próprio preço pela regra: ${brl(r.precoRegra)}.`,
      ],
    });
  } else if (r.recomendado === null) {
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: r.status === "acima" ? "Acima da faixa" : "Abaixo da faixa",
      textos: [`Pela regra o preço é ${brl(r.precoRegra)} e a margem é ${pct(r.margem)}.`, SEM_PRECO],
    });
  } else if (r.status === "acima") {
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: "Acima da faixa: pode perder a concorrência",
      textos: [
        `Pela regra o preço seria ${brl(r.precoRegra)}, o que daria margem de ${pct(r.margem)}, acima de ${max}. Um preço assim pode fazer você perder a concorrência.`,
        `Para ficar em ${max} de margem o preço é ${conta(max)} = ${brl(r.precoMax as number)}.`,
        `Por isso o valor recomendado é ${brl(r.recomendado)}, ${brl(r.precoRegra - r.recomendado)} a menos que o preço pela regra.`,
      ],
    });
  } else {
    const prej = r.status === "prejuizo";
    blocos.push({
      tipo: "caixa",
      tom,
      titulo: prej ? "Prejuízo pela regra" : "Abaixo da faixa: risco de prejuízo",
      textos: [
        `Pela regra o preço seria ${brl(r.precoRegra)}, o que daria ${prej ? "prejuízo de " + brl(-r.resultado) : "lucro de " + brl(r.resultado)} e margem de ${pct(r.margem)}, abaixo de ${min}. ${prej ? "Cobrando isso você perde dinheiro." : "Qualquer imprevisto na obra pode virar prejuízo."}`,
        `Para chegar a ${min} de margem, mantendo o mesmo custo, o preço é ${conta(min)} = ${brl(r.precoMin as number)}.`,
        `Por isso o valor recomendado é ${brl(r.recomendado)}, ${brl(r.recomendado - r.precoRegra)} a mais que o preço pela regra.`,
      ],
    });
  }

  // Na hora de fechar
  blocos.push({ tipo: "titulo", texto: "Na hora de fechar" });
  blocos.push({
    tipo: "lista",
    itens: [
      "Oriente os materiais sem desconto e feche o preço deixando claro quais materiais estão contemplados.",
      `Na hora de comprar, pesquise e negocie desconto: isso aumenta a sua margem de lucro. Só 5% de desconto nos materiais vale ${brl(r.descontoMateriais5)}.`,
      `Deixe claro no contrato que qualquer material extra será cobrado a preço de mercado + ${MARKUP_ADITIVO}%.`,
      "Os valores de mão de obra e o imposto devem refletir a realidade da sua região; ajuste-os se for preciso.",
    ],
  });
  if (r.precoMin !== null && r.precoMax !== null) {
    blocos.push({
      tipo: "paragrafo",
      texto: `Faixa para negociar: de ${brl(r.precoMin)} (margem de ${min}) a ${brl(r.precoMax)} (margem de ${max}). Abaixo do primeiro você toma prejuízo; acima do segundo corre o risco de perder a concorrência.`,
    });
  }

  // Materiais contemplados
  const descritos = o.materiais.filter((m) => m.descricao.trim() || m.quantidade || m.precoUnitario);
  if (descritos.length > 1 || descritos.some((m) => m.descricao.trim())) {
    blocos.push({ tipo: "titulo", texto: "Materiais contemplados" });
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

  return blocos;
}

const NUMERICO = /^(R\$ )?-?[\d.,]+%?$|^-$/;

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
