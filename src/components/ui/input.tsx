import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-field w-full min-w-0 rounded-md border-2 border-input bg-card px-4 text-body-lg text-foreground transition-colors duration-fast placeholder:text-muted-foreground focus-visible:border-foreground disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
