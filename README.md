# BODYBUILDER

MVP funcional em portugues do Brasil para planejamento, execucao e acompanhamento de treinos.

## Funcionalidades implementadas

- Landing page com identidade BODYBUILDER.
- Modo demonstracao automatico, com usuario Tiago e dados persistidos no navegador.
- Dashboard inicial com treino do dia, prontidao, meta semanal e recomendacao de fadiga.
- Plano semanal demonstrativo de 6 dias.
- Execucao de treino com registro de carga, repeticoes, RIR, dor, descanso, vibracao e resumo.
- Historico de treinos.
- Evolucao com graficos de peso e volume.
- Biblioteca com 50 exercicios, busca e filtro.
- Perfil, conquistas, configuracoes, onboarding, check-in semanal e admin mockado.
- PWA instalavel com manifest, icones e service worker basico.
- Supabase preparado com `.env.example` e migration SQL com RLS.
- Testes unitarios e teste Playwright do fluxo principal em `tests/e2e`.

## Como executar

```bash
pnpm install
pnpm dev
```

Ou, se preferir npm:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O preview local desta entrega tambem esta respondendo em `http://127.0.0.1:3000`.

## Verificacoes

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Com npm:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Modo demonstracao

Funciona automaticamente quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nao estao configurados. Os dados ficam no `localStorage`.

## Supabase

1. Copie `.env.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Execute a migration em `supabase/migrations/001_initial_schema.sql`.

## Marca

Substitua:

- `public/brand/logo.svg`
- `public/brand/logo-horizontal.svg`
- `public/brand/mascot-default.png`
- `public/brand/mascot-leg-day.png`
- `public/brand/mascot-happy.png`
- `public/brand/mascot-tired.png`
- `public/brand/mascot-focus.png`

Enquanto as imagens do mascote nao existirem, o app usa o monograma `BB`.

## Limitacoes atuais

- Autenticacao Supabase esta preparada, mas o MVP usa modo local por padrao.
- Notificacoes locais estao estruturadas, sem agendamento avancado.
- Painel admin e uma base visual mockada.
- Fotos e videos de exercicios estao reservados para implementacao futura.
