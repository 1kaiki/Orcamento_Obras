import { CircleCheck } from "lucide-react";
import BotaoSegurar from "@/components/BotaoSegurar";
import { dataBR } from "@/domain/format";
import type { Orcamento } from "@/domain/types";

/** O celular ainda está na mão do cliente logo depois de assinar: esta tela não mostra nenhum número interno. */
export default function AceiteConfirmado({ orc, onSair }: { orc: Orcamento; onSair: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-content flex-col items-center gap-4 bg-background px-gutter pb-section pt-[calc(4rem+env(safe-area-inset-top,0px))] text-center">
      <CircleCheck className="size-16 text-success" aria-hidden="true" />
      <h1 className="font-display text-display-lg font-extrabold">Aceite registrado</h1>
      <p className="text-body-lg">{orc.obra.trim() || "Sem nome"}</p>
      {orc.aceite && (
        <p className="text-body text-muted-foreground">
          Assinado por {orc.aceite.nome} em {dataBR(orc.aceite.em)}.
        </p>
      )}
      <p className="text-body-lg font-semibold">Obrigado! Devolva o celular ao responsável pela obra.</p>
      <BotaoSegurar onSair={onSair} />
    </main>
  );
}
