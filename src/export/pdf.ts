import type { jsPDF } from "jspdf";
import { brl, dataBR, pct } from "../domain/format";
import { calcular, TEXTO_STATUS } from "../domain/pricing";
import { colunaNumerica, gerarRelatorio, type Tom } from "../domain/report";
import type { Orcamento } from "../domain/types";

type RGB = [number, number, number];

const ESCURO: RGB = [0x14, 0x1b, 0x24];
const AMARELO: RGB = [0xf2, 0xb0, 0x1e];
const TEXTO_SOBRE_AMARELO: RGB = [0x2b, 0x1f, 0x00];
const CINZA: RGB = [0x5e, 0x68, 0x75];
const TOM: Record<Tom, { fundo: RGB; borda: RGB }> = {
  verde: { fundo: [0xe3, 0xf3, 0xea], borda: [0x1d, 0x7a, 0x45] },
  amarelo: { fundo: [0xfc, 0xf0, 0xd0], borda: [0x8f, 0x5e, 0x00] },
  vermelho: { fundo: [0xfb, 0xe4, 0xe0], borda: [0xb0, 0x38, 0x2a] },
};

const MARGEM = 16;
const LARGURA = 210 - MARGEM * 2;
const ALTURA = 297;
const LIMITE_Y = ALTURA - 20; // deixa espaço para o rodapé

/** Helvetica padrão não tem "−" nem espaços especiais: troca por equivalentes simples. */
export function limpar(texto: string): string {
  return texto
    .replace(/[−–—]/g, "-")
    .replace(/[    ]/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

export async function gerarPdf(o: Orcamento): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const r = calcular(o);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `Orçamento - ${o.obra.trim() || "Sem nome"}`, creator: "Orça Obra" });

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

  // ---- 1. Faixa superior escura
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const linhasObra = linhasDe(nomeObra, LARGURA);
  const altFaixa = 22 + linhasObra.length * 8 + 8;
  preenche(ESCURO);
  doc.rect(0, 0, 210, altFaixa, "F");
  doc.setFontSize(10);
  cor(AMARELO);
  doc.text(limpar("ORÇAMENTO DE OBRA"), MARGEM, 13);
  doc.setFontSize(20);
  cor([255, 255, 255]);
  doc.text(linhasObra, MARGEM, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  cor([0xc4, 0xcc, 0xd6]);
  const sub = [o.cliente.trim() ? `Cliente: ${o.cliente.trim()}` : "", `Data: ${dataBR(o.atualizadoEm)}`].filter(Boolean).join("   ·   ");
  doc.text(limpar(sub), MARGEM, 22 + linhasObra.length * 8 + 1);
  y = altFaixa + 8;

  // ---- 2. Caixa amarela "VALOR A COBRAR"
  const caixaH = 36;
  preenche(AMARELO);
  doc.roundedRect(MARGEM, y, LARGURA, caixaH, 2, 2, "F");
  cor(TEXTO_SOBRE_AMARELO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VALOR A COBRAR", MARGEM + 6, y + 8);
  doc.setFontSize(r.recomendado === null ? 16 : 26);
  doc.text(r.recomendado === null ? "Sem preço possível" : limpar(brl(r.recomendado)), MARGEM + 6, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const linhaLucro =
    r.recomendado === null
      ? "Imposto + margem desejada chegam a 100% ou mais."
      : `Lucro de ${brl(r.lucroRecomendado as number)} depois do imposto  ·  margem de ${pct(r.margemRecomendada as number)}`;
  doc.text(limpar(linhaLucro), MARGEM + 6, y + 27);
  doc.setFont("helvetica", "bold");
  doc.text(limpar(`Situação pela regra: ${TEXTO_STATUS[r.status]} (${pct(r.margem)})`), MARGEM + 6, y + 32);
  y += caixaH + 8;

  // ---- 3. Relatório
  const blocos = gerarRelatorio(o);
  let primeiroParagrafo = true;
  doc.setTextColor(0, 0, 0);

  for (const b of blocos) {
    switch (b.tipo) {
      case "titulo": {
        precisa(14 + 28); // não deixa o título sozinho no fim da página
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        cor(ESCURO);
        doc.text(limpar(b.texto), MARGEM, y + 5);
        preenche(AMARELO);
        doc.rect(MARGEM, y + 7, 18, 0.9, "F");
        y += 12;
        break;
      }
      case "paragrafo": {
        doc.setFont("helvetica", primeiroParagrafo ? "bold" : "normal");
        doc.setFontSize(primeiroParagrafo ? 11 : 10);
        cor(primeiroParagrafo ? ESCURO : [0x22, 0x2a, 0x35]);
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
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        cor([0x22, 0x2a, 0x35]);
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
        const numerica = (b.cabecalho ?? b.linhas[0]).map((_, j) => colunaNumerica(b, j));
        const estiloColuna = Object.fromEntries(numerica.map((n, j) => [j, { halign: n ? "right" : "left" }]));
        autoTable(doc, {
          startY: y,
          margin: { left: MARGEM, right: MARGEM, bottom: 20 },
          head: b.cabecalho ? [b.cabecalho.map(limpar)] : undefined,
          body: b.linhas.map((l) => l.map(limpar)),
          theme: "grid",
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, lineColor: [0xdc, 0xe0, 0xe5], lineWidth: 0.2, textColor: [0x14, 0x1b, 0x24] },
          headStyles: { fillColor: [0x1f, 0x38, 0x64], textColor: [255, 255, 255], fontStyle: "bold" },
          columnStyles: estiloColuna as never,
          rowPageBreak: "avoid",
          didParseCell: (d) => {
            if (d.section === "head") d.cell.styles.halign = numerica[d.column.index] ? "right" : "left";
            if (d.section === "body" && b.ultimaEmDestaque && d.row.index === b.linhas.length - 1) {
              d.cell.styles.fontStyle = "bold";
              d.cell.styles.fillColor = [0xe2, 0xef, 0xda];
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
        break;
      }
      case "caixa": {
        const t = TOM[b.tom];
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const corpo = b.textos.flatMap((tx) => [...linhasDe(tx, LARGURA - 10), ""]);
        corpo.pop();
        const alt = 9 + corpo.length * 5 + 4;
        precisa(alt);
        preenche(t.fundo);
        doc.setDrawColor(t.borda[0], t.borda[1], t.borda[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(MARGEM, y, LARGURA, alt, 2, 2, "FD");
        preenche(t.borda);
        doc.rect(MARGEM, y, 2.2, alt, "F");
        doc.setFont("helvetica", "bold");
        cor(t.borda);
        doc.text(limpar(b.titulo), MARGEM + 6, y + 6.5);
        doc.setFont("helvetica", "normal");
        cor([0x14, 0x1b, 0x24]);
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
    doc.setDrawColor(0xdc, 0xe0, 0xe5);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, ALTURA - 14, 210 - MARGEM, ALTURA - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    cor(CINZA);
    doc.text(limpar(`Gerado no Orça Obra · ${hoje}`), MARGEM, ALTURA - 9);
    doc.text(`${p}/${total}`, 210 - MARGEM, ALTURA - 9, { align: "right" });
  }

  return doc.output("blob");
}
