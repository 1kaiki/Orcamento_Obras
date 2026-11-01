import type { ReactNode } from "react";

interface Props {
  id?: string;
  label?: string;
  ajuda?: string;
  children: ReactNode;
}

/** Rótulo + controle + ajuda: a mesma estrutura em todos os formulários. */
export default function Campo({ id, label, ajuda, children }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-label font-semibold">
          {label}
        </label>
      )}
      {children}
      {ajuda && <p className="text-caption text-muted-foreground">{ajuda}</p>}
    </div>
  );
}
