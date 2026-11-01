import { pctInteiro } from "../domain/format";

interface Props {
  /** Margem em fração (0,052) */
  margem: number;
  /** Faixa em % inteiro */
  min: number;
  max: number;
}

/** Régua de 0% a `fim`%, com a faixa ideal em verde e o marcador da margem. */
export default function MarginGauge({ margem, min, max }: Props) {
  const fim = Math.max(35, Math.ceil((max + 10) / 5) * 5);
  const pos = (p: number) => `${Math.min(100, Math.max(0, (p / fim) * 100))}%`;
  const m = margem * 100;
  const marcas = Array.from(new Set([0, min, max, fim]));

  return (
    <div className="gauge" role="img" aria-label={`Margem de ${m.toFixed(1).replace(".", ",")}%. Faixa ideal de ${min}% a ${max}%.`}>
      <div className="gauge-track">
        <div className="gauge-over" style={{ left: pos(max) }} />
        <div className="gauge-band" style={{ left: pos(min), width: `calc(${pos(max)} - ${pos(min)})` }} />
        <div className="gauge-marker" style={{ left: pos(m) }} />
      </div>
      <div className="gauge-scale" aria-hidden="true">
        {marcas.map((p) => (
          <span key={p} style={{ left: pos(p), ...(p === 0 ? { transform: "none" } : p === fim ? { transform: "translateX(-100%)" } : {}) }}>
            {pctInteiro(p, 0)}
          </span>
        ))}
      </div>
    </div>
  );
}
