import { useRef } from "react";
import Dinheiro from "@/components/Dinheiro";
import { brl } from "@/domain/format";
import { dadosProposta } from "@/domain/proposta";
import type { Ajustes, Orcamento } from "@/domain/types";

const TEMPO_SEGURAR = 800;

/** Tela para mostrar ao cliente: só o que está na proposta. Sair exige segurar, para a margem não aparecer sem querer. */
export default function ModoCliente({ orc, ajustes, onSair }: { orc: Orcamento; ajustes: Ajustes; onSair: () => void }) {
  const p = dadosProposta(orc, ajustes.empresa);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const soltar = () => clearTimeout(timer.current);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-content flex-col gap-section bg-background px-gutter pb-section pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
      <header className="flex flex-col gap-1">
        {ajustes.empresa.logo && <img src={ajustes.empresa.logo} alt="" className="mb-2 max-h-16 w-fit object-contain" />}
        {ajustes.empresa.nome.trim() && <p className="text-label font-semibold text-muted-foreground">{ajustes.empresa.nome.trim()}</p>}
        <h1 className="font-display text-display-lg font-extrabold">{p.obra}</h1>
        {p.cliente && <p className="text-body-lg text-muted-foreground">{p.cliente}</p>}
      </header>

      <section className="rounded-xl bg-primary p-5 text-primary-foreground">
        <div className="text-body-lg font-semibold">Valor total</div>
        <p className="whitespace-nowrap font-display text-display-2xl font-extrabold">{p.valor === null ? "A combinar" : <Dinheiro texto={brl(p.valor)} prefixoMenor />}</p>
        <p className="mt-2 text-body font-medium">
          {p.prazo} · válida até {p.validaAte}
        </p>
      </section>

      {p.escopo && (
        <section className="flex flex-col gap-1">
          <h2 className="font-display text-display-sm font-bold">O que será feito</h2>
          <p className="whitespace-pre-line text-body-lg">{p.escopo}</p>
        </section>
      )}

      {p.materiais.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-display-sm font-bold">Materiais incluídos</h2>
          <ul className="numeros flex flex-col divide-y text-body">
            {p.materiais.map((m, i) => (
              <li key={i} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">{m.descricao}</span>
                <span className="shrink-0 font-semibold">{m.quantidade}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.parcelas.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-display-sm font-bold">Pagamento</h2>
          <ul className="numeros flex flex-col divide-y text-body">
            {p.parcelas.map((c, i) => (
              <li key={i} className="flex justify-between gap-3 py-2">
                <span>
                  {c.rotulo} ({c.percentual}%)
                </span>
                <span className="font-semibold">{brl(c.valor)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        className="mt-auto min-h-touch select-none rounded-md text-caption text-muted-foreground [touch-action:none]"
        onPointerDown={() => {
          timer.current = setTimeout(onSair, TEMPO_SEGURAR);
        }}
        onPointerUp={soltar}
        onPointerLeave={soltar}
        onPointerCancel={soltar}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSair();
        }}
      >
        Segure aqui para sair
      </button>
    </main>
  );
}
