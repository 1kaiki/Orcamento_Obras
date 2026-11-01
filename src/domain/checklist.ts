import type { Orcamento } from "./types";

export interface ItemChecklist {
  id: string;
  pergunta: string;
  ajuda: string;
  /** Item criado na lista ao marcar, para receber o preço depois */
  adiciona?: { lista: "materiais" | "ferramentas"; descricao: string };
}

/** O que costuma ser esquecido na visita técnica e vira prejuízo. */
export const CHECKLIST: ItemChecklist[] = [
  { id: "noturno", pergunta: "Trabalho à noite ou fora do horário comercial?", ajuda: "Confira se os dias e as diárias cobrem isso." },
  { id: "acesso", pergunta: "Há regras de acesso, como em shopping ou condomínio?", ajuda: "Janelas curtas de trabalho aumentam os dias de serviço." },
  { id: "andaime", pergunta: "Precisa de andaime ou plataforma?", ajuda: "Entra na lista de aluguel.", adiciona: { lista: "ferramentas", descricao: "Andaime ou plataforma" } },
  { id: "rasgo", pergunta: "Precisa abrir parede ou concreto?", ajuda: "Entra na lista de aluguel.", adiciona: { lista: "ferramentas", descricao: "Martelete" } },
  { id: "quadro", pergunta: "O quadro de distribuição precisa ser trocado?", ajuda: "Entra na lista de materiais.", adiciona: { lista: "materiais", descricao: "Quadro de distribuição" } },
  { id: "entrada", pergunta: "A carga vai aumentar? Precisa mexer no padrão de entrada?", ajuda: "Entra na lista de materiais.", adiciona: { lista: "materiais", descricao: "Adequação do padrão de entrada" } },
  { id: "retirada", pergunta: "Há instalação antiga para retirar?", ajuda: "Conte o tempo de retirada nos dias de serviço." },
  { id: "art", pergunta: "A obra exige ART ou TRT?", ajuda: "Lembre de incluir a taxa nos custos." },
];

/** Marca ou desmarca. Desmarcar só tira o item criado se ele ainda não recebeu preço. */
export function alternarChecklist(o: Orcamento, id: string, marcado: boolean): Partial<Orcamento> {
  const item = CHECKLIST.find((c) => c.id === id);
  const checklist = marcado ? [...new Set([...o.checklist, id])] : o.checklist.filter((c) => c !== id);
  const parcial: Partial<Orcamento> = { checklist };
  const a = item?.adiciona;
  if (!a) return parcial;
  if (a.lista === "materiais") {
    const existe = o.materiais.some((m) => m.descricao === a.descricao);
    if (marcado && !existe) parcial.materiais = [...o.materiais, { descricao: a.descricao, quantidade: 1, precoUnitario: 0 }];
    if (!marcado) parcial.materiais = o.materiais.filter((m) => m.descricao !== a.descricao || m.precoUnitario > 0);
  } else {
    const existe = o.ferramentas.some((f) => f.descricao === a.descricao);
    if (marcado && !existe) parcial.ferramentas = [...o.ferramentas, { descricao: a.descricao, valor: 0 }];
    if (!marcado) parcial.ferramentas = o.ferramentas.filter((f) => f.descricao !== a.descricao || f.valor > 0);
  }
  return parcial;
}
