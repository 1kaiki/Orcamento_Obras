import { brl } from "@/domain/format";
import { cn } from "@/lib/utils";

interface Props {
  preco: number;
  custo: number;
  imposto: number;
  lucro: number;
}

/** Divide o valor cobrado em custo, imposto e lucro. Cada parte traz nome e valor: a cor nunca fala sozinha. */
export default function BarraDinheiro({ preco, custo, imposto, lucro }: Props) {
  const prejuizo = lucro < 0;
  const partes = [
    { nome: "Paga os custos", valor: custo, cor: "bg-barra-custo" },
    { nome: "Vai para o imposto", valor: imposto, cor: "bg-barra-imposto" },
    { nome: prejuizo ? "Prejuízo: falta pagar" : "Fica de lucro", valor: Math.abs(lucro), cor: "bg-barra-lucro", semBarra: prejuizo },
  ];
  const total = Math.max(preco, custo + imposto) || 1;
  const descricao = partes.map((p) => `${p.nome}: ${brl(p.valor)}`).join(". ");

  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={`De ${brl(preco)} cobrados. ${descricao}.`} className="flex h-5 gap-0.5">
        {partes
          .filter((p) => !p.semBarra && p.valor > 0)
          .map((p) => (
            <div key={p.nome} className={cn("min-w-1 rounded-[4px]", p.cor)} style={{ width: `${(p.valor / total) * 100}%` }} />
          ))}
      </div>
      <ul className="flex flex-col gap-1.5 text-body">
        {partes.map((p) => (
          <li key={p.nome} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-[4px]", p.semBarra ? "border-2 border-danger" : p.cor)} />
              <span className={p.semBarra ? "font-semibold text-danger" : undefined}>{p.nome}</span>
            </span>
            <span className={cn("numeros shrink-0 font-semibold", p.semBarra && "text-danger")}>{brl(p.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
