import { useEffect, useRef, useState } from "react";
import { numero, parseValorBR } from "../domain/format";

interface Props {
  value: number;
  onChange: (valor: number) => void;
  label?: string;
  ajuda?: string;
  ariaLabel?: string;
  prefixo?: string;
  sufixo?: string;
  /** "dinheiro": sempre 2 casas. "quantidade": até 3 casas, sem zeros à direita. */
  variante?: "dinheiro" | "quantidade";
  /** Mostra o campo vazio quando o valor é zero (itens novos). */
  vazioSeZero?: boolean;
  placeholder?: string;
}

const qtdFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

function formatar(valor: number, variante: "dinheiro" | "quantidade", vazioSeZero: boolean): string {
  if (vazioSeZero && !valor) return "";
  return variante === "dinheiro" ? numero(valor) : qtdFmt.format(valor);
}

/** Campo numérico em formato brasileiro: aceita "45000", "45.000" e "45.000,50"; formata ao sair. */
export default function MoneyInput({
  value,
  onChange,
  label,
  ajuda,
  ariaLabel,
  prefixo = "R$",
  sufixo,
  variante = "dinheiro",
  vazioSeZero = false,
  placeholder,
}: Props) {
  const [texto, setTexto] = useState(() => formatar(value, variante, vazioSeZero));
  const focado = useRef(false);
  const id = useRef(`campo-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    if (!focado.current) setTexto(formatar(value, variante, vazioSeZero));
  }, [value, variante, vazioSeZero]);

  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrap">
        {prefixo && <span className="affix">{prefixo}</span>}
        <input
          id={id}
          className="num"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label ? undefined : ariaLabel}
          placeholder={placeholder ?? (variante === "dinheiro" ? "0,00" : "0")}
          value={texto}
          onFocus={(e) => {
            focado.current = true;
            const el = e.currentTarget;
            requestAnimationFrame(() => el.select());
          }}
          onChange={(e) => {
            const bruto = e.target.value.replace(/[^\d.,-]/g, "");
            setTexto(bruto);
            onChange(parseValorBR(bruto));
          }}
          onBlur={() => {
            focado.current = false;
            setTexto(formatar(parseValorBR(texto), variante, vazioSeZero));
          }}
        />
        {sufixo && <span className="affix">{sufixo}</span>}
      </div>
      {ajuda && <span className="field-help">{ajuda}</span>}
    </div>
  );
}
