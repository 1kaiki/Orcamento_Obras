import { Eraser } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Campo from "@/components/Campo";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brl } from "@/domain/format";
import { mudarSituacao } from "@/domain/funil";
import { dadosProposta } from "@/domain/proposta";
import type { Ajustes, Orcamento } from "@/domain/types";

interface Props {
  orc: Orcamento;
  ajustes: Ajustes;
  editar: (parcial: Partial<Orcamento>) => void;
  onVoltar: () => void;
  onConfirmado: () => void;
}

const TINTA = "#171B21";

/** O fundo é sempre branco: a assinatura vai para o PDF e precisa funcionar também no modo escuro. */
function QuadroAssinatura({ onMudou, canvasRef }: { onMudou: (temTinta: boolean) => void; canvasRef: React.RefObject<HTMLCanvasElement> }) {
  const ultimo = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const caixa = c.getBoundingClientRect();
    c.width = caixa.width * dpr;
    c.height = caixa.height * dpr;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = TINTA;
    }
  }, [canvasRef]);

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const caixa = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - caixa.left, y: e.clientY - caixa.top };
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label="Área para assinar com o dedo"
      className="h-40 w-full rounded-md border-2 border-input [touch-action:none]"
      style={{ background: "#fff" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        ultimo.current = ponto(e);
      }}
      onPointerMove={(e) => {
        if (!ultimo.current) return;
        const ctx = e.currentTarget.getContext("2d");
        const p = ponto(e);
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(ultimo.current.x, ultimo.current.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          onMudou(true);
        }
        ultimo.current = p;
      }}
      onPointerUp={() => {
        ultimo.current = null;
      }}
      onPointerCancel={() => {
        ultimo.current = null;
      }}
    />
  );
}

export default function Aceite({ orc, ajustes, editar, onVoltar, onConfirmado }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [nome, setNome] = useState(orc.aceite?.nome ?? orc.cliente);
  const [temTinta, setTemTinta] = useState(false);
  const p = dadosProposta(orc, ajustes.empresa);

  function limpar() {
    const c = canvas.current;
    if (c) {
      c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      setTemTinta(false);
    }
  }

  function confirmar() {
    const c = canvas.current;
    if (!c) return;
    editar({ ...mudarSituacao(orc, "aceito"), aceite: { nome: nome.trim(), assinatura: c.toDataURL("image/png"), em: Date.now() } });
    onConfirmado();
  }

  return (
    <>
      <TopBar titulo="Aceite do cliente" onVoltar={onVoltar} />
      <main className="mx-auto flex w-full max-w-content flex-col gap-4 px-gutter pb-section pt-4">
        <Card className="numeros flex flex-col gap-2 p-4 text-body">
          <h2 className="font-display text-display-sm font-bold">{p.obra}</h2>
          <p className="font-semibold">
            Valor total: {p.valor === null ? "a combinar" : brl(p.valor)} · {p.prazo}
          </p>
          {p.escopo && <p className="whitespace-pre-line">{p.escopo}</p>}
          {p.materiais.length > 0 && <p className="text-label text-muted-foreground">Materiais incluídos: {p.materiais.map((m) => `${m.quantidade} × ${m.descricao}`).join("; ")}.</p>}
          {p.parcelas.length > 0 && <p className="text-label text-muted-foreground">Pagamento: {p.parcelas.map((c) => `${c.rotulo.toLowerCase()} ${brl(c.valor)}`).join("; ")}.</p>}
          <ul className="flex list-disc flex-col gap-1 pl-5 text-label">
            {p.condicoes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>

        <Campo id="nome-aceite" label="Nome de quem assina">
          <Input id="nome-aceite" autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} />
        </Campo>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label font-semibold">Assine com o dedo</span>
            <Button variant="ghost" onClick={limpar} disabled={!temTinta}>
              <Eraser aria-hidden="true" /> Limpar
            </Button>
          </div>
          <QuadroAssinatura canvasRef={canvas} onMudou={setTemTinta} />
        </div>

        <Button size="lg" className="w-full" disabled={!temTinta || !nome.trim()} onClick={confirmar}>
          Confirmar aceite
        </Button>
      </main>
    </>
  );
}
