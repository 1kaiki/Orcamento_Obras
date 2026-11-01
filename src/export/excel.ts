import type { Cell, Worksheet } from "exceljs";
import { MARKUP_ADITIVO } from "../domain/defaults";
import { dataBR } from "../domain/format";
import { simularPreco } from "../domain/negociacao";
import { calcular, TEXTO_STATUS } from "../domain/pricing";
import type { Orcamento } from "../domain/types";

const MOEDA = '"R$" #,##0.00';
const PERCENTUAL = "0.0%";

const COR = {
  entradaFundo: "FFFFF2CC",
  entradaTexto: "FF0000FF",
  cabecalhoFundo: "FF1F3864",
  secaoFundo: "FFD9E1F2",
  totalFundo: "FFE2EFDA",
  borda: "FFBFBFBF",
  vinculo: "FF008000",
};

const borda = { style: "thin" as const, color: { argb: COR.borda } };
const BORDAS = { top: borda, left: borda, bottom: borda, right: borda };

type Estilo = "entrada" | "calculo" | "total" | "vinculo" | "texto";

interface Opcoes {
  formato?: string;
  estilo?: Estilo;
  negrito?: boolean;
  alinhar?: "left" | "center" | "right";
  quebra?: boolean;
  semBorda?: boolean;
}

function escrever(ws: Worksheet, endereco: string, valor: unknown, o: Opcoes = {}): Cell {
  const c = ws.getCell(endereco);
  c.value = valor as Cell["value"];
  c.font = {
    name: "Arial",
    size: 10,
    bold: o.negrito || o.estilo === "total",
    color: o.estilo === "entrada" ? { argb: COR.entradaTexto } : o.estilo === "vinculo" ? { argb: COR.vinculo } : undefined,
  };
  if (o.estilo === "entrada") c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.entradaFundo } };
  if (o.estilo === "total") c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.totalFundo } };
  if (o.formato) c.numFmt = o.formato;
  if (!o.semBorda) c.border = BORDAS;
  c.alignment = { vertical: "middle", horizontal: o.alinhar, wrapText: o.quebra };
  return c;
}

function secao(ws: Worksheet, linha: number, texto: string, ultimaColuna: string) {
  ws.mergeCells(`A${linha}:${ultimaColuna}${linha}`);
  const c = escrever(ws, `A${linha}`, texto, { negrito: true, semBorda: true });
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.secaoFundo } };
  c.border = BORDAS;
}

function cabecalho(ws: Worksheet, linha: number, titulos: string[]) {
  titulos.forEach((t, i) => {
    const c = escrever(ws, `${String.fromCharCode(65 + i)}${linha}`, t, { negrito: true, alinhar: i === 0 ? "left" : "center" });
    c.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.cabecalhoFundo } };
  });
}

