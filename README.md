# Orça Obra

App web instalável (PWA) para o eletricista calcular quanto cobrar em uma obra comercial, seguindo uma regra de preço fixa. Passo a passo no celular, resultado com a conta explicada, exportação para Excel (com fórmulas) e PDF. Funciona offline e guarda tudo no próprio aparelho.

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm test           # testes da regra de negócio, do relatório e das exportações
npm run build      # confere os tipos e gera a pasta dist/
npm run preview    # abre o build em http://localhost:4173/orca-obra/
```

Requer Node 20 ou mais novo.

## A regra de preço

Está toda em `src/domain/pricing.ts`, uma função pura (`calcular`). A tela, o Excel e o PDF usam os mesmos números dela.

- Custo `A` = mão de obra + ferramentas + materiais. Mão de obra = dias × duplas × (eletricista + ajudante + passagem + almoço).
- Venda: `B` = MO × 2, `C` = ferramentas × 1,15, `D` = materiais × 1,15 (faturamento direto) ou × 1,40 (meu CNPJ).
- Imposto `E` = (B + C + D) × imposto.
- Resultado = B + C + D − A − E. Margem = resultado ÷ preço de venda. Faixa ideal: 15% a 20%.
- Preço para a margem `m` = A ÷ (1 − imposto − m). Se a margem da regra sair da faixa, o valor recomendado é o preço para 15% (ou 20%).

Observação: o exemplo original da regra mostrava "Resultado: R$ 13.125". Esse número é só venda − custo e esquece o imposto. A fórmula da regra dá **R$ 3.386,25**, que é o que o app e os testes usam.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie o código para a branch `main`.
2. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
3. O workflow `.github/workflows/deploy.yml` roda os testes, gera o build e publica. O app fica em `https://<usuario>.github.io/<repositorio>/`.

O `base` do Vite é o nome do repositório. No workflow ele vem automático. Para publicar manualmente (por exemplo no Vercel ou em outra pasta), gere o build com `VITE_BASE=/seu-caminho/ npm run build`, ou use `VITE_BASE=/` para um domínio próprio. O valor padrão do `npm run build` é `/orca-obra/`; mude `NOME_DO_REPOSITORIO` em `vite.config.ts` se preferir.

## Instalar no Android

1. Abra o endereço do app no **Chrome**.
2. Toque no menu **⋮** e em **Adicionar à tela inicial** (ou **Instalar app**).
3. Abra pelo ícone na tela inicial. Depois da primeira abertura com internet, funciona sem conexão.

Ao exportar no celular, o app abre o compartilhamento do sistema com o arquivo, para mandar direto no WhatsApp. No computador, o arquivo é baixado.

## Ícones

Gerados por `npm run icons` (`scripts/gerar-icones.mjs`, sem dependências): raio amarelo `#F2B01E` em fundo `#141B24`. O `icon-maskable-512.png` mantém o desenho na zona segura.

## Backup

Em **Ajustes**, **Exportar backup** salva um arquivo `.json` com os orçamentos e os ajustes; **Importar backup** restaura (orçamentos com o mesmo id são substituídos).

## Estrutura

```
src/domain      regra de negócio, tipos, formatação e relatório (sem React)
src/storage     IndexedDB (idb-keyval)
src/export      Excel (exceljs), PDF (jspdf) e download/compartilhamento
src/components  campos, stepper, régua de margem, barra inferior
src/screens     Home, 4 passos, Resultado e Ajustes
```

`exceljs` e `jspdf` são carregados com `import()` só na hora de exportar, para o app abrir rápido.
