import { useCallback, useEffect, useRef, useState } from "react";
import { AJUSTES_PADRAO, novoOrcamento, orcamentoExemplo } from "./domain/defaults";
import type { Ajustes, Orcamento } from "./domain/types";
import Home from "./screens/Home";
import Result from "./screens/Result";
import Settings from "./screens/Settings";
import StepFerramentas from "./screens/StepFerramentas";
import StepMaoDeObra from "./screens/StepMaoDeObra";
import StepMateriais from "./screens/StepMateriais";
import StepObra from "./screens/StepObra";
import { duplicarOrcamento, excluirOrcamento, lerAjustes, restaurarAjustesPadrao, salvarAjustes, salvarOrcamento } from "./storage/repo";

type Tela = { nome: "home" } | { nome: "passo"; n: 1 | 2 | 3 | 4 } | { nome: "resultado" } | { nome: "ajustes" };

interface EstadoHistorico {
  tela: Tela;
  idx: number;
}

const HOME: Tela = { nome: "home" };

export default function App() {
  const [tela, setTela] = useState<Tela>(HOME);
  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_PADRAO);
  const [homeKey, setHomeKey] = useState(0);

  const idx = useRef(0);
  const sujo = useRef(false);
  const orcRef = useRef<Orcamento | null>(null);
  orcRef.current = orc;

  useEffect(() => {
    lerAjustes().then(setAjustes).catch(() => undefined);
    history.replaceState({ tela: HOME, idx: 0 } satisfies EstadoHistorico, "");
    const onPop = (e: PopStateEvent) => {
      const est = e.state as EstadoHistorico | null;
      idx.current = est?.idx ?? 0;
      setTela(est?.tela ?? HOME);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Salva sozinho enquanto o usuário digita
  const salvarAgora = useCallback(async () => {
    const atual = orcRef.current;
    if (atual && sujo.current) {
      sujo.current = false;
      await salvarOrcamento(atual);
    }
  }, []);

  useEffect(() => {
    if (!sujo.current) return;
    const t = setTimeout(() => void salvarAgora(), 300);
    return () => clearTimeout(t);
  }, [orc, salvarAgora]);

  useEffect(() => {
    const flush = () => void salvarAgora();
    const aoEsconder = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", aoEsconder);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", aoEsconder);
    };
  }, [salvarAgora]);

  const ir = useCallback((t: Tela, substituir = false) => {
    if (!substituir) idx.current += 1;
    history[substituir ? "replaceState" : "pushState"]({ tela: t, idx: idx.current } satisfies EstadoHistorico, "");
    setTela(t);
    window.scrollTo(0, 0);
  }, []);

  const voltar = useCallback(() => {
    if (idx.current > 0) history.back();
    else ir(HOME, true);
  }, [ir]);

  const irHome = useCallback(async () => {
    await salvarAgora();
    setOrc(null);
    setHomeKey((k) => k + 1);
    ir(HOME, true);
  }, [ir, salvarAgora]);

  const editar = useCallback((parcial: Partial<Orcamento>) => {
    sujo.current = true;
    setOrc((o) => (o ? { ...o, ...parcial } : o));
  }, []);

  const passo = (n: 1 | 2 | 3 | 4): Tela => ({ nome: "passo", n });

  const proximo = (n: 1 | 2 | 3) => {
    sujo.current = true; // passar do passo 1 já guarda o orçamento, mesmo sem mudar nada
    setOrc((o) => (o ? { ...o } : o));
    ir(passo((n + 1) as 2 | 3 | 4));
  };

  async function duplicar() {
    if (!orc) return;
    await salvarAgora();
    const copia = await duplicarOrcamento(orc.id);
    if (copia) {
      setOrc(copia);
      ir({ nome: "resultado" }, true);
    }
  }

  async function excluir() {
    if (!orc) return;
    sujo.current = false;
    await excluirOrcamento(orc.id);
    setOrc(null);
    setHomeKey((k) => k + 1);
    ir(HOME, true);
  }

  async function criarExemplo() {
    const ex = orcamentoExemplo(ajustes);
    await salvarOrcamento(ex);
    setOrc(ex);
    ir({ nome: "resultado" });
  }

  // Telas que dependem de um orçamento voltam para a Home se não houver nenhum (ex.: página recarregada)
  const precisaOrc = tela.nome === "passo" || tela.nome === "resultado";
  useEffect(() => {
    if (precisaOrc && !orc) ir(HOME, true);
  }, [precisaOrc, orc, ir]);

  if (tela.nome === "ajustes") {
    return (
      <Settings
        ajustes={ajustes}
        onChange={(a) => {
          setAjustes(a);
          void salvarAjustes(a);
        }}
        onRestaurar={() => void restaurarAjustesPadrao().then(setAjustes)}
        onImportado={() => {
          void lerAjustes().then(setAjustes);
          setHomeKey((k) => k + 1);
        }}
        onVoltar={voltar}
      />
    );
  }

  if (tela.nome === "passo" && orc) {
    const comum = { orc, editar, onVoltar: voltar };
    switch (tela.n) {
      case 1:
        return <StepObra {...comum} onProximo={() => proximo(1)} />;
      case 2:
        return <StepMaoDeObra {...comum} onProximo={() => proximo(2)} />;
      case 3:
        return <StepMateriais {...comum} onProximo={() => proximo(3)} />;
      case 4:
        return (
          <StepFerramentas
            {...comum}
            onProximo={() => {
              sujo.current = true;
              setOrc((o) => (o ? { ...o } : o));
              ir({ nome: "resultado" });
            }}
          />
        );
    }
  }

  if (tela.nome === "resultado" && orc) {
    return (
      <Result
        orc={orc}
        onVoltar={() => void irHome()}
        onEditar={() => ir(passo(1))}
        onDuplicar={() => void duplicar()}
        onExcluir={() => void excluir()}
      />
    );
  }

  return (
    <Home
      key={homeKey}
      onNovo={() => {
        setOrc(novoOrcamento(ajustes));
        sujo.current = false;
        ir(passo(1));
      }}
      onExemplo={() => void criarExemplo()}
      onAbrir={(o) => {
        setOrc(o);
        sujo.current = false;
        ir({ nome: "resultado" });
      }}
      onAjustes={() => ir({ nome: "ajustes" })}
    />
  );
}
