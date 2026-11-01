/** Ilustração do estado vazio: um quadro de disjuntores, com um único ligado. */
export default function QuadroVazio() {
  const disjuntores = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-auto" aria-hidden="true">
      <rect x="28" y="6" width="104" height="108" rx="8" className="fill-muted stroke-foreground" strokeWidth="3" />
      <rect x="40" y="18" width="80" height="84" rx="4" className="fill-card stroke-input" strokeWidth="2" />
      {disjuntores.map((i) => {
        const x = 48 + i * 17;
        const ligado = i === 1;
        return (
          <g key={i}>
            <rect x={x} y="32" width="13" height="56" rx="2.5" className={ligado ? "fill-primary stroke-foreground" : "fill-secondary stroke-input"} strokeWidth="2" />
            <rect x={x + 3} y={ligado ? 38 : 64} width="7" height="18" rx="1.5" className={ligado ? "fill-foreground" : "fill-input"} />
          </g>
        );
      })}
      <path d="M6 60h22M132 60h22" className="stroke-input" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
