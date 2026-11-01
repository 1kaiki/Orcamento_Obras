import { pct, pctInteiro } from "@/domain/format";
import { cn } from "@/lib/utils";

interface Props {
  /** Margem pela regra, em fração (0,052) */
  margem: number;
  /** Margem cobrando o valor recomendado, em fração; null quando não há preço possível */
  margemRecomendada: number | null;
  /** Faixa em % inteiro */
  min: number;
  max: number;
}

function Marcador({ posicao, lado, texto }: { posicao: number; lado: "cima" | "baixo"; texto: string }) {
  // Perto das pontas o texto se apoia na borda para não sair da trena.
  const ancora = posicao < 22 ? "items-start" : posicao > 78 ? "items-end" : "items-center";
  const desloc = posicao < 22 ? "-translate-x-1.5" : posicao > 78 ? "translate-x-1.5" : "";
  const centro = posicao < 22 ? "translate-x-0" : posicao > 78 ? "-translate-x-full" : "-translate-x-1/2";
  return (
    <div className={cn("trena-marcador absolute flex w-max flex-col", ancora, centro, lado === "cima" ? "bottom-full mb-0.5" : "top-full mt-0.5 flex-col-reverse")} style={{ left: `${posicao}%` }}>
      <span className="numeros whitespace-nowrap text-label font-bold">{texto}</span>
      <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" className={cn("fill-foreground", desloc, lado === "baixo" && "rotate-180")}>
        <path d="M0 0h12L6 8z" />
      </svg>
    </div>
  );
}

/**
 * A trena: régua de 0% a `fim`%, com a faixa ideal pintada.
 * Em cima, a margem cobrando o valor recomendado; embaixo, a margem pela regra (quando são diferentes).
 */
export default function MarginGauge({ margem, margemRecomendada, min, max }: Props) {
  const fim = Math.max(35, Math.ceil((max + 10) / 5) * 5);
  const pos = (p: number) => Math.min(100, Math.max(0, (p / fim) * 100));
  const passoRotulo = fim > 40 ? 10 : 5;
  const rotulos: number[] = [];
  for (let p = 0; p < fim; p += passoRotulo) rotulos.push(p);

  const regra = margem * 100;
  const rec = margemRecomendada === null ? null : margemRecomendada * 100;
  const iguais = rec !== null && Math.abs(rec - regra) < 0.05;
  const faixa = `Faixa ideal de ${pctInteiro(min)} a ${pctInteiro(max)}.`;
  const descricao = iguais ? `Margem de ${pct(margem)}. ${faixa}` : `Margem de ${pct(margem)} pela regra${rec !== null ? `, ${pct(margemRecomendada as number)} cobrando o valor recomendado` : ""}. ${faixa}`;

  return (
    <div role="img" aria-label={descricao} className={cn("mx-1 pt-7", iguais ? "pb-1" : "pb-7")}>
      <div className="relative">
        <div className="relative h-14 overflow-hidden rounded-sm bg-tape text-tape-ink">
          <div className="absolute inset-y-0 bg-tape-band" style={{ left: `${pos(min)}%`, width: `${pos(max) - pos(min)}%` }} />
          <div className="trena-marcas absolute inset-0" style={{ "--trena-grupos": fim / 5 } as React.CSSProperties} />
          {rotulos.map((p) => (
            <span
              key={p}
              aria-hidden="true"
              className={cn("numeros absolute bottom-0.5 pl-0.5 font-display text-body-lg font-extrabold", p >= min && p < max ? "text-tape-band-ink" : "text-tape-ink")}
              style={{ left: `${pos(p)}%` }}
            >
              {p}
            </span>
          ))}
        </div>
        {rec !== null && <Marcador posicao={pos(rec)} lado="cima" texto={iguais ? `Margem ${pct(margemRecomendada as number)}` : `Com esse valor ${pct(margemRecomendada as number)}`} />}
        {!iguais && <Marcador posicao={pos(regra)} lado="baixo" texto={`Pela regra ${pct(margem)}`} />}
      </div>
    </div>
  );
}
