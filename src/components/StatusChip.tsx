import { CircleCheck, OctagonAlert, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TOM_STATUS } from "@/domain/pricing";
import type { StatusMargem } from "@/domain/types";

const CURTO: Record<StatusMargem, string> = {
  prejuizo: "Prejuízo",
  abaixo: "Abaixo da faixa",
  dentro: "Dentro da faixa",
  acima: "Acima da faixa",
};

// A cor nunca fala sozinha: cada situação tem ícone próprio além do texto.
const ICONE: Record<StatusMargem, LucideIcon> = {
  prejuizo: OctagonAlert,
  abaixo: TrendingDown,
  dentro: CircleCheck,
  acima: TrendingUp,
};

const VARIANTE = { verde: "success", amarelo: "warning", vermelho: "danger" } as const;

export default function StatusChip({ status, texto }: { status: StatusMargem; texto?: string }) {
  const Icone = ICONE[status];
  return (
    <Badge variant={VARIANTE[TOM_STATUS[status]]}>
      <Icone aria-hidden="true" />
      {texto ?? CURTO[status]}
    </Badge>
  );
}
