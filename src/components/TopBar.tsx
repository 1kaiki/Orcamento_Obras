import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  titulo: string;
  onVoltar?: () => void;
  /** Ações à direita */
  extra?: ReactNode;
  /** Conteúdo abaixo da linha do título (ex.: progresso) */
  children?: ReactNode;
}

export default function TopBar({ titulo, onVoltar, extra, children }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background pt-safe-top">
      <div className="mx-auto w-full max-w-content px-2">
        <div className="flex min-h-14 items-center gap-1">
          {onVoltar && (
            <Button variant="ghost" size="icon" aria-label="Voltar" onClick={onVoltar}>
              <ChevronLeft className="!size-7" aria-hidden="true" />
            </Button>
          )}
          <h1 className="min-w-0 flex-1 truncate px-1 text-body-lg font-semibold">{titulo}</h1>
          {extra}
        </div>
        {children && <div className="px-2 pb-3">{children}</div>}
      </div>
    </header>
  );
}
