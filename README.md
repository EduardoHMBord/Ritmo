# Ritmo — Organizador de Rotinas Acessível

O **Ritmo** é uma aplicação web responsiva, em `pt-BR`, para criar rotinas diárias, dividir atividades em etapas e acompanhar o progresso. Não há cadastro, login, backend, sincronização nem envio de dados a servidores.

---

## Funcionalidades

- **Rotinas:** criar, editar e excluir rotinas; definir os dias da semana; ver na página inicial apenas as rotinas do dia.
- **Atividades e etapas:** cadastrar atividades com título obrigatório e descrição, horário e ícone opcionais; adicionar, editar, excluir e reordenar etapas; mover itens com botões acessíveis, sem depender de arrastar e soltar.
- **Conclusão e progresso:** atividades sem etapas são marcadas diretamente; com etapas, só concluem quando todas as etapas estão feitas. O progresso é calculado por **atividades concluídas**, separadamente por **data + rotina**.
- **Modo simplificado:** mostra uma atividade por vez, com navegação entre anterior/próxima e indicação da posição, por exemplo “Atividade 2 de 5”. Avançar não conclui a atividade automaticamente.
- **Preferências visuais:** tamanho da fonte, contraste e espaçamento, persistidos entre sessões.
- **Leitura em voz alta:** usa a Web Speech API somente após ação explícita; se o navegador não suportar, o conteúdo continua integralmente em texto.
- **Backup:** exporta rotinas, progresso e preferências em JSON. A importação válida **substitui** os dados atuais após confirmação explícita; não há mesclagem. Arquivo inválido/incompatível ou cancelamento não altera os dados.

---

## Como executar

Requisitos: **Node.js e npm** em uma versão LTS recente (Vite 8 exige Node.js 20.19+ ou 22.12+) e um navegador atual.

```bash
npm install
npm run dev
```

O Vite mostra no terminal o endereço local, normalmente `http://localhost:5173`.

Para conferir a versão de produção:

```bash
npm run build
npm run preview
```

### Comandos disponíveis

| Comando | Finalidade |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Type-check e build de produção |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Lint com oxlint |
| `npm run test` | Suíte automatizada com Vitest + axe-core |
| `npm run test:watch` | Testes em modo interativo |

### Uso básico

1. Em **Rotinas**, crie uma rotina e selecione pelo menos um dia da semana.
2. Abra a rotina e cadastre atividades; divida as maiores em etapas.
3. Na **página inicial**, marque etapas ou atividades e acompanhe o progresso do dia.
4. Use o **Modo simplificado** para focar em uma atividade por vez.
5. Em **Configurações**, ajuste a aparência e exporte um backup quando quiser guardar uma cópia.

---

## Acessibilidade

Recursos implementados:

- HTML semântico, `lang="pt-BR"`, regiões e títulos adequados, rótulos associados e nomes acessíveis.
- Navegação por teclado, foco visível, ordem lógica, link para pular ao conteúdo e sem armadilhas de foco.
- Reordenação por botões, alvos com área confortável e confirmações antes de excluir.
- Tema de alto contraste, fonte ampliada e espaçamento ampliado.
- Estados importantes comunicados por texto, com `role="status"` e `role="alert"`, e ARIA apenas quando necessário.
- Reordenação e leitura em voz alta não dependem de mouse. O texto permanece disponível mesmo sem áudio.

---

## Estrutura do projeto

```text
src/
├─ App.tsx, App.css          shell, navegação e preferências
├─ main.tsx, index.css       entrada, tokens, temas e foco
├─ app/initialData.ts        estado inicial
├─ hooks/useAppState.ts      estado, CRUD, progresso, persistência, importação
├─ services/storage.ts       validação e persistência
├─ services/backup.ts        exportação, leitura e validação do JSON
├─ services/speech.ts        Web Speech API e fallback
├─ utils/                    datas, IDs, ordem, progresso, validação, weekdays
├─ views/                    Home, Routines, Activities, FocusMode, Settings
└─ test/ + *.test.ts(x)      fixtures, setup e suíte automatizada
```

---

## Referências

- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)
- [eMAG 3.1](https://emag.governoeletronico.gov.br/)
- [WAI — Web Accessibility Initiative](https://www.w3.org/WAI/)
- [NVDA](https://www.nvaccess.org/)
- [axe-core](https://github.com/dequelabs/axe-core)