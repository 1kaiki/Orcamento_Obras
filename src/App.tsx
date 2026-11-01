import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "./components/ui/sonner";
import { AJUSTES_PADRAO, novoOrcamento, orcamentoDeModelo, orcamentoExemplo } from "./domain/defaults";
import type { Ajustes, Orcamento } from "./domain/types";
import Aceite from "./screens/Aceite";
import AceiteConfirmado from "./screens/AceiteConfirmado";
import Home from "./screens/Home";
import ModoCliente from "./screens/ModoCliente";
import Obra from "./screens/Obra";
import Pagamento from "./screens/Pagamento";
import Result from "./screens/Result";
import Settings from "./screens/Settings";
import StepFerramentas from "./screens/StepFerramentas";
import StepMaoDeObra from "./screens/StepMaoDeObra";
import StepMateriais from "./screens/StepMateriais";
import StepObra from "./screens/StepObra";
import { duplicarOrcamento, excluirOrcamento, guardarNoCatalogo, lerAjustes, restaurarAjustesPadrao, salvarAjustes, salvarOrcamento } from "./storage/repo";

type Tela =
  | { nome: "home" }
  | { nome: "passo"; n: 1 | 2 | 3 | 4 }
  | { nome: "resultado" }
  | { nome: "ajustes" }
  | { nome: "cliente" }
  | { nome: "pagamento" }
  | { nome: "aceite" }
  | { nome: "aceite-confirmado" }
  | { nome: "obra" };

interface EstadoHistorico {
  tela: Tela;
  idx: number;
}

const HOME: Tela = { nome: "home" };

/** Telas que o cliente vê: o gesto de voltar não sai delas, porque a tela anterior mostra custo e lucro. */
const telaDoCliente = (t: Tela) => t.nome === "cliente" || t.nome === "aceite-confirmado";

export default function App() {
  const [tela, setTela] = useState<Tela>(HOME);
  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_PADRAO);
  const [homeKey, setHomeKey] = useState(0);

  const idx = useRef(0);
  const sujo = useRef(false);
  const orcRef = useRef<Orcamento | null>(null);
  orcRef.current = orc;
  const telaRef = useRef<Tela>(tela);
  telaRef.current = tela;
  const saidaLiberada = useRef(false);

  useEffect(() => {
    lerAjustes().then(setAjustes).catch(() => undefined);
    history.replaceState({ tela: HOME, idx: 0 } satisfies EstadoHistorico, "");
    const onPop = (e: PopStateEvent) => {
      if (telaDoCliente(telaRef.current) && !saidaLiberada.current) {
        history.pushState({ tela: telaRef.current, idx: idx.current } satisfies EstadoHistorico, "");
        return;
      }
      saidaLiberada.current = false;
      const est = e.state as EstadoHistorico | null;
      document.documentElement.dataset.nav = (est?.idx ?? 0) < idx.current ? "voltar" : "avancar";
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
    document.documentElement.dataset.nav = "avancar";
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
    if (n === 3 && orc) void guardarNoCatalogo(orc);
    ir(passo((n + 1) as 2 | 3 | 4));
  };

  async function duplicar() {
    if (!orc) return;
    await salvarAgora();
    const copia = await duplicarOrcamento(orc.id);
    if (copia) {
      setOrc(copia);
      ir({ nome: "resultado" }, true);
      toast.success("Orçamento duplicado");
    }
  }

  async function excluir() {
    if (!orc) return;
    sujo.current = false;
    await excluirOrcamento(orc.id);
    setOrc(null);
    setHomeKey((k) => k + 1);
    ir(HOME, true);
    toast.success("Orçamento excluído");
  }

  async function criarExemplo() {
    const ex = orcamentoExemplo(ajustes);
    await salvarOrcamento(ex);
    setOrc(ex);
    ir({ nome: "resultado" });
  }

  // Telas que dependem de um orçamento voltam para a Home se não houver nenhum (ex.: página recarregada)
  const precisaOrc = tela.nome !== "home" && tela.nome !== "ajustes";
  useEffect(() => {
    if (precisaOrc && !orc) ir(HOME, true);
  }, [precisaOrc, orc, ir]);

  // Obra aceita não volta aos passos nem à assinatura, nem pelo botão de voltar do celular.
  const travada = orc?.situacao === "aceito" && (tela.nome === "passo" || tela.nome === "aceite");
  useEffect(() => {
    if (travada) ir({ nome: "resultado" }, true);
  }, [travada, ir]);
  if (travada) return null;

  const sairDaTelaDoCliente = () => {
    saidaLiberada.current = true;
    voltar();
  };

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
        return <StepObra {...comum} ajustes={ajustes} onProximo={() => proximo(1)} />;
      case 2:
        return <StepMaoDeObra {...comum} onProximo={() => proximo(2)} />;
      case 3:
        return <StepMateriais {...comum} ajustes={ajustes} onProximo={() => proximo(3)} />;
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
        ajustes={ajustes}
        editar={editar}
        onVoltar={() => void irHome()}
        onEditar={() => ir(passo(1))}
        onDuplicar={() => void duplicar()}
        onExcluir={() => void excluir()}
        onCliente={() => ir({ nome: "cliente" })}
        onPagamento={() => ir({ nome: "pagamento" })}
        onAceite={() => ir({ nome: "aceite" })}
        onObra={() => ir({ nome: "obra" })}
      />
    );
  }

  if (tela.nome === "cliente" && orc) return <ModoCliente orc={orc} ajustes={ajustes} onSair={sairDaTelaDoCliente} />;
  if (tela.nome === "aceite-confirmado" && orc) return <AceiteConfirmado orc={orc} onSair={sairDaTelaDoCliente} />;
  if (tela.nome === "pagamento" && orc) return <Pagamento orc={orc} editar={editar} onVoltar={voltar} />;
  if (tela.nome === "aceite" && orc) return <Aceite orc={orc} ajustes={ajustes} editar={editar} onVoltar={voltar} onConfirmado={() => ir({ nome: "aceite-confirmado" }, true)} />;
  if (tela.nome === "obra" && orc) return <Obra orc={orc} ajustes={ajustes} editar={editar} onVoltar={voltar} />;

  return (
    <Home
      key={homeKey}
      empresa={ajustes.empresa}
      onNovo={() => {
        setOrc(novoOrcamento(ajustes));
        sujo.current = false;
        ir(passo(1));
      }}
      onNovoDeModelo={(m) => {
        setOrc(orcamentoDeModelo(m, ajustes));
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
