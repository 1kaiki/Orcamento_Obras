import type { ReactNode } from "react";
import { IconAjustes, IconRaio, IconVoltar } from "./Icons";

interface Props {
  titulo: string;
  onVoltar?: () => void;
  onAjustes?: () => void;
  /** "Passo 2 de 4" */
  passo?: { atual: number; total: number };
  extra?: ReactNode;
}

export default function TopBar({ titulo, onVoltar, onAjustes, passo, extra }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {onVoltar ? (
          <button type="button" className="icon-btn" aria-label="Voltar" onClick={onVoltar}>
            <IconVoltar />
          </button>
        ) : (
          <span className="logo-bolt" aria-hidden="true">
            <IconRaio />
          </span>
        )}
        <h1>{titulo}</h1>
        {extra}
        {onAjustes && (
          <button type="button" className="icon-btn" aria-label="Ajustes" onClick={onAjustes}>
            <IconAjustes />
          </button>
        )}
      </div>
      {passo && (
        <div className="progress">
          <div className="progress-inner">
            <div className="progress-label">
              Passo {passo.atual} de {passo.total}
            </div>
            <div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={passo.total} aria-valuenow={passo.atual}>
              <div className="progress-fill" style={{ width: `${(passo.atual / passo.total) * 100}%` }} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
