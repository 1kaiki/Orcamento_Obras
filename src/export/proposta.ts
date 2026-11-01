import { brl, dataBR } from "../domain/format";
import { dadosProposta } from "../domain/proposta";
import type { DadosEmpresa, Orcamento } from "../domain/types";
import { AMARELO, BRANCO, CINZA, CINZA_PAINEL, DISPLAY, GRAFITE, limpar, LINHA, registrarFontes, TEXTO, TINTA, type RGB } from "./pdf";

const MARGEM = 16;
const LARGURA = 210 - MARGEM * 2;
const ALTURA = 297;
const LIMITE_Y = ALTURA - 20;

/** PDF para o cliente. O conteúdo vem só de `dadosProposta`, que não tem custo, imposto nem lucro. */
export async function gerarProposta(o: Orcamento, empresa: DadosEmpresa): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const p = dadosProposta(o, empresa);
  const titulo = p.aceite ? "TERMO DE ACEITE" : "PROPOSTA COMERCIAL";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `${p.aceite ? "Termo de aceite" : "Proposta"} - ${p.obra}`, creator: empresa.nome.trim() || "Orça Obra" });
  registrarFontes(doc);

  const cor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const preenche = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const linhasDe = (texto: string, largura: number) => doc.splitTextToSize(limpar(texto), largura) as string[];
  let y = 0;
  const precisa = (altura: number) => {
    if (y + altura > LIMITE_Y) {
      doc.addPage();
      y = MARGEM;
    }
  };

  // ---- Faixa superior com a empresa e a obra
  doc.setFont(DISPLAY, "bold");
  doc.setFontSize(26);
  const linhasObra = linhasDe(p.obra, LARGURA - 34);
  const altFaixa = Math.max(44, 26 + linhasObra.length * 9 + 8);
  preenche(GRAFITE);
  doc.rect(0, 0, 210, altFaixa, "F");
  if (empresa.logo) {
    try {
      const img = doc.getImageProperties(empresa.logo);
      const escala = Math.min(26 / img.width, 26 / img.height);
      doc.addImage(empresa.logo, "PNG", 210 - MARGEM - img.width * escala, 9, img.width * escala, img.height * escala, undefined, "FAST");
    } catch {
      // Logo inválido não impede a proposta.
    }
  }
  doc.setFont(TEXTO, "bold");
  doc.setFontSize(10);
  cor(AMARELO);
  doc.text(limpar(titulo), MARGEM, 13);
  doc.setFont(DISPLAY, "bold");
  doc.setFontSize(26);
  cor(BRANCO);
  doc.text(linhasObra, MARGEM, 24);
  doc.setFont(TEXTO, "normal");
  doc.setFontSize(10);
  cor(CINZA_PAINEL);
  doc.text(limpar([p.cliente ? `Cliente: ${p.cliente}` : "", `Data: ${p.data}`].filter(Boolean).join("   ·   ")), MARGEM, 24 + linhasObra.length * 9);
  y = altFaixa + 8;

  const titulo2 = (texto: string) => {
    precisa(18);
    doc.setFont(DISPLAY, "bold");
    doc.setFontSize(16);
    cor(TINTA);
    doc.text(limpar(texto), MARGEM, y + 5);
    preenche(AMARELO);
    doc.rect(MARGEM, y + 7, 18, 1.1, "F");
    y += 12;
  };
  const paragrafo = (texto: string) => {
    doc.setFont(TEXTO, "normal");
    doc.setFontSize(10);
    cor(TINTA);
    for (const l of linhasDe(texto, LARGURA)) {
      precisa(5);
      doc.text(l, MARGEM, y + 4);
      y += 5;
    }
    y += 2;
  };
  const tabela = (cabecalho: string[], linhas: string[][], direita: number[] = []) => {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGEM, right: MARGEM, bottom: 20 },
      head: [cabecalho.map(limpar)],
      body: linhas.map((l) => l.map(limpar)),
      theme: "grid",
      styles: { font: TEXTO, fontStyle: "normal", fontSize: 9, cellPadding: 2.2, lineColor: LINHA, lineWidth: 0.2, textColor: TINTA },
      headStyles: { fillColor: GRAFITE, textColor: BRANCO, fontStyle: "bold" },
      columnStyles: Object.fromEntries(direita.map((c) => [c, { halign: "right" }])) as never,
      rowPageBreak: "avoid",
    });
    y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  // ---- Valor
  preenche(AMARELO);
  doc.roundedRect(MARGEM, y, LARGURA, 32, 4, 4, "F");
  cor(TINTA);
  doc.setFont(TEXTO, "bold");
  doc.setFontSize(10);
  doc.text("VALOR TOTAL", MARGEM + 6, y + 9);
  doc.setFont(DISPLAY, "bold");
  doc.setFontSize(32);
  doc.text(limpar(p.valor === null ? "A combinar" : brl(p.valor)), MARGEM + 6, y + 21);
  doc.setFont(TEXTO, "normal");
  doc.setFontSize(10);
  doc.text(limpar(`Prazo: ${p.prazo}   ·   Válida até ${p.validaAte}`), MARGEM + 6, y + 28);
  y += 40;

  // ---- Escopo
  if (p.escopo) {
    titulo2("O que será feito");
    paragrafo(p.escopo);
    y += 2;
  }
  if (p.materiais.length) {
    titulo2("Materiais incluídos");
    tabela(["Material", "Qtd"], p.materiais.map((m) => [m.descricao, m.quantidade]), [1]);
  }

  // ---- Pagamento
  if (p.parcelas.length) {
    titulo2("Condições de pagamento");
    if (p.materialDireto > 0) paragrafo(`Do valor total, ${brl(p.materialDireto)} correspondem aos materiais, pagos diretamente ao fornecedor. As parcelas abaixo são sobre o restante.`);
    tabela(["Parcela", "%", "Valor"], p.parcelas.map((c) => [c.rotulo, `${c.percentual}%`, brl(c.valor)]), [1, 2]);
  }

  // ---- Condições
  titulo2("Condições gerais");
  for (const c of p.condicoes) paragrafo(`- ${c}`);
  y += 2;

  // ---- Contato ou aceite
  if (p.aceite) {
    precisa(50);
    titulo2("Aceite");
    paragrafo(`De acordo com esta proposta. ${p.aceite.nome ? `Assinado por ${p.aceite.nome} ` : "Assinado "}em ${dataBR(p.aceite.em)}.`);
    let altura = 28;
    try {
      const img = doc.getImageProperties(p.aceite.assinatura);
      altura = (70 * img.height) / img.width;
      doc.addImage(p.aceite.assinatura, "PNG", MARGEM, y, 70, altura, undefined, "FAST");
    } catch {
      // Assinatura ilegível: o texto do aceite continua.
    }
    y += altura + 2;
    doc.setDrawColor(LINHA[0], LINHA[1], LINHA[2]);
    doc.line(MARGEM, y, MARGEM + 70, y);
  }

  // ---- Rodapé
  const contato = [empresa.nome.trim(), empresa.cnpj.trim() && `CNPJ ${empresa.cnpj.trim()}`, empresa.telefone.trim()].filter(Boolean).join("  ·  ");
  const total = doc.getNumberOfPages();
  for (let n = 1; n <= total; n++) {
    doc.setPage(n);
    doc.setDrawColor(LINHA[0], LINHA[1], LINHA[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, ALTURA - 14, 210 - MARGEM, ALTURA - 14);
    doc.setFont(TEXTO, "normal");
    doc.setFontSize(8);
    cor(CINZA);
    if (contato) doc.text(limpar(contato), MARGEM, ALTURA - 9);
    doc.text(`${n}/${total}`, 210 - MARGEM, ALTURA - 9, { align: "right" });
  }

  return doc.output("blob");
}
