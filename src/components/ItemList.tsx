import { brl } from "../domain/format";
import type { ItemFerramenta, ItemMaterial } from "../domain/types";
import { IconLixeira, IconMais } from "./Icons";
import MoneyInput from "./MoneyInput";

type Props =
  | { modo: "materiais"; itens: ItemMaterial[]; onChange: (itens: ItemMaterial[]) => void }
  | { modo: "ferramentas"; itens: ItemFerramenta[]; onChange: (itens: ItemFerramenta[]) => void };

/** Lista de materiais (descrição, quantidade, preço unitário) ou de ferramentas (descrição, valor). */
export default function ItemList(props: Props) {
  const mat = props.modo === "materiais";
  const rotulo = mat ? "material" : "equipamento";

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
    if (props.modo === "materiais") props.onChange([...props.itens, { descricao: "", quantidade: 1, precoUnitario: 0 }]);
    else props.onChange([...props.itens, { descricao: "", valor: 0 }]);
  }

  return (
    <div className="items">
      {props.itens.map((item, i) => (
        <div className="item" key={i}>
          <div className="item-head">
            <div className="field">
              <span className="field-label">Descrição</span>
              <input
                className="input-solo"
                aria-label={`Descrição do ${rotulo} ${i + 1}`}
                type="text"
                value={item.descricao}
                placeholder={mat ? "Ex.: cabos, disjuntores" : "Ex.: martelete"}
                onChange={(e) => atualizar<{ descricao: string }>(i, { descricao: e.target.value })}
              />
            </div>
            <button type="button" className="icon-btn" style={{ color: "var(--red)" }} aria-label={`Remover ${rotulo} ${i + 1}`} onClick={() => remover(i)}>
              <IconLixeira />
            </button>
          </div>
          {props.modo === "materiais" ? (
            <>
              <div className="item-grid">
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
                  onChange={(v) => atualizar<ItemMaterial>(i, { precoUnitario: v })}
                />
              </div>
              <div className="item-total">
                <span>Total do item</span>
                <strong className="mono">{brl((item as ItemMaterial).quantidade * (item as ItemMaterial).precoUnitario)}</strong>
              </div>
            </>
          ) : (
            <MoneyInput
              label="Valor do aluguel"
              vazioSeZero
              value={(item as ItemFerramenta).valor}
              onChange={(v) => atualizar<ItemFerramenta>(i, { valor: v })}
            />
          )}
        </div>
      ))}
      <button type="button" className="btn btn-block" onClick={adicionar}>
        <IconMais /> Adicionar {rotulo}
      </button>
    </div>
  );
}
