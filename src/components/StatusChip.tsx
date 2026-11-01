import { TOM_STATUS } from "../domain/pricing";
import type { StatusMargem } from "../domain/types";

const CURTO: Record<StatusMargem, string> = {
  prejuizo: "Prejuízo",
  abaixo: "Abaixo da faixa",
  dentro: "Dentro da faixa",
  acima: "Acima da faixa",
};

export default function StatusChip({ status, texto }: { status: StatusMargem; texto?: string }) {
  return <span className={`chip tom-${TOM_STATUS[status]}`}>{texto ?? CURTO[status]}</span>;
}
