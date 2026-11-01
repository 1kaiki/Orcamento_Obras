import { describe, expect, it } from "vitest";
import { aplicarPrecosNovos, atualizarCatalogo, itensSemPreco, precosParaRevisar } from "./catalogo";
import { alternarChecklist } from "./checklist";
import { AJUSTES_PADRAO, modeloDeOrcamento, orcamentoDeModelo, orcamentoExemplo, valoresDeEquipe } from "./defaults";
import { estatisticas, mudarSituacao, precisaRetorno, propostaVencida } from "./funil";
import { linkWhatsApp, mensagemCotacao } from "./mensagens";
import { pisoSemPrejuizo, simularPreco, valorDaObra } from "./negociacao";
import { resultadoAditivo, resumoObra } from "./obra";
import { planoDeCaixa, PLANOS } from "./pagamento";
import { calcular } from "./pricing";
import { dadosProposta } from "./proposta";
import type { Orcamento } from "./types";
import { normalizarAjustes, normalizarOrcamento } from "../storage/repo";

const DIA = 86_400_000;
const EMPRESA = AJUSTES_PADRAO.empresa;
const [TRINTA_QUARENTA_TRINTA] = PLANOS;

describe("nada aqui muda a regra de preço", () => {
  it("caso do exemplo continua igual, com os campos novos", () => {
    const r = calcular(orcamentoExemplo());
    expect(r.A).toBe(51800);
    expect(r.resultado).toBeCloseTo(3386.25, 6);
    expect(r.recomendado).toBeCloseTo(74000, 6);
  });
  it("valor combinado não altera o resultado de calcular", () => {
    const o = orcamentoExemplo();
    expect(calcular({ ...o, valorFechado: 70000, situacao: "aceito" })).toEqual(calcular(o));
  });
});

describe("sem ajudante", () => {
  it("a mesma fórmula, com ajudante zerado e passagem e almoço pela metade", () => {
    const o = { ...orcamentoExemplo(), ...valoresDeEquipe(true) };
    const r = calcular(o);
    expect(o.diariaAjudante).toBe(0);
    expect(o.passagem).toBe(10);
    expect(o.almoco).toBe(25);
    expect(r.custoDuplaDia).toBe(285);
    expect(r.mo).toBe(285 * 15);
    expect(r.B).toBe(285 * 15 * 2);
  });
  it("voltar para com ajudante restaura os valores dos Ajustes", () => {
    const o = { ...orcamentoExemplo(), ...valoresDeEquipe(true), ...valoresDeEquipe(false) };
    expect(calcular(o).custoDuplaDia).toBe(420);
  });
  it("usa os valores dos Ajustes do usuário", () => {
    const a = { ...AJUSTES_PADRAO, passagem: 30, almoco: 60, diariaAjudante: 150 };
    expect(valoresDeEquipe(true, a)).toEqual({ semAjudante: true, diariaAjudante: 0, passagem: 15, almoco: 30 });
    expect(valoresDeEquipe(false, a)).toEqual({ semAjudante: false, diariaAjudante: 150, passagem: 30, almoco: 60 });
  });
});

describe("conferência do lucro", () => {
  // Preço = custo + imposto + lucro, sempre: se a identidade quebrar, a tela mente.
  const casos = [orcamentoExemplo(), { ...orcamentoExemplo(), formaCompra: "meu_cnpj" as const }, { ...orcamentoExemplo(), ...valoresDeEquipe(true), duplas: 3 }, { ...orcamentoExemplo(), markupMO: 300, formaCompra: "meu_cnpj" as const }];
  it.each(casos.map((o, i) => [i, o] as const))("caso %i: tudo fecha pelos dois preços", (_, o) => {
    const r = calcular(o);
    expect(r.precoRegra).toBeCloseTo(r.A + r.E + r.resultado, 6);
    expect(r.margem).toBeCloseTo(r.resultado / r.precoRegra, 9);
    const rec = r.recomendado as number;
    expect(rec).toBeCloseTo(r.A + (r.impostoRecomendado as number) + (r.lucroRecomendado as number), 6);
    const s = simularPreco(o, rec);
    expect(s.lucro).toBeCloseTo(r.lucroRecomendado as number, 6);
    expect(s.margem).toBeCloseTo(r.margemRecomendada as number, 9);
    expect(s.imposto).toBeCloseTo(r.impostoRecomendado as number, 6);
    expect(simularPreco(o, r.precoRegra).lucro).toBeCloseTo(r.resultado, 6);
    expect(simularPreco(o, r.precoRegra).status).toBe(r.status);
  });
});

