// Gera src/export/fontes-pdf.ts: as fontes do app em TTF/base64, no formato que o jsPDF aceita.
// O jsPDF não lê WOFF, então cada arquivo é desempacotado aqui (WOFF1 = tabelas TTF comprimidas com zlib).
// Uso: npm run fontes-pdf
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONTES = {
  DISPLAY_BOLD: "@fontsource/big-shoulders-display/files/big-shoulders-display-latin-800-normal.woff",
  TEXTO_NORMAL: "@fontsource/public-sans/files/public-sans-latin-400-normal.woff",
  TEXTO_BOLD: "@fontsource/public-sans/files/public-sans-latin-700-normal.woff",
};

function woffParaTtf(woff) {
  if (woff.toString("latin1", 0, 4) !== "wOFF") throw new Error("Arquivo não é WOFF1");
  const flavor = woff.readUInt32BE(4);
  const n = woff.readUInt16BE(12);
  const tabelas = [];
  for (let i = 0; i < n; i++) {
    const p = 44 + i * 20;
    const compr = woff.readUInt32BE(p + 8);
    const orig = woff.readUInt32BE(p + 12);
    const inicio = woff.readUInt32BE(p + 4);
    const bruto = woff.subarray(inicio, inicio + compr);
    tabelas.push({ tag: woff.subarray(p, p + 4), checksum: woff.readUInt32BE(p + 16), dados: compr === orig ? bruto : inflateSync(bruto) });
  }
  const pot = Math.floor(Math.log2(n));
  const cab = Buffer.alloc(12 + n * 16);
  cab.writeUInt32BE(flavor, 0);
  cab.writeUInt16BE(n, 4);
  cab.writeUInt16BE(2 ** pot * 16, 6);
  cab.writeUInt16BE(pot, 8);
  cab.writeUInt16BE(n * 16 - 2 ** pot * 16, 10);
  let pos = cab.length;
  const corpos = [];
  tabelas.forEach((t, i) => {
    const e = 12 + i * 16;
    t.tag.copy(cab, e);
    cab.writeUInt32BE(t.checksum, e + 4);
    cab.writeUInt32BE(pos, e + 8);
    cab.writeUInt32BE(t.dados.length, e + 12);
    const preenchimento = Buffer.alloc((4 - (t.dados.length % 4)) % 4);
    corpos.push(t.dados, preenchimento);
    pos += t.dados.length + preenchimento.length;
  });
  return Buffer.concat([cab, ...corpos]);
}

let saida = "// Gerado por scripts/gerar-fontes-pdf.mjs. Não editar à mão.\n// Big Shoulders Display e Public Sans (SIL Open Font License), subconjunto latino.\n\n";
for (const [nome, arquivo] of Object.entries(FONTES)) {
  const ttf = woffParaTtf(readFileSync(join(raiz, "node_modules", arquivo)));
  saida += `export const ${nome} = "${ttf.toString("base64")}";\n`;
  console.log(nome, `${Math.round(ttf.length / 1024)} KB`);
}
writeFileSync(join(raiz, "src", "export", "fontes-pdf.ts"), saida);
