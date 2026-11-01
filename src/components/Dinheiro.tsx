import { Fragment } from "react";

/**
 * Valor na fonte display. A Big Shoulders não tem dígitos tabulares (o "1" é bem mais estreito),
 * então cada dígito ganha uma célula de largura fixa: as colunas não dançam durante a contagem.
 */
export default function Dinheiro({ texto, prefixoMenor = false }: { texto: string; prefixoMenor?: boolean }) {
  const prefixo = texto.startsWith("R$ ");
  const corpo = prefixo ? texto.slice(3) : texto;
  return (
    <>
      {prefixo && <span className={prefixoMenor ? "mr-[0.12em] text-[0.5em]" : "mr-[0.2em]"}>R$</span>}
      {corpo.split("").map((c, i) => (
        <Fragment key={i}>{/\d/.test(c) ? <span className="digito">{c}</span> : c}</Fragment>
      ))}
    </>
  );
}
