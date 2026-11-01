import { useEffect, useRef } from "react";

const TEMPO_SEGURAR = 800;

/** Sair das telas que o cliente vê exige segurar, com o dedo ou com Enter: um toque sem querer não mostra a margem. */
export default function BotaoSegurar({ onSair }: { onSair: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const segurar = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(onSair, TEMPO_SEGURAR);
  };
  const soltar = () => clearTimeout(timer.current);

  useEffect(() => soltar, []);

  return (
    <button
      type="button"
      className="mt-auto min-h-touch select-none rounded-md text-caption text-muted-foreground [touch-action:none]"
      onPointerDown={segurar}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) segurar();
      }}
      onKeyUp={soltar}
      onBlur={soltar}
    >
      Segure aqui para sair
    </button>
  );
}
