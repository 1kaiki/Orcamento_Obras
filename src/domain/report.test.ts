import { describe, expect, it } from "vitest";
import { orcamentoExemplo } from "./defaults";
import { gerarRelatorio, relatorioComoTexto } from "./report";

describe("relatório do caso de teste", () => {
  const texto = relatorioComoTexto(gerarRelatorio(orcamentoExemplo()));

  it("resumo usa o valor recomendado", () => {
    expect(texto).toContain("Cobre R$ 74.000,00.");
    expect(texto).toContain("R$ 51.800,00 pagam os custos da obra, R$ 11.100,00 vão para o imposto e R$ 11.100,00 ficam de lucro");
    expect(texto).toContain("R$ 15,00 viram lucro. Essa é a sua margem de 15%");
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
    expect(texto).toContain("R$ 74.000,00, R$ 9.075,00 a mais que o preço da regra");
    expect(texto).toContain("R$ 79.692,31");
  });
  it("orientações comerciais", () => {
    expect(texto).toContain("R$ 2.250,00");
    expect(texto).toContain("preço de mercado + 15%");
  });
  it("faixa para negociar separa lucro menor de prejuízo de verdade", () => {
    expect(texto).toContain("Abaixo de R$ 74.000,00 o lucro fica menor que o mínimo");
    expect(texto).toContain("abaixo de R$ 60.941,18 você tem prejuízo");
    expect(texto).not.toContain("Abaixo do primeiro você toma prejuízo");
  });
  it("avisa que material extra dá prejuízo com 15% de imposto", () => {
    expect(texto).toContain("prejuízo de R$ 2,25 a cada R$ 100,00");
  });
  it("explica as palavras", () => {
    expect(texto).toContain("Margem: a parte do valor cobrado que vira lucro");
  });
});

describe("relatório dentro da faixa", () => {
  const texto = relatorioComoTexto(gerarRelatorio({ ...orcamentoExemplo(), formaCompra: "meu_cnpj" }));
  it("recomendado = regra", () => {
    expect(texto).toContain("Cobre R$ 76.175,00.");
    expect(texto).toContain("Por isso a recomendação é cobrar esse mesmo valor: R$ 76.175,00");
  });
});

describe("relatório com outras situações", () => {
  it("valor combinado aparece no resumo, com o recomendado ao lado", () => {
    const texto = relatorioComoTexto(gerarRelatorio({ ...orcamentoExemplo(), valorFechado: 70000 }));
    expect(texto).toContain("Valor combinado com o cliente: R$ 70.000,00");
    expect(texto).toContain("R$ 7.700,00 ficam de lucro");
    expect(texto).toContain("O valor recomendado era R$ 74.000,00");
  });
  it("valor combinado abaixo do piso é chamado de prejuízo", () => {
    const texto = relatorioComoTexto(gerarRelatorio({ ...orcamentoExemplo(), valorFechado: 60000 }));
    expect(texto).toContain("e faltam R$ 800,00: é prejuízo");
  });
  it("sem ajudante muda o texto da mão de obra", () => {
    const texto = relatorioComoTexto(gerarRelatorio({ ...orcamentoExemplo(), semAjudante: true, diariaAjudante: 0, passagem: 10, almoco: 25 }));
    expect(texto).toContain("Custo do eletricista por dia, sem ajudante");
    expect(texto).toContain("eletricista(s)");
    expect(texto).not.toContain("1 ajudante");
  });
  it("prejuízo pela regra não aparece como lucro", () => {
    const o = { ...orcamentoExemplo(), markupMO: 0, markupFerramentas: 0, markupMaterialDireto: 0 };
    const texto = relatorioComoTexto(gerarRelatorio(o));
    expect(texto).toContain("O preço da regra dá prejuízo");
    expect(texto).toContain("Faltariam");
  });
});
