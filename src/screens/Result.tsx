import { useState } from "react";
import MarginGauge from "../components/MarginGauge";
import StatusChip from "../components/StatusChip";
import TopBar from "../components/TopBar";
import { brl, pct, pctInteiro } from "../domain/format";
import { calcular, TEXTO_STATUS, TOM_STATUS } from "../domain/pricing";
import { colunaNumerica, gerarRelatorio, type Bloco } from "../domain/report";
import type { Orcamento } from "../domain/types";
import { baixar } from "../export/download";
import { nomeArquivo } from "../domain/format";

interface Props {
  orc: Orcamento;
  onVoltar: () => void;
  onEditar: () => void;
  onDuplicar: () => void;
  onExcluir: () => void;
}

function Relatorio({ blocos }: { blocos: Bloco[] }) {
  return (
    <div className="rel">
      {blocos.map((b, i) => {
        switch (b.tipo) {
          case "titulo":
            return <h3 key={i}>{b.texto}</h3>;
          case "paragrafo":
            return <p key={i}>{b.texto}</p>;
          case "lista":
            return (
              <ul key={i}>
                {b.itens.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            );
          case "caixa":
            return (
              <div key={i} className={`rel-box tom-${b.tom}`}>
                <strong>{b.titulo}</strong>
                {b.textos.map((t, k) => (
                  <p key={k}>{t}</p>
                ))}
              </div>
            );
          case "tabela":
            return (
              <table key={i} className="rel-table">
                {b.cabecalho && (
                  <thead>
                    <tr>
                      {b.cabecalho.map((c, k) => (
                        <th key={k} className={colunaNumerica(b, k) ? "n" : undefined}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {b.linhas.map((l, k) => (
                    <tr key={k} className={b.ultimaEmDestaque && k === b.linhas.length - 1 ? "destaque" : undefined}>
                      {l.map((c, j) => (
                        <td key={j} className={colunaNumerica(b, j) ? "n" : undefined}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
        }
      })}
    </div>
  );
}

export default function Result({ orc, onVoltar, onEditar, onDuplicar, onExcluir }: Props) {
  const r = calcular(orc);
  const [exportando, setExportando] = useState<"" | "xlsx" | "pdf">("");
  const [erro, setErro] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const dif = r.recomendado !== null && Math.abs(r.recomendado - r.precoRegra) > 0.005;
  const tom = TOM_STATUS[r.status];

  async function exportar(tipo: "xlsx" | "pdf") {
    setErro("");
    setExportando(tipo);
    try {
      if (tipo === "xlsx") {
        const { gerarExcel } = await import("../export/excel");
        await baixar(await gerarExcel(orc), nomeArquivo(orc.obra, "xlsx"));
      } else {
        const { gerarPdf } = await import("../export/pdf");
        await baixar(await gerarPdf(orc), nomeArquivo(orc.obra, "pdf"));
      }
    } catch (e) {
      console.error(e);
      setErro("Não foi possível gerar o arquivo. Tente de novo.");
    } finally {
      setExportando("");
    }
  }

  return (
    <>
      <TopBar titulo={orc.obra.trim() || "Sem nome"} onVoltar={onVoltar} />
      <main className="page">
        <section className="hero" aria-label="Valor a cobrar">
          <span className="hero-label">Cobre do cliente</span>
          {r.recomendado === null ? (
            <>
              <span className="hero-value" style={{ fontSize: 26 }}>
                Sem preço possível
              </span>
              <span className="hero-sub">Imposto + margem desejada chegam a 100% ou mais. Reduza um dos dois.</span>
            </>
          ) : (
            <>
              <span className="hero-value">{brl(r.recomendado)}</span>
              <span className="hero-sub">Lucro de {brl(r.lucroRecomendado as number)} depois do imposto</span>
            </>
          )}
        </section>

        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div className="field-help">Margem pela regra</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 600 }}>
                {pct(r.margem)}
              </div>
            </div>
            <StatusChip status={r.status} />
          </div>
          <MarginGauge margem={r.margem} min={orc.margemMin} max={orc.margemMax} />
          <p className="field-help" style={{ marginTop: 6 }}>
            {TEXTO_STATUS[r.status]}. Faixa ideal: {pctInteiro(orc.margemMin)} a {pctInteiro(orc.margemMax)}.
          </p>
        </section>

        <section className="card">
          <div className="kv">
            <div className="kv-row">
              <span>Custo total</span>
              <span className="mono">{brl(r.A)}</span>
            </div>
            <div className="kv-row">
              <span>Imposto ({pctInteiro(orc.imposto)})</span>
              <span className="mono">{r.impostoRecomendado === null ? "-" : brl(r.impostoRecomendado)}</span>
            </div>
            <div className="kv-row">
              <span>Lucro</span>
              <span className="mono">{r.lucroRecomendado === null ? "-" : brl(r.lucroRecomendado)}</span>
            </div>
            {dif && (
              <div className="kv-row">
                <span>Preço pela regra</span>
                <span className="mono">{brl(r.precoRegra)}</span>
              </div>
            )}
            <div className="kv-row">
              <span>Faixa para negociar</span>
              <span className="mono">
                {r.precoMin === null || r.precoMax === null ? "-" : `${brl(r.precoMin)} a ${brl(r.precoMax)}`}
              </span>
            </div>
            <div className="kv-row strong">
              <span>Valor a cobrar</span>
              <span className="mono">{r.recomendado === null ? "-" : brl(r.recomendado)}</span>
            </div>
          </div>
        </section>

        {dif && r.recomendado !== null && (
          <div className={`notice tom-${tom}`} role="note">
            {r.recomendado > r.precoRegra
              ? `Pela regra o preço seria ${brl(r.precoRegra)}, mas a margem ficaria em ${pct(r.margem)}, abaixo do mínimo de ${pctInteiro(orc.margemMin)}. Por isso recomendamos ${brl(r.recomendado)}, que garante a margem mínima.`
              : `Pela regra o preço seria ${brl(r.precoRegra)}, mas a margem ficaria em ${pct(r.margem)}, acima do máximo de ${pctInteiro(orc.margemMax)}, e você pode perder a concorrência. Por isso recomendamos ${brl(r.recomendado)}.`}
          </div>
        )}

        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={!!exportando} onClick={() => exportar("xlsx")}>
            {exportando === "xlsx" ? "Gerando..." : "Exportar Excel"}
          </button>
          <button type="button" className="btn btn-primary" disabled={!!exportando} onClick={() => exportar("pdf")}>
            {exportando === "pdf" ? "Gerando..." : "Exportar PDF"}
          </button>
        </div>
        {erro && (
          <div className="notice tom-vermelho" role="alert">
            {erro}
          </div>
        )}

        <section className="card">
          <h2 className="card-title">Por que esse valor</h2>
          <Relatorio blocos={gerarRelatorio(orc)} />
        </section>

        {confirmando ? (
          <div className="confirm" role="alertdialog" aria-label="Confirmar exclusão">
            <strong>Excluir "{orc.obra.trim() || "Sem nome"}"?</strong>
            <span>Isso não pode ser desfeito.</span>
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger-solid" onClick={onExcluir}>
                Excluir
              </button>
            </div>
          </div>
        ) : (
          <div className="btn-row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={onEditar}>
              Editar valores
            </button>
            <button type="button" className="btn" onClick={onDuplicar}>
              Duplicar
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmando(true)}>
              Excluir
            </button>
          </div>
        )}
      </main>
    </>
  );
}
