import { useEffect, useRef, useState } from "react";

const semAnimacao = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Anima um número até `alvo`. Só afeta o que aparece na tela: o valor de verdade continua vindo de `calcular`.
 * `inicio` = de onde parte a primeira animação (por padrão, nenhuma: já começa no alvo).
 */
export function useContagem(alvo: number, duracao = 220, inicio: number = alvo): number {
  const [mostrado, setMostrado] = useState(() => (semAnimacao() ? alvo : inicio));
  const atual = useRef(mostrado);

  useEffect(() => {
    if (semAnimacao() || atual.current === alvo) {
      atual.current = alvo;
      setMostrado(alvo);
      return;
    }
    const de = atual.current;
    const t0 = performance.now();
    let quadro = requestAnimationFrame(function passo(t) {
      const p = Math.min(1, (t - t0) / duracao);
      const suave = 1 - (1 - p) ** 3;
      // No último quadro usa o alvo exato, sem erro de arredondamento.
      const v = p === 1 ? alvo : de + (alvo - de) * suave;
      atual.current = v;
      setMostrado(v);
      if (p < 1) quadro = requestAnimationFrame(passo);
    });
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracao]);

  return mostrado;
}
