import Aviso from "@/components/Aviso";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { aplicarPrecosNovos, type PrecoParaRevisar } from "@/domain/catalogo";
import { brl } from "@/domain/format";
import { calcular } from "@/domain/pricing";
import type { ItemCatalogo, Orcamento } from "@/domain/types";

interface Props {
  orc: Orcamento;
  revisar: PrecoParaRevisar[];
  catalogo: ItemCatalogo[];
  aberto: boolean;
  onAberto: (a: boolean) => void;
  editar: (parcial: Partial<Orcamento>) => void;
  onEditarValores: () => void;
}

/** Mostra o novo valor recomendado antes de trocar qualquer preço. */
export default function RevisarPrecosSheet({ orc, revisar, catalogo, aberto, onAberto, editar, onEditarValores }: Props) {
  const comNovo = revisar.filter((p) => p.novo !== null);
  const materiais = aplicarPrecosNovos(orc, revisar, catalogo);
  const atual = calcular(orc).recomendado;
  const depois = calcular({ ...orc, materiais }).recomendado;

  return (
    <Sheet open={aberto} onOpenChange={onAberto}>
      <SheetContent>
        <SheetTitle>Revisar preços</SheetTitle>
        <SheetDescription>Preços de material mudam. Confira antes de mandar ou reenviar a proposta.</SheetDescription>
        <ul className="numeros flex flex-col divide-y text-label">
          {revisar.map((p) => (
            <li key={p.indice} className="flex flex-col gap-0.5 py-2">
              <span className="font-semibold">{p.descricao}</span>
              <span className="text-muted-foreground">
                {brl(p.atual)}, informado há {p.dias} {p.dias === 1 ? "dia" : "dias"}
                {p.novo !== null && <strong className="text-foreground"> · no catálogo: {brl(p.novo)}</strong>}
              </span>
            </li>
          ))}
        </ul>
        {comNovo.length > 0 && atual !== null && depois !== null && (
          <Aviso>
            Com os preços do catálogo, o valor recomendado vai de {brl(atual)} para <strong>{brl(depois)}</strong>.
          </Aviso>
        )}
        {comNovo.length > 0 && (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              editar({ materiais });
              onAberto(false);
              toast.success("Preços atualizados");
            }}
          >
            Usar preços do catálogo
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            onAberto(false);
            onEditarValores();
          }}
        >
          Editar preços à mão
        </Button>
      </SheetContent>
    </Sheet>
  );
}