describe("desconto", () => {
  const o = orcamentoExemplo();
  it("R$ 70.000 ainda dá lucro de R$ 7.700 (11%)", () => {
    const s = simularPreco(o, 70000);
    expect(s.imposto).toBe(10500);
    expect(s.lucro).toBe(7700);
    expect(s.margem).toBeCloseTo(0.11, 9);
    expect(s.status).toBe("abaixo");
  });
  it("o piso é o preço que zera o lucro", () => {
    const piso = pisoSemPrejuizo(o) as number;
    expect(piso).toBeCloseTo(60941.18, 2);
    expect(simularPreco(o, piso).lucro).toBeCloseTo(0, 6);
    expect(simularPreco(o, piso - 1).status).toBe("prejuizo");
  });
  it("valor da obra é o combinado ou o recomendado", () => {
    expect(valorDaObra(o)).toBeCloseTo(74000, 6);
    expect(valorDaObra({ ...o, valorFechado: 70000 })).toBe(70000);
  });
});

describe("proposta", () => {
  it("não leva nenhum número interno", () => {
    const o = { ...orcamentoExemplo(), formaCompra: "meu_cnpj" as const, parcelas: TRINTA_QUARENTA_TRINTA.parcelas, materiais: [{ descricao: "Cabo", quantidade: 10, precoUnitario: 4500 }] };
    const p = dadosProposta(o, EMPRESA);
    const r = calcular(o);
    const json = JSON.stringify(p);
    expect(Object.keys(p)).not.toEqual(expect.arrayContaining(["lucro", "margem", "imposto", "custo"]));
    expect(json).not.toMatch(/lucro|margem/i);
    expect(json).not.toContain(String(r.A));
    expect(json).not.toContain("4500");
    expect(p.valor).toBe(r.recomendado);
    expect(p.materiais).toEqual([{ descricao: "Cabo", quantidade: "10" }]);
  });
  it("parcelas somam o valor total, com material no meu CNPJ", () => {
    const o = { ...orcamentoExemplo(), formaCompra: "meu_cnpj" as const, parcelas: TRINTA_QUARENTA_TRINTA.parcelas };
    const p = dadosProposta(o, EMPRESA);
    expect(p.parcelas.reduce((s, c) => s + c.valor, 0)).toBeCloseTo(p.valor as number, 6);
  });
  it("faturamento direto: parcelas + material direto = valor total", () => {
    const o = { ...orcamentoExemplo(), parcelas: TRINTA_QUARENTA_TRINTA.parcelas };
    const p = dadosProposta(o, EMPRESA);
    expect(p.materialDireto).toBe(45000);
    expect(p.parcelas.reduce((s, c) => s + c.valor, 0) + p.materialDireto).toBeCloseTo(p.valor as number, 6);
  });
});

describe("plano de caixa", () => {
  it("o saldo final é o lucro, nas duas formas de compra", () => {
    for (const formaCompra of ["meu_cnpj", "faturamento_direto"] as const) {
      const o = { ...orcamentoExemplo(), formaCompra, parcelas: TRINTA_QUARENTA_TRINTA.parcelas };
      const plano = planoDeCaixa(o);
      expect(plano.somaPercentuais).toBe(100);
      expect(plano.etapas.at(-1)?.saldo).toBeCloseTo(plano.lucro, 6);
      expect(plano.lucro).toBeCloseTo(simularPreco(o, valorDaObra(o) as number).lucro, 6);
    }
  });
  it("material no CNPJ com entrada menor que a compra mostra o aperto", () => {
    const o = { ...orcamentoExemplo(), formaCompra: "meu_cnpj" as const, parcelas: TRINTA_QUARENTA_TRINTA.parcelas };
    const plano = planoDeCaixa(o);
    // Entra 22.852,50; sai 3.427,88 de imposto, 45.000 de material, 500 de aluguel e 2.100 de mão de obra.
    expect(plano.etapas[0].recebe).toBeCloseTo(22852.5, 2);
    expect(plano.etapas[0].imposto).toBeCloseTo(3427.875, 3);
    expect(plano.etapas[0].gasta).toBeCloseTo(47600, 2);
    expect(plano.tiraDoBolso).toBeCloseTo(28175.375, 3);
  });
  it("faturamento direto não adianta material", () => {
    const plano = planoDeCaixa({ ...orcamentoExemplo(), parcelas: TRINTA_QUARENTA_TRINTA.parcelas });
    expect(plano.etapas[0].gasta).toBeCloseTo(2600, 2);
    expect(plano.tiraDoBolso).toBeLessThan(3000);
  });
  it("sem parcelas, sem etapas", () => {
    expect(planoDeCaixa(orcamentoExemplo()).etapas).toEqual([]);
  });
});

