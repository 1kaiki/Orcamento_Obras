import { colunaNumerica, type Bloco, type Tom } from "@/domain/report";
import { cn } from "@/lib/utils";

type Tabela = Extract<Bloco, { tipo: "tabela" }>;

export const COR_TOM: Record<Tom, string> = {
  verde: "bg-success-soft",
  amarelo: "bg-warning-soft",
  vermelho: "bg-danger-soft",
};
export const TEXTO_TOM: Record<Tom, string> = {
  verde: "text-success",
  amarelo: "text-warning",
  vermelho: "text-danger",
};

/** Em 390px, tabela de "Item | Conta | Valor" esmaga o texto. Vira nome + valor, com a conta embaixo. */
function TabelaEmpilhada({ b, sub }: { b: Tabela; sub: (l: string[]) => string }) {
  return (
    <ul className="flex flex-col">
      {b.linhas.map((l, k) => {
        const destaque = b.ultimaEmDestaque && k === b.linhas.length - 1;
        return (
          <li key={k} className={cn("border-b py-2.5 last:border-b-0", destaque && "-mx-2 rounded-sm border-b-0 bg-muted px-2")}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn("min-w-0 text-body", destaque ? "font-bold" : "font-medium")}>{l[0]}</span>
              <span className={cn("numeros shrink-0 text-body", destaque ? "font-bold" : "font-semibold")}>{l[l.length - 1]}</span>
            </div>
            {sub(l) && <p className="numeros mt-0.5 text-caption text-muted-foreground">{sub(l)}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function TabelaSimples({ b }: { b: Tabela }) {
  return (
    <table className="w-full border-collapse text-label">
      {b.cabecalho && (
        <thead>
          <tr className="border-b-2 border-foreground">
            {b.cabecalho.map((c, k) => (
              <th key={k} scope="col" className={cn("pb-1.5 pl-2 text-caption font-semibold first:pl-0", colunaNumerica(b, k) ? "text-right" : "text-left")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {b.linhas.map((l, k) => (
          <tr key={k} className="border-b last:border-b-0">
            {l.map((c, j) => (
              <td key={j} className={cn("py-2.5 pl-2 first:pl-0", colunaNumerica(b, j) ? "numeros whitespace-nowrap text-right font-semibold" : "")}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BlocoTabela({ b }: { b: Tabela }) {
  const colunas = b.cabecalho ?? [];
  if (colunas[1] === "Conta") return <TabelaEmpilhada b={b} sub={(l) => l[1]} />;
  if (colunas[0] === "Material") return <TabelaEmpilhada b={b} sub={(l) => (l[1] ? `${l[1]} × ${l[2]}` : "")} />;
  return <TabelaSimples b={b} />;
}

/** Desenha os blocos do relatório. O conteúdo vem inteiro de gerarRelatorio: aqui é só apresentação. */
export default function Relatorio({ blocos }: { blocos: Bloco[] }) {
  return (
    <div className="flex flex-col gap-3 text-body">
      {blocos.map((b, i) => {
        switch (b.tipo) {
          case "titulo":
            return (
              <h3 key={i} className="font-display text-display-sm font-bold">
                {b.texto}
              </h3>
            );
          case "paragrafo":
            return (
              <p key={i} className="numeros">
                {b.texto}
              </p>
            );
          case "lista":
            return (
              <ul key={i} className="numeros flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">
                {b.itens.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            );
          case "caixa":
            return (
              <div key={i} className={cn("numeros flex flex-col gap-2 rounded-md p-3", COR_TOM[b.tom])}>
                <strong className={TEXTO_TOM[b.tom]}>{b.titulo}</strong>
                {b.textos.map((t, k) => (
                  <p key={k}>{t}</p>
                ))}
              </div>
            );
          case "tabela":
            return <BlocoTabela key={i} b={b} />;
        }
      })}
    </div>
  );
}

export interface SecaoRelatorio {
  titulo: string;
  blocos: Bloco[];
}

/** Separa a lista de blocos em seções pelos títulos; o que vem antes do primeiro título é o resumo. */
export function dividirRelatorio(blocos: Bloco[]): { resumo: Bloco[]; secoes: SecaoRelatorio[] } {
  const resumo: Bloco[] = [];
  const secoes: SecaoRelatorio[] = [];
  for (const b of blocos) {
    if (b.tipo === "titulo") secoes.push({ titulo: b.texto, blocos: [] });
    else if (secoes.length) secoes[secoes.length - 1].blocos.push(b);
    else resumo.push(b);
  }
  return { resumo, secoes };
}
