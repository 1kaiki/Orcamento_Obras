import { BookOpen, Download, ImagePlus, Monitor, Moon, RotateCcw, Sun, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Campo from "@/components/Campo";
import MoneyInput from "@/components/MoneyInput";
import PercentInput from "@/components/PercentInput";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dataBR } from "@/domain/format";
import type { Ajustes, DadosEmpresa, ItemCatalogo, Modelo } from "@/domain/types";
import { baixar } from "@/export/download";
import { imagemParaPng } from "@/lib/imagem";
import { definirTema, useTema, type Tema } from "@/lib/tema";
import { excluirModelo, gerarBackup, importarBackup, lerCatalogo, listarModelos, salvarCatalogo } from "@/storage/repo";

interface Props {
  ajustes: Ajustes;
  onChange: (a: Ajustes) => void;
  onRestaurar: () => void;
  onImportado: () => void;
  onVoltar: () => void;
}

export default function Settings({ ajustes, onChange, onRestaurar, onImportado, onVoltar }: Props) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [confirmando, setConfirmando] = useState(false);
  const tema = useTema();
  const logo = useRef<HTMLInputElement>(null);
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const set = (parcial: Partial<Ajustes>) => onChange({ ...ajustes, ...parcial });
  const setEmpresa = (parcial: Partial<DadosEmpresa>) => set({ empresa: { ...ajustes.empresa, ...parcial } });

  function recarregar() {
    lerCatalogo().then(setCatalogo).catch(() => undefined);
    listarModelos().then(setModelos).catch(() => undefined);
  }
  useEffect(recarregar, []);

  function mudarCatalogo(novo: ItemCatalogo[]) {
    setCatalogo(novo);
    void salvarCatalogo(novo);
  }

  async function escolherLogo(f: File | undefined) {
    if (!f) return;
    try {
      setEmpresa({ logo: await imagemParaPng(f) });
    } catch {
      toast.error("Não foi possível abrir essa imagem.");
    } finally {
      if (logo.current) logo.current.value = "";
    }
  }

  async function exportar() {
    const blob = await gerarBackup();
    const dia = new Date().toISOString().slice(0, 10);
    await baixar(blob, `orca-obra-backup-${dia}.json`);
    toast.success("Backup exportado");
  }

  async function importar(f: File | undefined) {
    if (!f) return;
    try {
      const n = await importarBackup(await f.text());
      toast.success(`Backup importado: ${n} orçamento(s).`);
      onImportado();
      recarregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível importar o arquivo.");
    } finally {
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  return (
    <>
      <TopBar titulo="Ajustes" onVoltar={onVoltar} />
      <main className="mx-auto flex w-full max-w-content flex-col gap-4 px-gutter pb-section pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tema} onValueChange={(t) => definirTema(t as Tema)}>
              <TabsList aria-label="Tema do aplicativo">
                <TabsTrigger value="sistema">
                  <Monitor aria-hidden="true" /> Sistema
                </TabsTrigger>
                <TabsTrigger value="claro">
                  <Sun aria-hidden="true" /> Claro
                </TabsTrigger>
                <TabsTrigger value="escuro">
                  <Moon aria-hidden="true" /> Escuro
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sistema" className="text-caption text-muted-foreground">
                Segue o tema do celular.
              </TabsContent>
              <TabsContent value="claro" className="text-caption text-muted-foreground">
                O mais fácil de ler no sol.
              </TabsContent>
              <TabsContent value="escuro" className="text-caption text-muted-foreground">
                Mais confortável em lugar fechado e à noite.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sua empresa</CardTitle>
            <p className="text-label text-muted-foreground">Aparece na proposta e na tela do cliente.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Campo id="empresa-nome" label="Nome">
              <Input id="empresa-nome" autoComplete="off" value={ajustes.empresa.nome} onChange={(e) => setEmpresa({ nome: e.target.value })} />
            </Campo>
            <Campo id="empresa-cnpj" label="CNPJ">
              <Input id="empresa-cnpj" autoComplete="off" inputMode="numeric" value={ajustes.empresa.cnpj} onChange={(e) => setEmpresa({ cnpj: e.target.value })} />
            </Campo>
            <Campo id="empresa-telefone" label="Telefone">
              <Input id="empresa-telefone" type="tel" autoComplete="off" value={ajustes.empresa.telefone} onChange={(e) => setEmpresa({ telefone: e.target.value })} />
            </Campo>
            <div className="flex items-center gap-3">
              {ajustes.empresa.logo && <img src={ajustes.empresa.logo} alt="Logo da empresa" className="size-14 rounded-sm object-contain" />}
              <Button variant="secondary" className="grow" onClick={() => logo.current?.click()}>
                <ImagePlus aria-hidden="true" /> {ajustes.empresa.logo ? "Trocar logo" : "Escolher logo"}
              </Button>
              {ajustes.empresa.logo && (
                <Button variant="ghost" size="icon" className="text-danger" aria-label="Remover logo" onClick={() => setEmpresa({ logo: "" })}>
                  <Trash2 aria-hidden="true" />
                </Button>
              )}
              <input ref={logo} type="file" accept="image/*" hidden onChange={(e) => void escolherLogo(e.target.files?.[0])} />
            </div>
            <MoneyInput label="Validade da proposta" prefixo="" sufixo="dias" variante="quantidade" value={ajustes.validadeDias} onChange={(validadeDias) => set({ validadeDias })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materiais e modelos</CardTitle>
            <p className="text-label text-muted-foreground">O catálogo guarda sozinho os preços que você digita. Para criar um modelo, abra um orçamento e use o menu de ações.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="w-full">
                  <BookOpen aria-hidden="true" /> Catálogo ({catalogo.length})
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle>Catálogo de materiais</SheetTitle>
                <SheetDescription>Ao mudar um preço aqui, os orçamentos abertos avisam que há um valor mais novo.</SheetDescription>
                {catalogo.length === 0 && <p className="text-body text-muted-foreground">Ainda vazio. Ele se preenche quando você passa pelo passo de materiais.</p>}
                {catalogo.map((c, i) => (
                  <div key={c.descricao} className="flex items-end gap-1 border-t pt-3">
                    <div className="min-w-0 flex-1">
                      <MoneyInput
                        label={c.descricao}
                        ajuda={`Atualizado em ${dataBR(c.atualizadoEm)}`}
                        value={c.precoUnitario}
                        onChange={(v) => mudarCatalogo(catalogo.map((x, k) => (k === i ? { ...x, precoUnitario: v, atualizadoEm: Date.now() } : x)))}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="mb-5 shrink-0 text-danger" aria-label={`Remover ${c.descricao}`} onClick={() => mudarCatalogo(catalogo.filter((_, k) => k !== i))}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </SheetContent>
            </Sheet>
            {modelos.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 border-t pt-2">
                <span className="min-w-0 truncate font-medium">{m.nome}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-danger"
                  aria-label={`Excluir modelo ${m.nome}`}
                  onClick={() => {
                    setModelos(modelos.filter((x) => x.id !== m.id));
                    void excluirModelo(m.id);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="px-1 pt-2 text-body text-muted-foreground">Os valores abaixo são usados nos orçamentos novos. Cada orçamento guarda a cópia com que foi feito. Ajuste à realidade da sua região.</p>

        <Card>
          <CardHeader>
            <CardTitle>Mão de obra</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <MoneyInput label="Diária do eletricista" value={ajustes.diariaEletricista} onChange={(v) => set({ diariaEletricista: v })} />
            <MoneyInput label="Diária do ajudante" value={ajustes.diariaAjudante} onChange={(v) => set({ diariaAjudante: v })} />
            <MoneyInput label="Passagem (dupla, por dia)" value={ajustes.passagem} onChange={(v) => set({ passagem: v })} />
            <MoneyInput label="Almoço (dupla, por dia)" value={ajustes.almoco} onChange={(v) => set({ almoco: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regra de preço</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <PercentInput label="Acréscimo na mão de obra" value={ajustes.markupMO} onChange={(v) => set({ markupMO: v })} />
            <PercentInput label="Acréscimo nas ferramentas" value={ajustes.markupFerramentas} onChange={(v) => set({ markupFerramentas: v })} />
            <PercentInput label="Acréscimo no material (meu CNPJ)" value={ajustes.markupMaterialCnpj} onChange={(v) => set({ markupMaterialCnpj: v })} />
            <PercentInput label="Acréscimo no material (faturamento direto)" value={ajustes.markupMaterialDireto} onChange={(v) => set({ markupMaterialDireto: v })} />
            <PercentInput label="Imposto na nota" value={ajustes.imposto} onChange={(v) => set({ imposto: v })} />
            <div className="grid grid-cols-2 gap-3">
              <PercentInput label="Margem mínima" value={ajustes.margemMin} onChange={(v) => set({ margemMin: v })} />
              <PercentInput label="Margem máxima" value={ajustes.margemMax} onChange={(v) => set({ margemMax: v })} />
            </div>
            <Button variant="ghost" className="mt-1 w-full text-danger" onClick={() => setConfirmando(true)}>
              <RotateCcw aria-hidden="true" /> Voltar à regra original
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup</CardTitle>
            <p className="text-label text-muted-foreground">Guarde seus orçamentos num arquivo para não perder se trocar de celular.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="px-2" onClick={() => void exportar()}>
              <Download aria-hidden="true" /> Exportar
            </Button>
            <Button variant="secondary" className="px-2" onClick={() => arquivo.current?.click()}>
              <Upload aria-hidden="true" /> Importar
            </Button>
            <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={(e) => void importar(e.target.files?.[0])} />
          </CardContent>
        </Card>
      </main>

      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent>
          <DialogTitle>Voltar à regra original?</DialogTitle>
          <DialogDescription>Os valores desta tela voltam aos padrões. Seus orçamentos não mudam.</DialogDescription>
          <div className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onRestaurar();
                setConfirmando(false);
                toast.success("Regra original restaurada");
              }}
            >
              Voltar ao padrão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
