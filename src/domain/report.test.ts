import { describe, expect, it } from "vitest";
import { orcamentoExemplo } from "./defaults";
import { gerarRelatorio, relatorioComoTexto } from "./report";

describe("relatório do caso de teste", () => {
  const texto = relatorioComoTexto(gerarRelatorio(orcamentoExemplo()));

  it("resumo usa o valor recomendado", () => {
    expect(texto).toContain("Cobre R$ 74.000,00.");
    expect(texto).toContain("R$ 11.100,00 de imposto");
    expect(texto).toContain("sobram R$ 11.100,00 de lucro, ou 15% do valor da obra");
  });
  it("mostra custo, venda e imposto", () => {
    expect(texto).toContain("R$ 51.800,00");
    expect(texto).toContain("R$ 6.300,00");
    expect(texto).toContain("R$ 420,00");
    expect(texto).toContain("R$ 64.925,00");
    expect(texto).toContain("R$ 9.738,75");
    expect(texto).toContain("R$ 3.386,25");
    expect(texto).toContain("5,2%");
  });
  it("explica a diferença entre regra e recomendado", () => {
    expect(texto).toContain("R$ 74.000,00, R$ 9.075,00 a mais que o preço pela regra");
    expect(texto).toContain("R$ 79.692,31");
  });
  it("orientações comerciais", () => {
    expect(texto).toContain("R$ 2.250,00");
    expect(texto).toContain("preço de mercado + 15%");
  });
});

describe("relatório dentro da faixa", () => {
  const texto = relatorioComoTexto(gerarRelatorio({ ...orcamentoExemplo(), formaCompra: "meu_cnpj" }));
  it("recomendado = regra", () => {
    expect(texto).toContain("Cobre R$ 76.175,00.");
    expect(texto).toContain("O valor recomendado é o próprio preço pela regra");
  });
});
