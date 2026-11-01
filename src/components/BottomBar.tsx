interface Props {
  /** Texto do valor já formatado (ex.: "R$ 74.000,00") */
  previa: string;
  rotuloPrevia?: string;
  botao: string;
  onClick: () => void;
}

export default function BottomBar({ previa, rotuloPrevia = "Valor recomendado", botao, onClick }: Props) {
  return (
    <div className="bottombar">
      <div className="bottombar-inner">
        <div className="bottombar-preview">
          <small>{rotuloPrevia}</small>
          <span className="mono">{previa}</span>
        </div>
        <button type="button" className="btn btn-primary btn-big" style={{ width: "auto" }} onClick={onClick}>
          {botao}
        </button>
      </div>
    </div>
  );
}
