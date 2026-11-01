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

Sem ajudante é só uma entrada diferente na mesma fórmula: diária do ajudante zerada e passagem e almoço pela metade (são valores da dupla). Os campos continuam editáveis.

## Em volta da regra

Tudo isto usa os resultados de `calcular`, mas nunca muda como o preço é calculado.

- **Proposta e tela do cliente** (`domain/proposta.ts`): só valor, escopo, materiais sem preço, prazo, parcelas e condições. Custo, imposto, lucro e margem ficam só no relatório interno.
- **Desconto** (`domain/negociacao.ts`): simula outro valor e mostra o ponto de prejuízo. O valor combinado fica em `valorFechado`, sem substituir o recomendado.
- **Situação** (`domain/funil.ts`): rascunho, enviado, aceito ou perdido, com retorno após 3 dias, validade e taxa de fechamento. Sair de "aceito" apaga a assinatura.
- **Plano de pagamento** (`domain/pagamento.ts`): parcelas e caixa por etapa. O saldo final é igual ao lucro. No faturamento direto, considera que o cliente paga o material na loja e que as parcelas são sobre o restante.
- **Caderneta e extras** (`domain/obra.ts`): previsto x real e aditivos a mercado + 15%. Enquanto a obra anda, cada parte usa o maior valor entre previsto e lançado.
- **Modelos, checklist e catálogo** (`domain/defaults.ts`, `checklist.ts`, `catalogo.ts`): modelos saem de obras reais e usam os Ajustes atuais. O catálogo se preenche sozinho no passo de materiais e avisa de preço com mais de 30 dias.

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

Em **Ajustes**, **Exportar backup** salva um arquivo `.json` com os orçamentos, os ajustes, os modelos e o catálogo; **Importar backup** restaura (orçamentos com o mesmo id são substituídos). Backups antigos continuam funcionando.

## Estrutura

```
src/domain      regra de negócio, tipos, formatação e relatório (sem React)
src/storage     IndexedDB (idb-keyval)
src/export      relatório interno (Excel e PDF), proposta em PDF e download/compartilhamento
src/components  campos, stepper, régua de margem, barra inferior, painéis de negociação e situação
src/screens     Home, 4 passos, Resultado, Modo cliente, Pagamento, Aceite, Caderneta e Ajustes
```

`exceljs` e `jspdf` são carregados com `import()` só na hora de exportar, para o app abrir rápido.
