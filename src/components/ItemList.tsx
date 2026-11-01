import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buscarNoCatalogo } from "@/domain/catalogo";
import { brl } from "@/domain/format";
import type { ItemCatalogo, ItemFerramenta, ItemMaterial } from "@/domain/types";
import MoneyInput from "./MoneyInput";

type Props =
  | { modo: "materiais"; itens: ItemMaterial[]; onChange: (itens: ItemMaterial[]) => void; catalogo?: ItemCatalogo[] }
  | { modo: "ferramentas"; itens: ItemFerramenta[]; onChange: (itens: ItemFerramenta[]) => void };

/** Lista de materiais (descrição, quantidade, preço unitário) ou de ferramentas (descrição, valor). */
export default function ItemList(props: Props) {
  const mat = props.modo === "materiais";
  const rotulo = mat ? "material" : "equipamento";
  const ultimo = useRef<HTMLInputElement>(null);
  const acabouDeAdicionar = useRef(false);
  const idLista = useId();
  const catalogo = props.modo === "materiais" ? (props.catalogo ?? []) : [];

  /** Ao escolher um material já conhecido, o preço vem junto, se ainda não houver um. */
  function mudarDescricao(i: number, descricao: string) {
    if (props.modo !== "materiais") {
      atualizar<{ descricao: string }>(i, { descricao });
      return;
    }
    const conhecido = buscarNoCatalogo(catalogo, descricao);
    if (conhecido && !(props.itens[i].precoUnitario > 0)) atualizar<ItemMaterial>(i, { descricao, precoUnitario: conhecido.precoUnitario, precoEm: conhecido.atualizadoEm });
    else atualizar<ItemMaterial>(i, { descricao });
  }

  // Item novo já abre pronto para digitar a descrição.
  useEffect(() => {
    if (acabouDeAdicionar.current) {
      acabouDeAdicionar.current = false;
      ultimo.current?.focus();
    }
  }, [props.itens.length]);

  function atualizar<T extends object>(i: number, parcial: Partial<T>) {
    if (props.modo === "materiais") {
      props.onChange(props.itens.map((it, k) => (k === i ? { ...it, ...parcial } : it)));
    } else {
      props.onChange(props.itens.map((it, k) => (k === i ? { ...it, ...parcial } : it)));
    }
  }

  function remover(i: number) {
    if (props.modo === "materiais") props.onChange(props.itens.filter((_, k) => k !== i));
    else props.onChange(props.itens.filter((_, k) => k !== i));
  }

  function adicionar() {
    acabouDeAdicionar.current = true;
    if (props.modo === "materiais") props.onChange([...props.itens, { descricao: "", quantidade: 1, precoUnitario: 0 }]);
    else props.onChange([...props.itens, { descricao: "", valor: 0 }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {catalogo.length > 0 && (
        <datalist id={idLista}>
          {catalogo.map((c) => (
            <option key={c.descricao} value={c.descricao} />
          ))}
        </datalist>
      )}
      {props.itens.map((item, i) => (
        <Card key={i} className="flex flex-col gap-3 p-3 duration-base animate-in fade-in-0 slide-in-from-bottom-2">
          <div className="flex items-center gap-1">
            <Input
              ref={i === props.itens.length - 1 ? ultimo : undefined}
              aria-label={`Descrição do ${rotulo} ${i + 1}`}
              value={item.descricao}
              list={catalogo.length > 0 ? idLista : undefined}
              placeholder={mat ? "Ex.: cabos, disjuntores" : "Ex.: martelete"}
              onChange={(e) => mudarDescricao(i, e.target.value)}
            />
            <Button variant="ghost" size="icon" className="shrink-0 text-danger" aria-label={`Remover ${rotulo} ${i + 1}`} onClick={() => remover(i)}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
          {props.modo === "materiais" ? (
            <>
              <div className="grid grid-cols-[2fr_3fr] gap-2">
                <MoneyInput
                  label="Quantidade"
                  prefixo=""
                  variante="quantidade"
                  value={(item as ItemMaterial).quantidade}
                  onChange={(v) => atualizar<ItemMaterial>(i, { quantidade: v })}
                />
                <MoneyInput
                  label="Preço unitário"
                  vazioSeZero
                  value={(item as ItemMaterial).precoUnitario}
                  onChange={(v) => atualizar<ItemMaterial>(i, { precoUnitario: v, precoEm: Date.now() })}
                />
              </div>
              <div className="flex items-baseline justify-between gap-3 text-label">
                <span className="text-muted-foreground">Total do item</span>
                <strong className="numeros font-semibold">{brl((item as ItemMaterial).quantidade * (item as ItemMaterial).precoUnitario)}</strong>
              </div>
            </>
          ) : (
            <MoneyInput label="Valor do aluguel" vazioSeZero value={(item as ItemFerramenta).valor} onChange={(v) => atualizar<ItemFerramenta>(i, { valor: v })} />
          )}
        </Card>
      ))}
      <Button variant="outline" size="lg" className="w-full border-dashed" onClick={adicionar}>
        <Plus aria-hidden="true" /> Adicionar {rotulo}
      </Button>
    </div>
  );
}
