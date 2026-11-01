interface Props {
  selecionado: boolean;
  titulo: string;
  descricao: string;
  onSelect: () => void;
}

export default function OptionCard({ selecionado, titulo, descricao, onSelect }: Props) {
  return (
    <button type="button" role="radio" aria-checked={selecionado} className="option" onClick={onSelect}>
      <span className="option-dot" aria-hidden="true" />
      <span>
        <span className="option-title">{titulo}</span>
        <br />
        <span className="option-desc">{descricao}</span>
      </span>
    </button>
  );
}
