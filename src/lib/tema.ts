import { useSyncExternalStore } from "react";

export type Tema = "sistema" | "claro" | "escuro";

const CHAVE = "orca-obra-tema";
const ouvintes = new Set<() => void>();

function lerTema(): Tema {
  try {
    const t = localStorage.getItem(CHAVE);
    return t === "claro" || t === "escuro" ? t : "sistema";
  } catch {
    return "sistema";
  }
}

let atual: Tema = lerTema();

const midia = () => window.matchMedia("(prefers-color-scheme: dark)");
export const temaEscuro = (t: Tema = atual) => t === "escuro" || (t === "sistema" && midia().matches);

function aplicar() {
  const escuro = temaEscuro();
  document.documentElement.classList.toggle("dark", escuro);
  // A barra do navegador acompanha o token --background do tema ativo.
  const fundo = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", `hsl(${fundo.split(" ").join(", ")})`);
  ouvintes.forEach((f) => f());
}

export function iniciarTema() {
  aplicar();
  midia().addEventListener("change", aplicar);
}

export function definirTema(t: Tema) {
  atual = t;
  try {
    localStorage.setItem(CHAVE, t);
  } catch {
    // Sem armazenamento (aba privada): o tema vale só até fechar.
  }
  aplicar();
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

export const useTema = () => useSyncExternalStore(assinar, () => atual);
export const useEscuro = () => useSyncExternalStore(assinar, () => temaEscuro());
