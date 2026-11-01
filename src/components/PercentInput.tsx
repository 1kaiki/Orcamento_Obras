import MoneyInput from "./MoneyInput";

interface Props {
  /** Número inteiro de % (15 = 15%) */
  value: number;
  onChange: (valor: number) => void;
  label?: string;
  ajuda?: string;
  ariaLabel?: string;
}

export default function PercentInput({ value, onChange, label, ajuda, ariaLabel }: Props) {
  return (
    <MoneyInput
      value={value}
      onChange={onChange}
      label={label}
      ajuda={ajuda}
      ariaLabel={ariaLabel}
      prefixo=""
      sufixo="%"
      variante="quantidade"
    />
  );
}
