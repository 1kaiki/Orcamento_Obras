import { useRef, useState } from "react";
import MoneyInput from "../components/MoneyInput";
import PercentInput from "../components/PercentInput";
import TopBar from "../components/TopBar";
import type { Ajustes } from "../domain/types";
import { baixar } from "../export/download";
import { gerarBackup, importarBackup } from "../storage/repo";

interface Props {
  ajustes: Ajustes;
  onChange: (a: Ajustes) => void;
  onRestaurar: () => void;
  onImportado: () => void;
  onVoltar: () => void;
}

export default function Settings({ ajustes, onChange, onRestaurar, onImportado, onVoltar }: Props) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const set = (parcial: Partial<Ajustes>) => onChange({ ...ajustes, ...parcial });

  async function exportar() {
    const blob = await gerarBackup();
    const dia = new Date().toISOString().slice(0, 10);
    await baixar(blob, `orca-obra-backup-${dia}.json`);
  }

  async function importar(f: File | undefined) {
    if (!f) return;
    try {
      const n = await importarBackup(await f.text());
      setMsg(`Backup importado: ${n} orçamento(s).`);
      onImportado();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não foi possível importar o arquivo.");
    } finally {
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  return (
    <>
      <TopBar titulo="Ajustes" onVoltar={onVoltar} />
      <main className="page">
        <p className="lead">Esses valores são usados nos orçamentos novos. Cada orçamento guarda a cópia com que foi feito. Ajuste à realidade da sua região.</p>

        <section className="card stack">
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            Mão de obra
          </h2>
          <MoneyInput label="Diária do eletricista" value={ajustes.diariaEletricista} onChange={(v) => set({ diariaEletricista: v })} />
          <MoneyInput label="Diária do ajudante" value={ajustes.diariaAjudante} onChange={(v) => set({ diariaAjudante: v })} />
          <MoneyInput label="Passagem (dupla, por dia)" value={ajustes.passagem} onChange={(v) => set({ passagem: v })} />
          <MoneyInput label="Almoço (dupla, por dia)" value={ajustes.almoco} onChange={(v) => set({ almoco: v })} />
        </section>

        <section className="card stack">
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            Regra de preço
          </h2>
          <PercentInput label="Acréscimo na mão de obra" value={ajustes.markupMO} onChange={(v) => set({ markupMO: v })} />
          <PercentInput label="Acréscimo nas ferramentas" value={ajustes.markupFerramentas} onChange={(v) => set({ markupFerramentas: v })} />
          <PercentInput label="Acréscimo no material (meu CNPJ)" value={ajustes.markupMaterialCnpj} onChange={(v) => set({ markupMaterialCnpj: v })} />
          <PercentInput label="Acréscimo no material (faturamento direto)" value={ajustes.markupMaterialDireto} onChange={(v) => set({ markupMaterialDireto: v })} />
          <PercentInput label="Imposto na nota" value={ajustes.imposto} onChange={(v) => set({ imposto: v })} />
          <div className="row">
            <PercentInput label="Margem mínima" value={ajustes.margemMin} onChange={(v) => set({ margemMin: v })} />
            <PercentInput label="Margem máxima" value={ajustes.margemMax} onChange={(v) => set({ margemMax: v })} />
          </div>
        </section>

        {confirmando ? (
          <div className="confirm" role="alertdialog">
            <strong>Voltar à regra original?</strong>
            <span>Os valores acima voltam aos padrões. Seus orçamentos não mudam.</span>
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger-solid"
                onClick={() => {
                  onRestaurar();
                  setConfirmando(false);
                }}
              >
                Voltar ao padrão
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-block" onClick={() => setConfirmando(true)}>
            Voltar à regra original
          </button>
        )}

        <section className="card stack">
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            Backup
          </h2>
          <p className="field-help">Guarde seus orçamentos num arquivo para não perder se trocar de celular.</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={exportar}>
              Exportar backup
            </button>
            <button type="button" className="btn" onClick={() => arquivo.current?.click()}>
              Importar backup
            </button>
          </div>
          <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={(e) => importar(e.target.files?.[0])} />
          {msg && (
            <div className="notice tom-amarelo" role="status">
              {msg}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
