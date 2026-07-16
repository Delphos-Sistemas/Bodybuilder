# BODYBUILDER

MVP funcional em português do Brasil para planejamento, execução e acompanhamento de treinos.

## Funcionalidades implementadas

- Landing page com identidade BODYBUILDER.
- Modo demonstração automático, com usuário Tiago e dados persistidos no navegador.
- Dashboard inicial com treino do dia, prontidão, meta semanal e recomendação de fadiga.
- Plano semanal demonstrativo de 6 dias.
- Execução de treino com registro de carga, repetições, RIR, dor, descanso, vibração e resumo.
- Histórico de treinos.
- Evolução com gráficos de peso e volume.
- Biblioteca com 50 exercícios, busca e filtro.
- Perfil, conquistas, configurações, onboarding, check-in semanal e admin mockado.
- PWA instalável com manifest, ícones e service worker básico.
- Supabase preparado com `.env.example` e migration SQL com RLS.
- Testes unitários e teste Playwright do fluxo principal em `tests/e2e`.

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

Acesse `http://localhost:3000`. O preview local desta entrega também está respondendo em `http://127.0.0.1:3000`.

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

## Modo demonstração

Funciona automaticamente quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estão configurados. Os dados ficam no `localStorage`.

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

Enquanto as imagens do mascote não existirem, o app usa o monograma `BB`.

## Limitacoes atuais

- Autenticação Supabase está preparada, mas o MVP usa modo local por padrão.
- Notificações locais estão estruturadas, sem agendamento avançado.
- Painel admin é uma base visual mockada.
- Fotos e vídeos de exercícios estão reservados para implementação futura.
