// Gera os ícones PNG do app (raio amarelo #FFBF00 em fundo #1C2026) sem depender de bibliotecas de imagem.
// Uso: npm run icons
import { writeFileSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const publico = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const FUNDO = [0x1c, 0x20, 0x26];
const RAIO = [0xff, 0xbf, 0x00];

// Raio em coordenadas de 24x24 (mesmo desenho do ícone da barra superior)
const POLIGONO = [
  [13.5, 2],
  [5, 13.5],
  [10.5, 13.5],
  [9.5, 22],
  [19, 10],
  [13.2, 10],
];

function dentro(x, y) {
  let d = false;
  for (let i = 0, j = POLIGONO.length - 1; i < POLIGONO.length; j = i++) {
    const [xi, yi] = POLIGONO[i];
    const [xj, yj] = POLIGONO[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

function chunk(tipo, dados) {
  const t = Buffer.from(tipo, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])) >>> 0);
  return Buffer.concat([len, t, dados, crc]);
}

function png(tamanho, fracaoDoRaio) {
  const SS = 4; // supersampling para borda suave
  const escala = (tamanho * fracaoDoRaio) / 20; // o raio tem 20 unidades de altura
  const raw = Buffer.alloc((tamanho * 3 + 1) * tamanho);
  for (let py = 0; py < tamanho; py++) {
    raw[py * (tamanho * 3 + 1)] = 0;
    for (let px = 0; px < tamanho; px++) {
      let cobertura = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS - tamanho / 2) / escala + 12;
          const y = (py + (sy + 0.5) / SS - tamanho / 2) / escala + 12;
          if (dentro(x, y)) cobertura++;
        }
      }
      const a = cobertura / (SS * SS);
      const o = py * (tamanho * 3 + 1) + 1 + px * 3;
      for (let c = 0; c < 3; c++) raw[o + c] = Math.round(FUNDO[c] * (1 - a) + RAIO[c] * a);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// "maskable" precisa manter o desenho dentro dos 80% centrais (zona segura)
const saidas = [
  ["icon-192.png", 192, 0.66],
  ["icon-512.png", 512, 0.66],
  ["icon-maskable-512.png", 512, 0.5],
];
for (const [nome, tam, frac] of saidas) {
  writeFileSync(join(publico, nome), png(tam, frac));
  console.log("gerado", nome);
}
