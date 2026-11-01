import { Toaster as Sonner, toast } from "sonner";
import { useEscuro } from "@/lib/tema";

function Toaster() {
  const escuro = useEscuro();
  return (
    <Sonner
      theme={escuro ? "dark" : "light"}
      position="top-center"
      duration={3000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "flex w-full items-center gap-3 rounded-md bg-panel p-4 text-body font-semibold text-panel-foreground shadow-raised",
          success: "[&_[data-icon]]:text-primary",
          error: "[&_[data-icon]]:text-primary",
          description: "text-label font-normal text-panel-muted",
        },
      }}
    />
  );
}

export { toast, Toaster };
