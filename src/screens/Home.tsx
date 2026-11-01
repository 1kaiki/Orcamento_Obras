import { useEffect, useState } from "react";
import { IconMais } from "../components/Icons";
import StatusChip from "../components/StatusChip";
import TopBar from "../components/TopBar";
import { brl, dataBR, pct } from "../domain/format";
import { calcular } from "../domain/pricing";
import type { Orcamento } from "../domain/types";
import { listarOrcamentos } from "../storage/repo";

interface Props {
  onNovo: () => void;
  onExemplo: () => void;
  onAbrir: (o: Orcamento) => void;
  onAjustes: () => void;
}

export default function Home({ onNovo, onExemplo, onAbrir, onAjustes }: Props) {
  const [lista, setLista] = useState<Orcamento[] | null>(null);

  useEffect(() => {
    let vivo = true;
    listarOrcamentos().then((l) => vivo && setLista(l));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <>
      <TopBar titulo="Orça Obra" onAjustes={onAjustes} />
      <main className="page">
        <section className="hero">
          <h2>Quanto cobrar nessa obra?</h2>
          <p>Responda 4 passos e veja o valor com a conta explicada.</p>
          <button type="button" className="btn btn-primary btn-big" onClick={onNovo}>
            <IconMais /> Novo orçamento
          </button>
        </section>

        <h2 className="card-title" style={{ marginBottom: 0 }}>
          Meus orçamentos
        </h2>

        {lista === null ? null : lista.length === 0 ? (
          <div className="card empty">
            <p>Você ainda não fez nenhum orçamento. Toque em "Novo orçamento" ou veja como funciona com um exemplo.</p>
            <button type="button" className="btn" onClick={onExemplo}>
              Ver um exemplo pronto
            </button>
          </div>
        ) : (
          <div className="stack">
            {lista.map((o) => {
              const r = calcular(o);
              return (
                <button type="button" key={o.id} className="orc-item" onClick={() => onAbrir(o)}>
                  <span className="orc-nome">{o.obra.trim() || "Sem nome"}</span>
                  <span className="orc-meta">
                    {o.cliente.trim() ? `${o.cliente.trim()} · ` : ""}
                    {dataBR(o.atualizadoEm)}
                  </span>
                  <span className="orc-foot">
                    <span className="mono orc-valor">{r.recomendado === null ? "sem preço possível" : brl(r.recomendado)}</span>
                    <StatusChip status={r.status} texto={`Margem ${pct(r.margem)}`} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <p className="offline-note">Tudo fica salvo neste aparelho e funciona sem internet.</p>
      </main>
    </>
  );
}