describe("situação", () => {
  const o = orcamentoExemplo();
  const agora = 1_000 * DIA;
  it("aceite congela o valor", () => {
    const p = mudarSituacao(o, "aceito", null, agora);
    expect(p.valorFechado).toBeCloseTo(74000, 6);
    expect(mudarSituacao({ ...o, valorFechado: 70000 }, "aceito", null, agora).valorFechado).toBe(70000);
  });
  it("sair de aceito apaga a assinatura, que só vale para o que foi assinado", () => {
    const aceite = { nome: "Maria", assinatura: "data:image/png;base64,x", em: agora };
    const assinado = { ...o, ...mudarSituacao(o, "aceito", null, agora), aceite };
    expect(mudarSituacao(assinado, "rascunho").aceite).toBeNull();
    expect(mudarSituacao(assinado, "enviado").aceite).toBeNull();
    expect(mudarSituacao(assinado, "perdido").aceite).toBeNull();
    expect(mudarSituacao(assinado, "aceito").aceite).toBeUndefined();
  });
  it("cobrar resposta depois de 3 dias, e de novo 3 dias depois do último contato", () => {
    const enviado = { ...o, ...mudarSituacao(o, "enviado", null, agora) };
    expect(precisaRetorno(enviado, agora + 2 * DIA)).toBe(false);
    expect(precisaRetorno(enviado, agora + 3 * DIA)).toBe(true);
    expect(precisaRetorno({ ...enviado, retornoEm: agora + 3 * DIA }, agora + 4 * DIA)).toBe(false);
    expect(precisaRetorno({ ...enviado, situacao: "aceito" }, agora + 9 * DIA)).toBe(false);
  });
  it("validade", () => {
    const enviado = { ...o, ...mudarSituacao(o, "enviado", null, agora) };
    expect(propostaVencida(enviado, agora + 15 * DIA)).toBe(false);
    expect(propostaVencida(enviado, agora + 16 * DIA)).toBe(true);
  });
  it("estatísticas não somam rascunhos e medem a taxa de fechamento", () => {
    const hoje = new Date(2026, 10, 10).getTime();
    const lista = [
      { ...o, situacao: "aceito" as const, decididoEm: hoje, valorFechado: 70000 },
      { ...o, situacao: "aceito" as const, decididoEm: new Date(2026, 5, 1).getTime(), valorFechado: 1000 },
      { ...o, situacao: "perdido" as const, motivoPerda: "preco" as const },
      { ...o, situacao: "perdido" as const, motivoPerda: "preco" as const },
      { ...o, situacao: "enviado" as const },
      o,
    ];
    const e = estatisticas(lista, hoje);
    expect(e.fechadoNoMes).toBe(70000);
    expect(e.emNegociacao).toBeCloseTo(74000, 6);
    expect(e.taxaFechamento).toBe(0.5);
    expect(e.motivoMaisComum).toBe("preco");
  });
});

