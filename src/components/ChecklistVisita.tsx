import { Check } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { alternarChecklist, CHECKLIST } from "@/domain/checklist";
import type { Orcamento } from "@/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  orc: Orcamento;
  editar: (parcial: Partial<Orcamento>) => void;
}

export default function ChecklistVisita({ orc, editar }: Props) {
  return (
    <Card>
      <Accordion type="single" collapsible>
        <AccordionItem value="checklist">
          <AccordionTrigger>
            <span className="min-w-0">
              <span className="block text-body font-semibold">Checklist da visita</span>
              <span className="block text-label text-muted-foreground">{orc.checklist.length ? `${orc.checklist.length} marcado(s)` : "O que costuma ser esquecido"}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            {CHECKLIST.map((c) => {
              const marcado = orc.checklist.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  role="checkbox"
                  aria-checked={marcado}
                  onClick={() => editar(alternarChecklist(orc, c.id, !marcado))}
                  className="flex min-h-touch items-start gap-3 rounded-md py-2 text-left"
                >
                  <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border-2", marcado ? "border-foreground bg-primary text-primary-foreground" : "border-input")}>
                    {marcado && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body font-medium">{c.pergunta}</span>
                    <span className="block text-caption text-muted-foreground">{c.ajuda}</span>
                  </span>
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
