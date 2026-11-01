const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 → "R$ 1.234,50" (espaço comum, para não quebrar fontes do PDF) */
export function brl(valor: number): string {
  const v = Object.is(valor, -0) || !isFinite(valor) ? 0 : valor;
  return brlFmt.format(v).replace(/[  ]/g, " ");
}

/** 1234.5 → "1.234,50" */
export function numero(valor: number): string {
  return numFmt.format(!isFinite(valor) ? 0 : valor).replace(/[  ]/g, " ");
}

/** Fração → percentual: 0.052 → "5,2%". Com `inteiro`, recebe 15 → "15%". */
export function pct(fracao: number, casas = 1): string {
  const v = (isFinite(fracao) ? fracao : 0) * 100;
  const s = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas }).format(v);
  return `${s}%`;
}

/** Número inteiro de % (15) → "15%" */
export function pctInteiro(valor: number, casas = 2): string {
  return pct(valor / 100, casas);
}

/**
 * Converte texto digitado no formato brasileiro em número.
 * "45000" → 45000 · "45.000" → 45000 · "45.000,50" → 45000.5 · "45,5" → 45.5 · "R$ 1.234,56" → 1234.56
 */
export function parseValorBR(texto: string): number {
  let s = String(texto ?? "").replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  const negativo = s.startsWith("-");
  s = s.replace(/-/g, "");
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(".")) {
    const partes = s.split(".");
    const ultimo = partes[partes.length - 1];
    // "45.000" ou "1.234.567" = separador de milhar; "45.5" = decimal
    const milhar = partes.length > 2 || ultimo.length === 3;
    s = milhar ? partes.join("") : s;
  }
  const n = parseFloat(s);
  if (!isFinite(n)) return 0;
  return negativo ? -n : n;
}

/** Texto do campo ao exibir: 45000.5 → "45.000,50"; 0 → "" quando `vazioSeZero` */
export function valorParaCampo(valor: number, vazioSeZero = false): string {
  if (vazioSeZero && !valor) return "";
  return numero(valor);
}

export function dataBR(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR");
}

export function semAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function nomeArquivo(obra: string, ext: string, prefixo = "Orcamento"): string {
  const base = semAcentos(obra.trim() || "Sem nome")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefixo}_${base || "Sem-nome"}.${ext}`;
}