describe("caderneta", () => {
  const base = { ...orcamentoExemplo(), situacao: "aceito" as const, valorFechado: 74000 };
  it("sem lançamentos, o lucro é o previsto", () => {
    const s = resumoObra(base);
    expect(s.lucroPrevisto).toBeCloseTo(11100, 6);
    expect(s.lucroReal).toBeCloseTo(11100, 6);
  });
  it("compra parcial em andamento não vira lucro falso", () => {
    const s = resumoObra({ ...base, gastos: [{ id: "1", criadoEm: 0, categoria: "material", descricao: "", valor: 20000 }] });
    expect(s.materiaisReais).toBe(45000);
    expect(s.lucroReal).toBeCloseTo(11100, 6);
  });
  it("concluída: desconto em material vira lucro", () => {
    const s = resumoObra({ ...base, concluidaEm: 1, gastos: [{ id: "1", criadoEm: 0, categoria: "material", descricao: "", valor: 42750 }] });
    expect(s.lucroReal).toBeCloseTo(11100 + 2250, 6);
  });
  it("dias a mais reduzem o lucro", () => {
    const s = resumoObra({ ...base, diasReais: 18 });
    expect(s.moReal).toBe(18 * 420);
    expect(s.lucroReal).toBeCloseTo(11100 - 3 * 420, 6);
  });
  it("avisa ao passar de 90% do custo previsto", () => {
    expect(resumoObra({ ...base, gastos: [{ id: "1", criadoEm: 0, categoria: "material", descricao: "", valor: 45000 }] }).alerta).toBe(false);
    expect(resumoObra({ ...base, diasReais: 5, gastos: [{ id: "1", criadoEm: 0, categoria: "material", descricao: "", valor: 45000 }] }).alerta).toBe(true);
  });
  it("aditivo: mercado + 15% com 15% de imposto dá R$ 2,25 de prejuízo a cada R$ 100", () => {
    const a = resultadoAditivo(100, 15);
    expect(a.preco).toBeCloseTo(115, 6);
    expect(a.imposto).toBeCloseTo(17.25, 6);
    expect(a.lucro).toBeCloseTo(-2.25, 6);
  });
  it("só aditivo aprovado entra na conta", () => {
    const extra = { id: "a", criadoEm: 0, descricao: "", custo: 1000 };
    expect(resumoObra({ ...base, aditivos: [{ ...extra, aprovado: false }] }).receita).toBe(74000);
    const s = resumoObra({ ...base, aditivos: [{ ...extra, aprovado: true }] });
    expect(s.receita).toBeCloseTo(75150, 6);
    expect(s.lucroReal).toBeCloseTo(11100 - 22.5, 6);
  });
});

describe("modelo", () => {
  it("usa os valores atuais dos Ajustes, não os da obra antiga", () => {
    const antigo = { ...orcamentoExemplo(), diariaEletricista: 1, cliente: "Fulano", valorFechado: 5 };
    const novo = orcamentoDeModelo(modeloDeOrcamento(antigo, "Loja"), AJUSTES_PADRAO);
    expect(novo.diariaEletricista).toBe(250);
    expect(novo.cliente).toBe("");
    expect(novo.valorFechado).toBeNull();
    expect(novo.situacao).toBe("rascunho");
    expect(novo.materiais).toEqual(antigo.materiais);
    expect(novo.id).not.toBe(antigo.id);
  });
  it("mantém a equipe sem ajudante", () => {
    const m = modeloDeOrcamento({ ...orcamentoExemplo(), ...valoresDeEquipe(true) }, "Solo");
    expect(calcular(orcamentoDeModelo(m)).custoDuplaDia).toBe(285);
  });
});

describe("checklist", () => {
  it("marcar cria o item, desmarcar tira se ainda não tem preço", () => {
    const o = { ...orcamentoExemplo(), ferramentas: [] };
    const marcado = { ...o, ...alternarChecklist(o, "andaime", true) };
    expect(marcado.ferramentas).toEqual([{ descricao: "Andaime ou plataforma", valor: 0 }]);
    expect(itensSemPreco(marcado)).toBe(1);
    const desmarcado = { ...marcado, ...alternarChecklist(marcado, "andaime", false) };
    expect(desmarcado.ferramentas).toEqual([]);
    expect(desmarcado.checklist).toEqual([]);
  });
  it("desmarcar não apaga um item que já tem preço", () => {
    const o = { ...orcamentoExemplo(), checklist: ["quadro"], materiais: [{ descricao: "Quadro de distribuição", quantidade: 1, precoUnitario: 900 }] };
    expect({ ...o, ...alternarChecklist(o, "quadro", false) }.materiais).toHaveLength(1);
  });
  it("marcar duas vezes não duplica", () => {
    const o = orcamentoExemplo();
    const um = { ...o, ...alternarChecklist(o, "quadro", true) };
    const dois = { ...um, ...alternarChecklist(um, "quadro", true) };
    expect(dois.materiais.filter((m) => m.descricao === "Quadro de distribuição")).toHaveLength(1);
    expect(dois.checklist).toEqual(["quadro"]);
  });
});

