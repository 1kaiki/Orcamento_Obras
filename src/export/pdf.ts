import type { jsPDF } from "jspdf";
import { brl, dataBR, pct } from "../domain/format";
import { simularPreco } from "../domain/negociacao";
import { calcular, TEXTO_STATUS } from "../domain/pricing";
import { colunaNumerica, gerarRelatorio, lucroOuPrejuizo, type Bloco, type Tom } from "../domain/report";
import type { Orcamento } from "../domain/types";
import { DISPLAY_BOLD, TEXTO_BOLD, TEXTO_NORMAL } from "./fontes-pdf";

export type RGB = [number, number, number];

// O PDF não lê variáveis CSS: estes valores são os tokens do modo claro de src/styles/globals.css.
export const GRAFITE: RGB = [0x1c, 0x20, 0x26]; // --panel
export const TINTA: RGB = [0x17, 0x1b, 0x21]; // --foreground
export const AMARELO: RGB = [0xff, 0xbf, 0x00]; // --primary
const AMARELO_CLARO: RGB = [0xff, 0xf2, 0xcc]; // --primary com 20% sobre branco
export const CINZA: RGB = [0x4a, 0x52, 0x5e]; // --muted-foreground
export const CINZA_PAINEL: RGB = [0xb4, 0xbb, 0xc6]; // --panel-muted
export const LINHA: RGB = [0xc3, 0xca, 0xd3]; // --border
export const BRANCO: RGB = [255, 255, 255];
const TOM: Record<Tom, { fundo: RGB; borda: RGB }> = {
  verde: { fundo: [0xda, 0xf0, 0xe5], borda: [0x0e, 0x62, 0x39] }, // --success-soft, --success
  amarelo: { fundo: [0xfd, 0xee, 0xbd], borda: [0x88, 0x3f, 0x07] }, // --warning-soft, --warning
  vermelho: { fundo: [0xfb, 0xe0, 0xde], borda: [0xa2, 0x22, 0x1a] }, // --danger-soft, --danger
};

export const DISPLAY = "BigShoulders";
export const TEXTO = "PublicSans";

const MARGEM = 16;
const LARGURA = 210 - MARGEM * 2;
const ALTURA = 297;
const LIMITE_Y = ALTURA - 20; // deixa espaço para o rodapé

