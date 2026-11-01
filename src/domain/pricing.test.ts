import { describe, expect, it } from "vitest";
import { orcamentoExemplo, novoOrcamento } from "./defaults";
import { calcular, precoParaMargem, statusDaMargem } from "./pricing";
import { brl, parseValorBR, nomeArquivo, pct } from "./format";

const casa2 = (v: number | null) => Math.round((v as number) * 100) / 100;

describe("caso de teste 1: faturamento direto", () => {
  const r = calcular(orcamentoExemplo());

  it("custos", () => {
    expect(r.custoDuplaDia).toBe(420);
    expect(r.mo).toBe(6300);
    expect(r.A).toBe(51800);
  });
  it("venda por parte", () => {
    expect(r.B).toBe(12600);
    expect(r.C).toBeCloseTo(575, 6);
    expect(r.D).toBeCloseTo(51750, 6);
    expect(r.precoRegra).toBeCloseTo(64925, 6);
  });
  it("imposto, resultado e margem (resultado correto é 3.386,25, não 13.125)", () => {
    expect(r.E).toBeCloseTo(9738.75, 6);
    expect(r.resultado).toBeCloseTo(3386.25, 6);
    expect(Math.abs(r.resultado - 13125)).toBeGreaterThan(1000);
    expect(r.margem * 100).toBeCloseTo(5.2157, 3);
    expect(pct(r.margem)).toBe("5,2%");
    expect(r.status).toBe("abaixo");
  });
  it("preços sugeridos e recomendado", () => {
    expect(casa2(r.precoMin)).toBe(74000);
    expect(casa2(r.precoMax)).toBe(79692.31);
    expect(casa2(r.recomendado)).toBe(74000);
    expect(casa2(r.lucroRecomendado)).toBeCloseTo(74000 - 51800 - 11100, 2);
    expect((r.margemRecomendada as number) * 100).toBeCloseTo(15, 6);
  });
});

describe("caso de teste 2: material no meu CNPJ", () => {
  const r = calcular({ ...orcamentoExemplo(), formaCompra: "meu_cnpj" });

  it("valores", () => {
    expect(r.D).toBeCloseTo(63000, 6);
    expect(r.precoRegra).toBeCloseTo(76175, 6);
    expect(r.E).toBeCloseTo(11426.25, 6);
    expect(r.resultado).toBeCloseTo(12948.75, 6);
    expect(pct(r.margem)).toBe("17%");
    expect(r.margem * 100).toBeCloseTo(17.0, 1);
    expect(r.status).toBe("dentro");
  });
  it("recomendado é o preço pela regra", () => {
    expect(r.recomendado).toBe(r.precoRegra);
    expect(casa2(r.recomendado)).toBe(76175);
  });
});

describe("casos de borda", () => {
  it("margem acima de 20% recomenda o preço para 20%", () => {
    const o = { ...orcamentoExemplo(), formaCompra: "meu_cnpj" as const, markupMO: 300 };
    const r = calcular(o);
    expect(r.margem).toBeGreaterThan(0.2);
    expect(r.status).toBe("acima");
    expect(r.recomendado).toBeCloseTo(r.precoMax as number, 6);
    expect(r.recomendado).toBeLessThan(r.precoRegra);
  });

  it("prejuízo: markups zerados", () => {
    const o = { ...orcamentoExemplo(), markupMO: 0, markupFerramentas: 0, markupMaterialDireto: 0 };
    const r = calcular(o);
    expect(r.resultado).toBeLessThan(0);
    expect(r.status).toBe("prejuizo");
    expect(r.recomendado).toBeCloseTo(r.precoMin as number, 6);
  });

  it("sem preço possível quando imposto + margem >= 100%", () => {
    const o = { ...orcamentoExemplo(), imposto: 90 };
    const r = calcular(o);
    expect(r.precoMin).toBeNull();
    expect(r.precoMax).toBeNull();
    expect(r.recomendado).toBeNull();
    expect(precoParaMargem(100, 0.85, 0.15)).toBeNull();
  });

  it("orçamento vazio não quebra", () => {
    const o = { ...novoOrcamento(), dias: 0, diariaEletricista: 0, diariaAjudante: 0, passagem: 0, almoco: 0 };
    const r = calcular(o);
    expect(r.A).toBe(0);
    expect(r.margem).toBe(0);
    expect(r.recomendado).toBe(0);
    expect(Number.isNaN(r.precoRegra)).toBe(false);
  });

  it("duplas multiplicam a mão de obra", () => {
    const r = calcular({ ...orcamentoExemplo(), duplas: 2 });
    expect(r.mo).toBe(12600);
  });

  it("materiais somam quantidade × preço unitário", () => {
    const o = {
      ...orcamentoExemplo(),
      materiais: [
        { descricao: "Cabo", quantidade: 10, precoUnitario: 12.5 },
        { descricao: "Disjuntor", quantidade: 2, precoUnitario: 30 },
      ],
    };
    expect(calcular(o).materiais).toBe(185);
  });

  it("5% de desconto nos materiais", () => {
    expect(calcular(orcamentoExemplo()).descontoMateriais5).toBeCloseTo(2250, 6);
  });

  it("fronteiras da faixa", () => {
    expect(statusDaMargem(-0.01, 0.15, 0.2)).toBe("prejuizo");
    expect(statusDaMargem(0, 0.15, 0.2)).toBe("abaixo");
    expect(statusDaMargem(0.15, 0.15, 0.2)).toBe("dentro");
    expect(statusDaMargem(0.2, 0.15, 0.2)).toBe("dentro");
    expect(statusDaMargem(0.2001, 0.15, 0.2)).toBe("acima");
  });

  it("cobrar o preço para 15% dá margem de 15% e fica na faixa", () => {
    const r = calcular(orcamentoExemplo());
    expect(statusDaMargem(r.margemRecomendada as number, 0.15, 0.2)).toBe("dentro");
  });
});

describe("format", () => {
  it("parseValorBR", () => {
    expect(parseValorBR("45000")).toBe(45000);
    expect(parseValorBR("45.000")).toBe(45000);
    expect(parseValorBR("45.000,50")).toBe(45000.5);
    expect(parseValorBR("45,5")).toBe(45.5);
    expect(parseValorBR("R$ 1.234,56")).toBe(1234.56);
    expect(parseValorBR("1.234.567")).toBe(1234567);
    expect(parseValorBR("12.5")).toBe(12.5);
    expect(parseValorBR("")).toBe(0);
    expect(parseValorBR("abc")).toBe(0);
  });
  it("brl", () => {
    expect(brl(1234.56)).toBe("R$ 1.234,56");
    expect(brl(64925)).toBe("R$ 64.925,00");
    expect(brl(-0)).toBe("R$ 0,00");
  });
  it("nomeArquivo sem acentos", () => {
    expect(nomeArquivo("Loja São João", "xlsx")).toBe("Orcamento_Loja-Sao-Joao.xlsx");
    expect(nomeArquivo("", "pdf")).toBe("Orcamento_Sem-nome.pdf");
  });
});