describe("catálogo", () => {
  const agora = 1_000 * DIA;
  it("preço mais novo substitui, preço antigo não", () => {
    const c1 = atualizarCatalogo([], [{ descricao: "Cabo 2,5", quantidade: 1, precoUnitario: 10, precoEm: agora }], 0);
    const velho = atualizarCatalogo(c1, [{ descricao: "cabo 2,5 ", quantidade: 1, precoUnitario: 8, precoEm: agora - DIA }], 0);
    expect(velho[0].precoUnitario).toBe(10);
    const novo = atualizarCatalogo(c1, [{ descricao: "CABO 2,5", quantidade: 1, precoUnitario: 12, precoEm: agora + DIA }], 0);
    expect(novo).toHaveLength(1);
    expect(novo[0].precoUnitario).toBe(12);
  });
  it("não guarda item sem nome ou sem preço", () => {
    expect(atualizarCatalogo([], [{ descricao: "", quantidade: 1, precoUnitario: 5 }, { descricao: "x", quantidade: 1, precoUnitario: 0 }], 0)).toEqual([]);
  });
  it("avisa de preço velho e de preço novo no catálogo, e aplica", () => {
    const o = {
      ...orcamentoExemplo(),
      criadoEm: agora,
      materiais: [
        { descricao: "Cabo", quantidade: 2, precoUnitario: 10, precoEm: agora - 40 * DIA },
        { descricao: "Disjuntor", quantidade: 1, precoUnitario: 30, precoEm: agora - DIA },
        { descricao: "Tomada", quantidade: 1, precoUnitario: 5, precoEm: agora },
      ],
    };
    const cat = [
      { descricao: "Disjuntor", precoUnitario: 35, atualizadoEm: agora },
      { descricao: "Tomada", precoUnitario: 5, atualizadoEm: agora },
    ];
    const lista = precosParaRevisar(o, cat, agora);
    expect(lista.map((x) => x.descricao)).toEqual(["Cabo", "Disjuntor"]);
    expect(lista[0].novo).toBeNull();
    expect(lista[1].novo).toBe(35);
    const materiais = aplicarPrecosNovos(o, lista, cat);
    expect(materiais[0].precoUnitario).toBe(10);
    expect(materiais[1].precoUnitario).toBe(35);
    expect(materiais[1].precoEm).toBe(agora);
  });
});

describe("backup", () => {
  it("guarda todos os campos novos do orçamento", () => {
    const completo: Orcamento = {
      ...orcamentoExemplo(),
      telefone: "11 90000-0000",
      escopo: "Quadro novo",
      semAjudante: true,
      checklist: ["andaime"],
      materiais: [{ descricao: "Cabo", quantidade: 2, precoUnitario: 10, precoEm: 5 }],
      situacao: "aceito",
      enviadoEm: 1,
      retornoEm: 2,
      decididoEm: 3,
      motivoPerda: "preco",
      validadeDias: 30,
      valorFechado: 70000,
      parcelas: PLANOS[1].parcelas,
      aceite: { nome: "Maria", assinatura: "data:image/png;base64,x", em: 4 },
      diasReais: 16,
      gastos: [{ id: "g", criadoEm: 1, categoria: "ferramenta", descricao: "Andaime", valor: 300 }],
      aditivos: [{ id: "a", criadoEm: 1, descricao: "Tomadas", custo: 100, aprovado: true }],
      concluidaEm: 9,
    };
    expect(normalizarOrcamento(JSON.parse(JSON.stringify(completo)))).toEqual(completo);
  });
  it("orçamento salvo antes destas funções abre como rascunho, com o mesmo preço", () => {
    const { situacao, valorFechado, semAjudante, gastos, aditivos, parcelas, aceite, checklist, ...antigo } = orcamentoExemplo();
    const o = normalizarOrcamento(antigo);
    expect(o.situacao).toBe("rascunho");
    expect(o.valorFechado).toBeNull();
    expect(o.semAjudante).toBe(false);
    expect(o.gastos).toEqual([]);
    expect(calcular(o)).toEqual(calcular(orcamentoExemplo()));
  });
  it("ajustes antigos ganham empresa vazia e mantêm os valores", () => {
    const a = normalizarAjustes({ diariaEletricista: 300 });
    expect(a.diariaEletricista).toBe(300);
    expect(a.empresa).toEqual({ nome: "", cnpj: "", telefone: "", logo: "" });
    expect(a.validadeDias).toBe(15);
  });
});

describe("mensagens", () => {
  it("cotação não leva preço", () => {
    const m = mensagemCotacao({ materiais: [{ descricao: "Cabo", quantidade: 10, precoUnitario: 123.45 }] }, EMPRESA);
    expect(m).toContain("10 x Cabo");
    expect(m).not.toContain("123");
  });
  it("link do WhatsApp com DDI do Brasil", () => {
    expect(linkWhatsApp("(11) 91234-5678", "oi")).toBe("https://wa.me/5511912345678?text=oi");
    expect(linkWhatsApp("", "oi")).toBe("https://wa.me/?text=oi");
    expect(linkWhatsApp("5511912345678", "oi")).toBe("https://wa.me/5511912345678?text=oi");
  });
});
