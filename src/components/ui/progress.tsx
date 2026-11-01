import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
  max: number;
}

/** Barra de progresso dividida em etapas: uma barra só para o leitor de tela, um segmento por etapa na tela. */
const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(({ className, value, max, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    value={value}
    max={max}
    className={cn("grid gap-1", className)}
    style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
    {...props}
  >
    {Array.from({ length: max }, (_, i) => (
      <span key={i} className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <span className={cn("block h-full origin-left rounded-full bg-primary transition-transform duration-slow", i < value ? "scale-x-100" : "scale-x-0")} />
      </span>
    ))}
  </ProgressPrimitive.Root>
));
Progress.displayName = "Progress";

export { Progress };