/** Fontes do PDF cobrem só o latim básico: troca "−", espaços especiais e aspas curvas por equivalentes simples. */
export function limpar(texto: string): string {
  return texto
    .replace(/[−–—]/g, "-")
    .replace(/[    ]/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

export function registrarFontes(doc: jsPDF) {
  doc.addFileToVFS("BigShoulders-Bold.ttf", DISPLAY_BOLD);
  doc.addFont("BigShoulders-Bold.ttf", DISPLAY, "bold");
  doc.addFileToVFS("PublicSans-Regular.ttf", TEXTO_NORMAL);
  doc.addFont("PublicSans-Regular.ttf", TEXTO, "normal");
  doc.addFileToVFS("PublicSans-Bold.ttf", TEXTO_BOLD);
  doc.addFont("PublicSans-Bold.ttf", TEXTO, "bold");
}

/** Relatório interno: mostra custo, imposto e lucro. Para o cliente, use a proposta (proposta.ts). */
export async function gerarPdf(o: Orcamento): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const r = calcular(o);
  const preco = o.valorFechado ?? r.recomendado;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `Relatório interno - ${o.obra.trim() || "Sem nome"}`, creator: "Orça Obra" });
  registrarFontes(doc);

  const hoje = dataBR(Date.now());
  const nomeObra = o.obra.trim() || "Sem nome";
  let y = 0;

  const cor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const preenche = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const linhasDe = (texto: string, largura: number) => doc.splitTextToSize(limpar(texto), largura) as string[];
  const novaPagina = () => {
    doc.addPage();
    y = MARGEM;
  };
  const precisa = (altura: number) => {
    if (y + altura > LIMITE_Y) novaPagina();
  };

  // ---- 1. Faixa superior grafite
  doc.setFont(DISPLAY, "bold");
  doc.setFontSize(28);
  const linhasObra = linhasDe(nomeObra, LARGURA);
  const altFaixa = 24 + linhasObra.length * 10 + 8;
  preenche(GRAFITE);
  doc.rect(0, 0, 210, altFaixa, "F");
  doc.setFont(TEXTO, "bold");
  doc.setFontSize(10);
  cor(AMARELO);
  doc.text(limpar("RELATÓRIO INTERNO: NÃO ENVIAR AO CLIENTE"), MARGEM, 13);
  doc.setFont(DISPLAY, "bold");
  doc.setFontSize(28);
  cor(BRANCO);
  doc.text(linhasObra, MARGEM, 24);
  doc.setFont(TEXTO, "normal");
  doc.setFontSize(10);
  cor(CINZA_PAINEL);
  const sub = [o.cliente.trim() ? `Cliente: ${o.cliente.trim()}` : "", `Data: ${dataBR(o.atualizadoEm)}`].filter(Boolean).join("   ·   ");
  doc.text(limpar(sub), MARGEM, 24 + linhasObra.length * 10);
  y = altFaixa + 8;

  // ---- 2. Placa amarela "VALOR A COBRAR"
  const caixaH = 46;
  preenche(AMARELO);
  doc.roundedRect(MARGEM, y, LARGURA, caixaH, 4, 4, "F");
  cor(TINTA);
  doc.setFont(TEXTO, "bold");
  doc.setFontSize(10);
  doc.text(o.valorFechado === null ? "VALOR A COBRAR" : "VALOR COMBINADO", MARGEM + 6, y + 9);
  doc.setFont(DISPLAY, "bold");
  doc.setFontSize(preco === null ? 26 : 42);
  doc.text(preco === null ? "Sem preço possível" : limpar(brl(preco)), MARGEM + 6, y + 24);
  doc.setFont(TEXTO, "normal");
  doc.setFontSize(10);
  const sim = preco === null ? null : simularPreco(o, preco);
  const linhaLucro =
    sim === null
      ? "Imposto + margem desejada chegam a 100% ou mais."
      : `${lucroOuPrejuizo(sim.lucro)} depois do imposto  ·  margem de ${pct(sim.margem)}`;
  doc.text(limpar(linhaLucro), MARGEM + 6, y + 33);
  doc.setFont(TEXTO, "bold");
  doc.text(limpar(`Situação pela regra: ${TEXTO_STATUS[r.status]} (${pct(r.margem)})`), MARGEM + 6, y + 39.5);
  y += caixaH + 8;

  // ---- 3. Relatório
  const blocos = gerarRelatorio(o);
  let primeiroParagrafo = true;
  cor(TINTA);

  // Estimativa para manter tabelas pequenas inteiras na mesma página (as grandes quebram normalmente).
  const alturaTabela = (t: Extract<Bloco, { tipo: "tabela" }>) => Math.min(120, (t.linhas.length + (t.cabecalho ? 1 : 0)) * 11);

  for (const [i, b] of blocos.entries()) {
    switch (b.tipo) {
      case "titulo": {
        const seguinte = blocos[i + 1];
        precisa(14 + (seguinte?.tipo === "tabela" ? alturaTabela(seguinte) : 28)); // não deixa o título sozinho no fim da página
        y += 3;
        doc.setFont(DISPLAY, "bold");
        doc.setFontSize(18);
        cor(TINTA);
        doc.text(limpar(b.texto), MARGEM, y + 5);
        preenche(AMARELO);
        doc.rect(MARGEM, y + 7, 18, 1.1, "F");
        y += 12.5;
        break;
      }
      case "paragrafo": {
        doc.setFont(TEXTO, primeiroParagrafo ? "bold" : "normal");
        doc.setFontSize(primeiroParagrafo ? 11 : 10);
        cor(TINTA);
        const passo = primeiroParagrafo ? 5.6 : 5;
        for (const l of linhasDe(b.texto, LARGURA)) {
          precisa(passo);
          doc.text(l, MARGEM, y + 4);
          y += passo;
        }
        y += 2.5;
        primeiroParagrafo = false;
        break;
      }
      case "lista": {
        doc.setFont(TEXTO, "normal");
        doc.setFontSize(10);
        cor(TINTA);
        for (const item of b.itens) {
          const ls = linhasDe(item, LARGURA - 6);
          ls.forEach((l, k) => {
            precisa(5);
            if (k === 0) doc.text("-", MARGEM + 1, y + 4);
            doc.text(l, MARGEM + 6, y + 4);
            y += 5;
          });
          y += 1.2;
        }
        y += 1.5;
        break;
      }
      case "tabela": {
        precisa(alturaTabela(b));
        const numerica = (b.cabecalho ?? b.linhas[0]).map((_, j) => colunaNumerica(b, j));
        const estiloColuna = Object.fromEntries(numerica.map((n, j) => [j, n ? { halign: "right", minCellWidth: 30 } : { halign: "left" }])); // largura mínima: "R$" não se separa do valor
        autoTable(doc, {
          startY: y,
          margin: { left: MARGEM, right: MARGEM, bottom: 20 },
          head: b.cabecalho ? [b.cabecalho.map(limpar)] : undefined,
          body: b.linhas.map((l) => l.map(limpar)),
          theme: "grid",
          styles: { font: TEXTO, fontStyle: "normal", fontSize: 9, cellPadding: 2.2, lineColor: LINHA, lineWidth: 0.2, textColor: TINTA },
          headStyles: { fillColor: GRAFITE, textColor: BRANCO, fontStyle: "bold" },
          columnStyles: estiloColuna as never,
          rowPageBreak: "avoid",
          didParseCell: (d) => {
            if (d.section === "head") d.cell.styles.halign = numerica[d.column.index] ? "right" : "left";
            if (d.section === "body" && b.ultimaEmDestaque && d.row.index === b.linhas.length - 1) {
              d.cell.styles.fontStyle = "bold";
              d.cell.styles.fillColor = AMARELO_CLARO;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
        break;
      }
      case "caixa": {
        const t = TOM[b.tom];
        doc.setFont(TEXTO, "normal");
        doc.setFontSize(10);
        const corpo = b.textos.flatMap((tx) => [...linhasDe(tx, LARGURA - 12), ""]);
        corpo.pop();
        const alt = 9 + corpo.length * 5 + 4;
        precisa(alt);
        preenche(t.fundo);
        doc.roundedRect(MARGEM, y, LARGURA, alt, 3, 3, "F");
        doc.setFont(TEXTO, "bold");
        cor(t.borda);
        doc.text(limpar(b.titulo), MARGEM + 6, y + 6.5);
        doc.setFont(TEXTO, "normal");
        cor(TINTA);
        corpo.forEach((l, k) => doc.text(l, MARGEM + 6, y + 12 + k * 5));
        y += alt + 5;
        break;
      }
    }
  }

  // ---- 4. Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(LINHA[0], LINHA[1], LINHA[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, ALTURA - 14, 210 - MARGEM, ALTURA - 14);
    doc.setFont(TEXTO, "normal");
    doc.setFontSize(8);
    cor(CINZA);
    doc.text(limpar(`Gerado no Orça Obra · ${hoje}`), MARGEM, ALTURA - 9);
    doc.text(`${p}/${total}`, 210 - MARGEM, ALTURA - 9, { align: "right" });
  }

  return doc.output("blob");
}