/** Gera o .xlsx com fórmulas vivas. Os valores em cache (`result`) vêm de `calcular`. */
export async function gerarExcel(o: Orcamento): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const r = calcular(o);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Orça Obra";
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  const resumo = wb.addWorksheet("Resumo", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  const custos = wb.addWorksheet("Custos", { views: [{ showGridLines: false }] });
  resumo.columns = [{ width: 40 }, { width: 20 }, { width: 34 }];
  custos.columns = [{ width: 38 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const sub = `${o.obra.trim() || "Sem nome"}${o.cliente.trim() ? ` · ${o.cliente.trim()}` : ""} · ${dataBR(o.atualizadoEm)}`;

  // ---------------------------------------------------------------- Custos
  escrever(custos, "A1", "Custos da obra (A)", { negrito: true, semBorda: true }).font = { name: "Arial", size: 14, bold: true };
  escrever(custos, "A2", sub, { semBorda: true });

  const quem = o.semAjudante ? "eletricista" : "dupla";
  secao(custos, 4, "1. Mão de obra (MO)", "D");
  cabecalho(custos, 5, ["Item", "Valor", "Obs."]);
  const moLinhas: [string, number, string][] = [
    ["Diária do eletricista", o.diariaEletricista, "por dia"],
    ["Diária do ajudante", o.diariaAjudante, o.semAjudante ? "sem ajudante nesta obra" : "por dia"],
    [`Passagem (${quem})`, o.passagem, "por dia"],
    [`Almoço (${quem})`, o.almoco, "por dia"],
  ];
  moLinhas.forEach(([nome, valor, obs], i) => {
    const l = 6 + i;
    escrever(custos, `A${l}`, nome);
    escrever(custos, `B${l}`, valor, { estilo: "entrada", formato: MOEDA });
    escrever(custos, `C${l}`, obs);
  });
  escrever(custos, "A10", `Custo por dia (${quem})`, { estilo: "total" });
  escrever(custos, "B10", { formula: "SUM(B6:B9)", result: r.custoDuplaDia }, { estilo: "total", formato: MOEDA });
  escrever(custos, "A11", "Dias de serviço");
  escrever(custos, "B11", o.dias, { estilo: "entrada", formato: "0" });
  escrever(custos, "A12", o.semAjudante ? "Eletricistas" : "Duplas");
  escrever(custos, "B12", o.duplas, { estilo: "entrada", formato: "0" });
  escrever(custos, "A13", "Custo total MO", { estilo: "total" });
  escrever(custos, "B13", { formula: "B10*B11*B12", result: r.mo }, { estilo: "total", formato: MOEDA });
  escrever(custos, "C13", o.semAjudante ? "dias × eletricistas × custo por dia" : "dias × duplas × custo da dupla", { semBorda: true });

  // Ferramentas: no mínimo 5 linhas
  const nF = Math.max(5, o.ferramentas.length);
  const secF = 15;
  secao(custos, secF, "2. Ferramentas / equipamentos alugados", "D");
  cabecalho(custos, secF + 1, ["Equipamento", "Valor", "Obs."]);
  const f0 = secF + 2;
  for (let i = 0; i < nF; i++) {
    const l = f0 + i;
    const f = o.ferramentas[i];
    escrever(custos, `A${l}`, f?.descricao ?? "", { estilo: "entrada" });
    escrever(custos, `B${l}`, f ? f.valor : null, { estilo: "entrada", formato: MOEDA });
    escrever(custos, `C${l}`, "");
  }
  const totF = f0 + nF;
  escrever(custos, `A${totF}`, "Total ferramentas", { estilo: "total" });
  escrever(custos, `B${totF}`, { formula: `SUM(B${f0}:B${totF - 1})`, result: r.ferramentas }, { estilo: "total", formato: MOEDA });

  // Materiais: no mínimo 20 linhas
  const nM = Math.max(20, o.materiais.length);
  const secM = totF + 2;
  secao(custos, secM, "3. Materiais (preço de mercado, SEM desconto)", "D");
  cabecalho(custos, secM + 1, ["Material", "Qtd", "Preço unit.", "Total"]);
  const m0 = secM + 2;
  for (let i = 0; i < nM; i++) {
    const l = m0 + i;
    const m = o.materiais[i];
    escrever(custos, `A${l}`, m?.descricao ?? "", { estilo: "entrada" });
    escrever(custos, `B${l}`, m ? m.quantidade : null, { estilo: "entrada" });
    escrever(custos, `C${l}`, m ? m.precoUnitario : null, { estilo: "entrada", formato: MOEDA });
    escrever(custos, `D${l}`, { formula: `B${l}*C${l}`, result: m ? m.quantidade * m.precoUnitario : 0 }, { formato: MOEDA });
  }
  const totM = m0 + nM;
  escrever(custos, `A${totM}`, "Total materiais", { estilo: "total" });
  escrever(custos, `B${totM}`, "", { estilo: "total" });
  escrever(custos, `C${totM}`, "", { estilo: "total" });
  escrever(custos, `D${totM}`, { formula: `SUM(D${m0}:D${totM - 1})`, result: r.materiais }, { estilo: "total", formato: MOEDA });
  custos.mergeCells(`A${totM + 1}:D${totM + 1}`);
  escrever(custos, `A${totM + 1}`, "Precisa de mais linhas? Insira acima da linha do total.", { semBorda: true }).font = { name: "Arial", size: 9, italic: true };

  // ---------------------------------------------------------------- Resumo
  escrever(resumo, "A1", "Precificação de obra", { semBorda: true }).font = { name: "Arial", size: 14, bold: true };
  resumo.mergeCells("A2:C2");
  escrever(resumo, "A2", `${sub}. Resultado = B + C + D − A − E.`, { semBorda: true });

  secao(resumo, 4, "Parâmetros", "C");
  cabecalho(resumo, 5, ["Parâmetro", "Valor", "Obs."]);
  const params: [string, number, string][] = [
    ["Markup mão de obra", o.markupMO, "Acréscimo sobre a mão de obra"],
    ["Markup ferramentas", o.markupFerramentas, "Acréscimo sobre o aluguel"],
    ["Markup materiais - comprado no meu CNPJ", o.markupMaterialCnpj, "Acréscimo sobre o material"],
    ["Markup materiais - faturamento direto", o.markupMaterialDireto, "Acréscimo (CNPJ do cliente)"],
    ["Imposto na nota", o.imposto, "% que você paga na emissão"],
    ["Margem mínima desejada", o.margemMin, "Abaixo disso: lucro sem folga"],
    ["Margem máxima desejada", o.margemMax, "Acima disso: perde concorrência"],
    ["Material extra (aditivo)", MARKUP_ADITIVO, "Preço de mercado + 15%"],
  ];
  params.forEach(([nome, valor, obs], i) => {
    const l = 6 + i;
    escrever(resumo, `A${l}`, nome);
    escrever(resumo, `B${l}`, valor / 100, { estilo: "entrada", formato: PERCENTUAL });
    escrever(resumo, `C${l}`, obs);
  });
  escrever(resumo, "A14", "Forma de compra dos materiais");
  escrever(resumo, "B14", o.formaCompra === "meu_cnpj" ? "Meu CNPJ" : "Faturamento direto", { estilo: "entrada", alinhar: "right" });
  escrever(resumo, "C14", "Escolha na lista");
  resumo.getCell("B14").dataValidation = {
    type: "list",
    allowBlank: false,
    formulae: ['"Faturamento direto,Meu CNPJ"'],
    showErrorMessage: true,
    errorTitle: "Valor inválido",
    error: "Escolha Faturamento direto ou Meu CNPJ.",
  };
  escrever(resumo, "A15", "Markup aplicado nos materiais");
  escrever(resumo, "B15", { formula: 'IF(B14="Meu CNPJ",B8,B9)', result: r.markupMateriais / 100 }, { formato: PERCENTUAL });
  escrever(resumo, "C15", "");

  secao(resumo, 17, "A) Custo", "C");
  cabecalho(resumo, 18, ["Item", "Valor", "Obs."]);
  escrever(resumo, "A19", "Mão de obra");
  escrever(resumo, "B19", { formula: "Custos!B13", result: r.mo }, { estilo: "vinculo", formato: MOEDA });
  escrever(resumo, "C19", o.semAjudante ? "dias × eletricistas × custo por dia" : "dias × duplas × custo da dupla");
  escrever(resumo, "A20", "Ferramentas");
  escrever(resumo, "B20", { formula: `Custos!B${totF}`, result: r.ferramentas }, { estilo: "vinculo", formato: MOEDA });
  escrever(resumo, "C20", "aluguel de equipamentos");
  escrever(resumo, "A21", "Materiais");
  escrever(resumo, "B21", { formula: `Custos!D${totM}`, result: r.materiais }, { estilo: "vinculo", formato: MOEDA });
  escrever(resumo, "C21", "preço de mercado, sem desconto");
  escrever(resumo, "A22", "Custo total (A)", { estilo: "total" });
  escrever(resumo, "B22", { formula: "SUM(B19:B21)", result: r.A }, { estilo: "total", formato: MOEDA });
  escrever(resumo, "C22", "", { estilo: "total" });

  secao(resumo, 24, "Venda", "C");
  cabecalho(resumo, 25, ["Item", "Valor", "Obs."]);
  escrever(resumo, "A26", "B) Mão de obra");
  escrever(resumo, "B26", { formula: "B19*(1+B6)", result: r.B }, { formato: MOEDA });
  escrever(resumo, "C26", "MO + markup");
  escrever(resumo, "A27", "C) Ferramentas");
  escrever(resumo, "B27", { formula: "B20*(1+B7)", result: r.C }, { formato: MOEDA });
  escrever(resumo, "C27", "Aluguel + markup");
  escrever(resumo, "A28", "D) Materiais");
  escrever(resumo, "B28", { formula: "B21*(1+B15)", result: r.D }, { formato: MOEDA });
  escrever(resumo, "C28", "Materiais + markup da forma de compra");
  escrever(resumo, "A29", "PREÇO DE VENDA", { estilo: "total" });
  escrever(resumo, "B29", { formula: "SUM(B26:B28)", result: r.precoRegra }, { estilo: "total", formato: MOEDA });
  escrever(resumo, "C29", "B + C + D", { estilo: "total" });

  secao(resumo, 31, "Resultado", "C");
  escrever(resumo, "A32", "E) Imposto");
  escrever(resumo, "B32", { formula: "B29*B10", result: r.E }, { formato: MOEDA });
  escrever(resumo, "C32", "imposto sobre o preço de venda");
  escrever(resumo, "A33", "RESULTADO (B+C+D−A−E)", { estilo: "total" });
  escrever(resumo, "B33", { formula: "B29-B22-B32", result: r.resultado }, { estilo: "total", formato: MOEDA });
  escrever(resumo, "C33", "lucro pela regra, depois do imposto", { estilo: "total" });
  escrever(resumo, "A34", "Margem sobre a venda");
  escrever(resumo, "B34", { formula: "IF(B29=0,0,B33/B29)", result: r.margem }, { formato: PERCENTUAL });
  escrever(resumo, "C34", "resultado ÷ preço de venda");
  escrever(resumo, "A35", "Situação");
  resumo.mergeCells("B35:C35");
  escrever(
    resumo,
    "B35",
    {
      formula: 'IF(B34<0,"Prejuízo",IF(B34<B11,"Abaixo da faixa: risco de prejuízo",IF(B34>B12,"Acima da faixa: pode perder a concorrência","Dentro da faixa ideal")))',
      result: TEXTO_STATUS[r.status],
    },
    { negrito: true },
  );
  resumo.getCell("C35").border = BORDAS;

  secao(resumo, 37, "Preço sugerido para bater a margem (mantendo o custo)", "C");
  escrever(resumo, "A38", "Preço p/ margem mínima");
  escrever(resumo, "B38", { formula: "IF(1-B10-B11<=0,0,B22/(1-B10-B11))", result: r.precoMin ?? 0 }, { formato: MOEDA });
  escrever(resumo, "C38", "Considera imposto sobre o preço total");
  escrever(resumo, "A39", "Preço p/ margem máxima");
  escrever(resumo, "B39", { formula: "IF(1-B10-B12<=0,0,B22/(1-B10-B12))", result: r.precoMax ?? 0 }, { formato: MOEDA });
  escrever(resumo, "C39", "");
  escrever(resumo, "A40", "VALOR RECOMENDADO A COBRAR", { estilo: "total" });
  escrever(resumo, "B40", { formula: "IF(B22=0,0,IF(B34<B11,B38,IF(B34>B12,B39,B29)))", result: r.recomendado ?? 0 }, { estilo: "total", formato: MOEDA });
  escrever(resumo, "C40", "Dentro da faixa: preço da regra", { estilo: "total" });
  escrever(resumo, "A41", "Lucro cobrando o recomendado", { estilo: "total" });
  escrever(resumo, "B41", { formula: "B40-B22-B40*B10", result: r.lucroRecomendado ?? 0 }, { estilo: "total", formato: MOEDA });
  escrever(resumo, "C41", "valor - custo - imposto", { estilo: "total" });
  escrever(resumo, "A42", "Margem cobrando o recomendado");
  escrever(resumo, "B42", { formula: "IF(B40=0,0,B41/B40)", result: r.margemRecomendada ?? 0 }, { formato: PERCENTUAL });
  escrever(resumo, "C42", "lucro ÷ valor cobrado");
  if (o.valorFechado !== null) {
    const s = simularPreco(o, o.valorFechado);
    escrever(resumo, "A43", "Valor combinado com o cliente", { estilo: "total" });
    escrever(resumo, "B43", o.valorFechado, { estilo: "entrada", formato: MOEDA });
    escrever(resumo, "C43", "digitado na negociação", { estilo: "total" });
    escrever(resumo, "A44", "Lucro no valor combinado");
    escrever(resumo, "B44", { formula: "B43-B22-B43*B10", result: s.lucro }, { formato: MOEDA });
    escrever(resumo, "C44", "valor - custo - imposto");
  }

  const dicas = [
    "Orce os materiais sem desconto e feche o preço deixando claro quais materiais estão contemplados.",
    "Na compra, pesquise e negocie desconto: isso aumenta a sua margem de lucro.",
    `Deixe claro no contrato que qualquer material extra será cobrado a preço de mercado + ${MARKUP_ADITIVO}%.`,
  ];
  dicas.forEach((t, i) => {
    const l = 46 + i;
    resumo.mergeCells(`A${l}:C${l}`);
    const c = escrever(resumo, `A${l}`, t, { semBorda: true, quebra: true });
    c.font = { name: "Arial", size: 9, italic: true };
    resumo.getRow(l).height = 26;
  });

  // Formatação condicional da margem e da situação
  const preenche = (argb: string) => ({ fill: { type: "pattern" as const, pattern: "solid" as const, bgColor: { argb } } });
  resumo.addConditionalFormatting({
    ref: "B34:B35",
    rules: [
      { type: "expression", priority: 1, formulae: ["$B$34<$B$11"], style: preenche("FFF8CBAD") },
      { type: "expression", priority: 2, formulae: ["$B$34>$B$12"], style: preenche("FFFFE699") },
      { type: "expression", priority: 3, formulae: ["AND($B$34>=$B$11,$B$34<=$B$12)"], style: preenche("FFC6EFCE") },
    ],
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
