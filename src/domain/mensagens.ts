import { brl, numero } from "./format";
import { resultadoAditivo } from "./obra";
import type { Aditivo, DadosEmpresa, Orcamento } from "./types";

const saudacao = (o: Orcamento) => (o.cliente.trim() ? `Olá, ${o.cliente.trim()}!` : "Olá!");
const assinatura = (e: DadosEmpresa) => (e.nome.trim() ? ` Aqui é da ${e.nome.trim()}.` : "");
const nomeObra = (o: Orcamento) => o.obra.trim() || "a obra";

export function mensagemProposta(o: Orcamento, empresa: DadosEmpresa): string {
  return `${saudacao(o)}${assinatura(empresa)} Segue a proposta para ${nomeObra(o)}. Qualquer dúvida, estou à disposição.`;
}

export function mensagemRetorno(o: Orcamento, empresa: DadosEmpresa): string {
  return `${saudacao(o)}${assinatura(empresa)} Passando para saber se você conseguiu avaliar a proposta para ${nomeObra(o)}. Posso ajudar com alguma dúvida?`;
}

export function mensagemAditivo(o: Orcamento, a: Aditivo, empresa: DadosEmpresa): string {
  const { preco } = resultadoAditivo(a.custo, o.imposto);
  return `${saudacao(o)}${assinatura(empresa)} Na obra ${nomeObra(o)} surgiu um item fora do combinado: ${a.descricao.trim() || "item extra"}, no valor de ${brl(preco)}. Posso seguir? Preciso da sua aprovação antes da compra.`;
}

/** Lista para a loja cotar: sem nenhum preço. */
export function mensagemCotacao(o: Pick<Orcamento, "materiais">, empresa: DadosEmpresa): string {
  const itens = o.materiais.filter((m) => m.descricao.trim()).map((m) => `- ${numero(m.quantidade).replace(/,00$/, "")} x ${m.descricao.trim()}`);
  return [`Olá!${assinatura(empresa)} Pode me passar o preço destes materiais?`, "", ...itens].join("\n");
}

/** Link do WhatsApp. Sem telefone, o próprio WhatsApp pede para escolher o contato. */
export function linkWhatsApp(telefone: string, texto: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const numeroCompleto = digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(texto)}`;
}
