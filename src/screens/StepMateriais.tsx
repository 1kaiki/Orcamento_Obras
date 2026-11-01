import { Building2, Check, type LucideIcon, MessageCircle, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import Aviso from "@/components/Aviso";
import ItemList from "@/components/ItemList";
import StepFrame from "@/components/StepFrame";
import { Button } from "@/components/ui/button";
import { itensSemPreco } from "@/domain/catalogo";
import { pctInteiro } from "@/domain/format";
import { linkWhatsApp, mensagemCotacao } from "@/domain/mensagens";
import { totalMateriais } from "@/domain/pricing";
import type { Ajustes, ItemCatalogo, Orcamento } from "@/domain/types";
import { cn } from "@/lib/utils";
import { lerCatalogo } from "@/storage/repo";

interface Props {
  orc: Orcamento;
  ajustes: Ajustes;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onProximo: () => void;
}

function Opcao({ selecionado, Icone, titulo, descricao, acrescimo, onSelect }: { selecionado: boolean; Icone: LucideIcon; titulo: string; descricao: string; acrescimo: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      onClick={onSelect}
      className={cn(
        "relative flex min-w-0 flex-col gap-2 rounded-lg border-2 p-3 text-left transition-[transform,background-color,border-color] duration-fast active:scale-[0.98]",
        selecionado ? "border-foreground bg-primary text-primary-foreground" : "border-input bg-card text-card-foreground",
      )}
    >
      <span className="flex items-center justify-between">
        <Icone className="size-6" aria-hidden="true" />
        <span className={cn("flex size-6 items-center justify-center rounded-full border-2", selecionado ? "border-foreground bg-primary-foreground text-primary" : "border-input")}>
          {selecionado && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
        </span>
      </span>
      <span className="numeros font-display text-display-xl font-extrabold">+{acrescimo}</span>
      <span className="text-body font-bold leading-tight">{titulo}</span>
      <span className={cn("text-caption", !selecionado && "text-muted-foreground")}>{descricao}</span>
    </button>
  );
}

export default function StepMateriais({ orc, ajustes, editar, onVoltar, onProximo }: Props) {
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const semPreco = itensSemPreco({ materiais: orc.materiais, ferramentas: [] });
  const temLista = orc.materiais.some((m) => m.descricao.trim());

  useEffect(() => {
    lerCatalogo().then(setCatalogo).catch(() => undefined);
  }, []);

  return (
    <StepFrame
      orc={orc}
      passo={3}
      titulo="Como os materiais serão comprados?"
      botao="Próximo"
      total={{ rotulo: "Total de materiais", valor: totalMateriais(orc) }}
      onVoltar={onVoltar}
      onProximo={onProximo}
    >
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Forma de compra dos materiais">
        <Opcao
          selecionado={orc.formaCompra === "faturamento_direto"}
          Icone={Building2}
          acrescimo={pctInteiro(orc.markupMaterialDireto)}
          titulo="Faturamento direto"
          descricao="A nota sai no CNPJ do cliente."
          onSelect={() => editar({ formaCompra: "faturamento_direto" })}
        />
        <Opcao
          selecionado={orc.formaCompra === "meu_cnpj"}
          Icone={ShoppingCart}
          acrescimo={pctInteiro(orc.markupMaterialCnpj)}
          titulo="Compro no meu CNPJ"
          descricao="Você compra e repassa para o cliente."
          onSelect={() => editar({ formaCompra: "meu_cnpj" })}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <h3 className="font-display text-display-sm font-bold">Lista de materiais</h3>
        <p className="-mt-1 text-label text-muted-foreground">
          Use <strong className="font-semibold text-foreground">preço de mercado, sem desconto</strong>. Não tem a lista ainda? Coloque um item só com o valor total.
        </p>
        <ItemList modo="materiais" itens={orc.materiais} catalogo={catalogo} onChange={(materiais) => editar({ materiais })} />
        {semPreco > 0 && <Aviso>{semPreco === 1 ? "1 material está sem preço" : `${semPreco} materiais estão sem preço`}: o valor recomendado ainda está incompleto.</Aviso>}
        {temLista && (
          <Button variant="outline" size="lg" className="w-full" asChild>
            <a href={linkWhatsApp("", mensagemCotacao(orc, ajustes.empresa))} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" /> Pedir cotação no WhatsApp
            </a>
          </Button>
        )}
      </div>
    </StepFrame>
  );
}
