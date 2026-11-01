import { CircleAlert, CircleCheck, Info, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ESTILO = {
  amarelo: { fundo: "bg-warning-soft", texto: "text-warning", Icone: CircleAlert },
  vermelho: { fundo: "bg-danger-soft", texto: "text-danger", Icone: OctagonAlert },
  verde: { fundo: "bg-success-soft", texto: "text-success", Icone: CircleCheck },
  neutro: { fundo: "bg-muted", texto: "text-muted-foreground", Icone: Info },
};

/** Aviso curto com ícone e texto, para não depender só da cor. */
export default function Aviso({ tom = "amarelo", children, className }: { tom?: keyof typeof ESTILO; children: ReactNode; className?: string }) {
  const { fundo, texto, Icone } = ESTILO[tom];
  return (
    <div className={cn("numeros flex items-start gap-2 rounded-md p-3 text-label", fundo, className)}>
      <Icone className={cn("mt-0.5 size-5 shrink-0", texto)} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
