import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { AJUSTES_PADRAO, orcamentoExemplo, valoresDeEquipe } from "../domain/defaults";
import { PLANOS } from "../domain/pagamento";
import { gerarExcel } from "./excel";
import { gerarPdf, limpar } from "./pdf";
import { gerarProposta } from "./proposta";

// Os arquivos gerados ficam numa pasta para conferência manual (SAIDA_EXPORT) ou são descartados.
const SAIDA = process.env.SAIDA_EXPORT;

async function lerExcel(blob: Blob) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await blob.arrayBuffer());
  return wb;
}

describe("Excel do caso de teste", () => {
  it("fórmulas vivas e valores em cache", async () => {
    const blob = await gerarExcel(orcamentoExemplo());
    if (SAIDA) {
      mkdirSync(SAIDA, { recursive: true });
      writeFileSync(join(SAIDA, "Orcamento_exemplo.xlsx"), Buffer.from(await blob.arrayBuffer()));
    }
    const wb = await lerExcel(blob);
    const resumo = wb.getWorksheet("Resumo")!;
    const custos = wb.getWorksheet("Custos")!;
    const v = (addr: string) => resumo.getCell(addr).value as { formula: string; result: number };

    expect(v("B22").formula).toBe("SUM(B19:B21)");
    expect(v("B22").result).toBe(51800);
    expect(v("B26").result).toBe(12600);
    expect(v("B27").result).toBeCloseTo(575, 6);
    expect(v("B28").result).toBeCloseTo(51750, 6);
    expect(v("B29").result).toBeCloseTo(64925, 6);
    expect(v("B32").result).toBeCloseTo(9738.75, 6);
    expect(v("B33").result).toBeCloseTo(3386.25, 6);
    expect(v("B34").result * 100).toBeCloseTo(5.2157, 3);
    expect(v("B38").result).toBeCloseTo(74000, 6);
    expect(v("B39").result).toBeCloseTo(79692.3077, 3);
    expect(v("B40").result).toBeCloseTo(74000, 6);
    expect(v("B40").formula).toBe("IF(B22=0,0,IF(B34<B11,B38,IF(B34>B12,B39,B29)))");
    expect((resumo.getCell("B35").value as { result: string }).result).toBe("Abaixo da faixa: risco de prejuízo");

    // Parâmetros como fração e lista de forma de compra
    expect(resumo.getCell("B10").value).toBe(0.15);
    expect(resumo.getCell("B14").value).toBe("Faturamento direto");
    expect(resumo.getCell("B14").dataValidation.type).toBe("list");

    // Referências para as linhas de total certas na aba Custos
    const refMO = v("B19").formula;
    const refFer = v("B20").formula;
    const refMat = v("B21").formula;
    expect(refMO).toBe("Custos!B13");
    const linhaFer = Number(refFer.match(/B(\d+)$/)![1]);
    const linhaMat = Number(refMat.match(/D(\d+)$/)![1]);
    expect(custos.getCell(`A${linhaFer}`).value).toBe("Total ferramentas");
    expect(custos.getCell(`A${linhaMat}`).value).toBe("Total materiais");
    expect((custos.getCell(`B${linhaFer}`).value as { result: number }).result).toBe(500);
    expect((custos.getCell(`D${linhaMat}`).value as { result: number }).result).toBe(45000);
    expect(custos.getCell("B13").value).toMatchObject({ formula: "B10*B11*B12", result: 6300 });
  });

  it("empurra as linhas de total quando há muitos itens", async () => {
    const o = orcamentoExemplo();
    o.ferramentas = Array.from({ length: 8 }, (_, i) => ({ descricao: `F${i}`, valor: 10 }));
    o.materiais = Array.from({ length: 30 }, (_, i) => ({ descricao: `M${i}`, quantidade: 2, precoUnitario: 5 }));
    const wb = await lerExcel(await gerarExcel(o));
    const resumo = wb.getWorksheet("Resumo")!;
    const custos = wb.getWorksheet("Custos")!;
    const refFer = (resumo.getCell("B20").value as { formula: string }).formula;
    const refMat = (resumo.getCell("B21").value as { formula: string }).formula;
    const lf = Number(refFer.match(/B(\d+)$/)![1]);
    const lm = Number(refMat.match(/D(\d+)$/)![1]);
    expect(custos.getCell(`A${lf}`).value).toBe("Total ferramentas");
    expect(custos.getCell(`A${lm}`).value).toBe("Total materiais");
    expect((custos.getCell(`D${lm}`).value as { result: number }).result).toBe(300);
  });

  it("mostra o lucro cobrando o recomendado e o valor combinado", async () => {
    const wb = await lerExcel(await gerarExcel({ ...orcamentoExemplo(), valorFechado: 70000 }));
    const resumo = wb.getWorksheet("Resumo")!;
    const v = (addr: string) => resumo.getCell(addr).value as { formula: string; result: number };
    expect(v("B41").formula).toBe("B40-B22-B40*B10");
    expect(v("B41").result).toBeCloseTo(11100, 6);
    expect(v("B42").result).toBeCloseTo(0.15, 6);
    expect(resumo.getCell("B43").value).toBe(70000);
    expect(v("B44").result).toBeCloseTo(7700, 6);
  });

  it("sem ajudante muda os rótulos", async () => {
    const wb = await lerExcel(await gerarExcel({ ...orcamentoExemplo(), ...valoresDeEquipe(true) }));
    const custos = wb.getWorksheet("Custos")!;
    expect(custos.getCell("A12").value).toBe("Eletricistas");
    expect((custos.getCell("B13").value as { result: number }).result).toBe(285 * 15);
  });

  it("forma de compra Meu CNPJ", async () => {
    const wb = await lerExcel(await gerarExcel({ ...orcamentoExemplo(), formaCompra: "meu_cnpj" }));
    const resumo = wb.getWorksheet("Resumo")!;
    expect(resumo.getCell("B14").value).toBe("Meu CNPJ");
    expect((resumo.getCell("B40").value as { result: number }).result).toBeCloseTo(76175, 6);
  });
});

describe("PDF do caso de teste", () => {
  it("gera um PDF válido com várias páginas de rodapé", async () => {
    const blob = await gerarPdf(orcamentoExemplo());
    const bytes = Buffer.from(await blob.arrayBuffer());
    if (SAIDA) {
      mkdirSync(SAIDA, { recursive: true });
      writeFileSync(join(SAIDA, "Orcamento_exemplo.pdf"), bytes);
    }
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(5000);
  });

  it("gera a proposta com logo, parcelas e aceite", async () => {
    // PNG de 1×1 pixel
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const o = {
      ...orcamentoExemplo(),
      escopo: "Instalação completa",
      parcelas: PLANOS[0].parcelas,
      aceite: { nome: "Maria", assinatura: png, em: Date.now() },
    };
    const blob = await gerarProposta(o, { nome: "Elétrica Silva", cnpj: "00.000.000/0001-00", telefone: "11 90000-0000", logo: png });
    const bytes = Buffer.from(await blob.arrayBuffer());
    if (SAIDA) {
      mkdirSync(SAIDA, { recursive: true });
      writeFileSync(join(SAIDA, "Proposta_exemplo.pdf"), bytes);
    }
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(5000);
  });

  it("proposta funciona sem dados da empresa e sem preço possível", async () => {
    const blob = await gerarProposta({ ...orcamentoExemplo(), imposto: 90 }, AJUSTES_PADRAO.empresa);
    expect(Buffer.from(await blob.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("troca caracteres que quebram a Helvetica", () => {
    expect(limpar("A − B C D")).toBe("A - B C D");
  });
});
