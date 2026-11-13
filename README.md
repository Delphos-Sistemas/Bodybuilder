# BODYBUILDER 2.0

Aplicativo web instalável (PWA) para planejar, executar e acompanhar treinos de musculação, em português do Brasil.
Desenvolvido por Delphos Sistemas.

- **Tecnologias:** Next.js 15 (exportação estática), React 19, TypeScript, Tailwind CSS 3, Zustand, Zod, Recharts, Vitest e Playwright.
- **Dados:** 100% locais (localStorage do navegador), com exportação/importação em JSON validada por Zod. Não há servidor nem login.
- **Publicação:** Cloudflare Workers com Static Assets (sem Vercel).

A versão anterior foi preservada em `legacy/` (código em `legacy/v1/`, arquivos enviados soltos na raiz em `legacy/uploads-raiz/`) e continua no histórico do Git.

## Como rodar

Requisitos: Node.js 20 ou mais novo e npm.

```bash
npm install
npm run dev          # desenvolvimento: http://localhost:3000
```

Para testar exatamente o que vai para a Cloudflare (inclui o service worker do modo offline):

```bash
npm run build        # gera ./out e ./out/sw.js
npm run preview      # http://localhost:4173 (também acessível pelo IP da máquina na rede local)
```

> O service worker só é registrado no build de produção (`npm run build`), não no `npm run dev`.

## Como testar

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # Vitest (regras de sessão, tempos, busca, armazenamento, plano sugerido, animações de todos os exercícios)
npm run build && npm run test:e2e   # Playwright em celular (Pixel 7) e desktop
npm run check        # lint + tipos + unitários + build
```

Os testes de ponta a ponta cobrem: criar treino → recarregar → iniciar → registrar série → descanso → encerrar → histórico;
retomar sessão interrompida e encerrar manualmente; busca sem acento, filtros, ficha e demonstração; prancha estática;
modo demonstração separado; onboarding do perfil; ativação do som e player sem faixas; PWA abrindo sem internet;
Spotify só após consentimento e com playlist própria; calendário e anotações; exercício personalizado; aquecimento e
recorde no treino ativo; volume semanal, recordes e medidas; card para compartilhar.

**Sincronização (dois aparelhos):** precisa do Worker com D1 local, sem conta Cloudflare:

```bash
npx wrangler d1 migrations apply bodybuilder-sync-local --local -c wrangler.local.jsonc
npx wrangler dev -c wrangler.local.jsonc --port 8799
SYNC_BASE_URL=http://localhost:8799 npx playwright test sync --project desktop
```

**Safari (WebKit):** `npx playwright install webkit` e depois `PW_WEBKIT=1 npx playwright test`. O GitHub Actions
(`.github/workflows/ci.yml`) roda tudo isso em cada PR: lint, tipos, unitários, build, Chrome, Safari e sincronização.

Para rodar o Playwright contra o runtime local da Cloudflare: `npx wrangler dev --port 8787` em um terminal e
`PORT=8787 npx playwright test` em outro.

## Como publicar na Cloudflare

O app é exportado como site estático e servido pelo recurso **Static Assets** do Cloudflare Workers. Um Worker pequeno
(`worker/index.ts`) atende só `/api/*` (sincronização); todo o resto sai direto dos arquivos estáticos. Por isso **não**
é necessário o adaptador OpenNext. A pasta `.next` **não** deve ser publicada: o que vai para a Cloudflare é a pasta `out/`.

Configuração em `wrangler.jsonc` (`assets.directory = ./out`, página 404 própria, URLs sem `.html`, `run_worker_first`
só para `/api/*`). Sem o banco D1 ligado, o app funciona normalmente e a tela de sincronização avisa que ela está desligada.

```bash
npx wrangler login     # uma vez, com a conta Cloudflare da Delphos Sistemas
npm run deploy         # build + wrangler deploy
```

O primeiro deploy cria o Worker `bodybuilder` e um endereço `*.workers.dev`; domínio próprio se configura no painel da
Cloudflare (Workers & Pages → bodybuilder → Settings → Domains & Routes). Também é possível conectar o repositório no
painel (Workers Builds) usando `npm run build` como comando de build e `npx wrangler deploy` como comando de deploy.

Cabeçalhos de cache ficam em `public/_headers` (o `sw.js` nunca é guardado em cache pelo navegador).

**Publicado:** https://bodybuilder.delphoserp.workers.dev (Worker `bodybuilder`, ligado a este repositório pelo Workers
Builds). Cada push na branch de produção publica sozinho; as outras branches ganham um link de preview. Branch de produção
hoje: `nova-versao` (trocar para `main` em Settings → Builds depois do merge da PR #1).

A Vercel não faz parte do plano: desinstale o app da Vercel no GitHub (Settings → Integrations → GitHub Apps → Vercel) ou
remova os projetos no painel da Vercel.

### Sincronização entre aparelhos (opcional)

Sem e-mail nem senha: o app gera um código secreto de 24 caracteres; o mesmo código em outro aparelho junta os dados.
No servidor fica só o hash SHA-256 do código e um JSON por código, com controle de versão (dois aparelhos não se
sobrescrevem). Itens apagados viram "lápides" para não voltarem; o treino em andamento nunca sai do aparelho; as fotos
de progresso não são enviadas.

```bash
npx wrangler d1 create bodybuilder-sync        # copie o database_id que aparecer
# descomente o bloco "d1_databases" no wrangler.jsonc e cole o id
npx wrangler d1 migrations apply bodybuilder-sync --remote
npm run deploy
```

Limites: 4 MB por conta de sincronização; quem tiver o código vê os dados (o app avisa para guardá-lo em segredo).
Para algo com login de verdade (e-mail, recuperação de senha), o próximo passo seria Cloudflare Access ou um provedor de identidade.

### Controle do Spotify (opcional)

O player incorporado funciona sem configuração. Para o **controle remoto** (tocar a playlist do estilo no app do Spotify,
pausar, avançar e ver a faixa atual, inclusive com a tela bloqueada), cadastre um app em developer.spotify.com/dashboard:

1. Redirect URI: `https://SEU-DOMINIO/spotify-callback/` (e `http://localhost:3000/spotify-callback/` para testes).
2. APIs: Web API. Copie o **Client ID** (não há segredo: o login usa PKCE no próprio navegador).
3. Publique com a variável `NEXT_PUBLIC_SPOTIFY_CLIENT_ID=<client id>` no build (Workers Builds → Variables).

Sem essa variável o botão "Entrar com Spotify" não aparece. O controle exige Spotify **Premium**. Apps novos no Spotify
ficam em modo de desenvolvimento, limitados a 25 usuários cadastrados no painel, até o Spotify aprovar a cota estendida.

## O que funciona sem internet

Depois da primeira visita (ou ao instalar na tela inicial):

- **Funciona offline:** todas as telas, criação e edição de treinos, treino ativo com cronômetros e alertas, histórico,
  gráficos, perfil, biblioteca com busca e filtros, capas dos 50 exercícios.
- **Depende de rede na primeira vez:** os vídeos das demonstrações e as imagens grandes de “Posição inicial/final”
  são baixados sob demanda; depois de vistos, ficam guardados e funcionam offline.
- **Músicas:** arquivos adicionados pelo usuário ficam no IndexedDB do navegador e tocam offline.

### Estratégia de atualização do cache

`scripts/generate-sw.mjs` gera `out/sw.js` a cada build, com uma versão calculada a partir do conteúdo dos arquivos.
A nova versão é instalada em segundo plano e **fica em espera**: o app mostra “Nova versão do app disponível · Atualizar”
e só troca quando o usuário toca no botão (nunca recarrega sozinho no meio de um treino). Caches de versões antigas são
apagados na ativação. Os vídeos ficam num cache separado (`bb-media-v1`) que sobrevive às atualizações.

## Funcionalidades

- **Início:** treino do dia (próximo da rotação), meta semanal, progresso recente, retomada de sessão interrompida e modo demonstração.
- **Treinos:** criar do zero, modelos ABC, Push/Pull/Legs, Upper/Lower e Full Body; editar, duplicar e excluir;
  adicionar, remover e reordenar exercícios; séries, repetições (ou segundos, em isométricos), carga, RIR e descanso.
- **Treino ativo:** demonstração do exercício (mesmo componente da biblioteca) e ficha completa; série atual; carga,
  repetições, RIR e registro opcional de dor; cronômetro do treino, tempo do exercício e contagem regressiva do descanso,
  todos calculados a partir de horários registrados (sem desvio em segundo plano); ajuste de ±15 s, pular descanso,
  pular exercício, navegar entre exercícios, retomar após fechar o app, encerrar manualmente ou ao concluir; tela acesa
  (Wake Lock) quando o navegador permite.
- **Histórico:** duração real, séries, cargas, RIR, dor registrada e volume por sessão.
- **Evolução:** gráfico de peso corporal e de carga máxima por exercício, com estados vazios.
- **Perfil:** onboarding com objetivo, experiência, dias disponíveis e equipamentos; sugestão de plano editável baseada
  em regras simples, com aviso de que não é diagnóstico nem prescrição.
- **Configurações:** som dos alertas (ativado por ação explícita), teste de cada alerta, volume, vibração, player de
  música, exportar/importar/apagar dados, modo demonstração, informações offline e créditos de mídia.
- **Treino ativo:** mostra o que você fez na última vez e sugere a carga pela progressão dupla (bateu o topo da faixa
  de repetições em todas as séries: sobe a carga; ficou abaixo do mínimo: reduz; senão mantém). Para barra e Smith,
  mostra as anilhas por lado conforme a barra escolhida.
- **Histórico:** calendário do mês com os dias treinados, anotações livres em cada sessão, recordes batidos e card do
  treino em formato story (1080 × 1920) para compartilhar ou baixar.
- **Recordes pessoais:** maior carga e 1RM estimado (Epley, até 12 repetições); aviso na hora em que você bate um recorde.
- **Tipos de série:** aquecimento e drop set ficam registrados mas não contam na meta de séries, não iniciam descanso
  e ficam fora dos recordes e da progressão (o aquecimento também fica fora do volume).
- **Evolução:** volume semanal por músculo (principal 1, secundários 0,5) com a faixa de referência de 10 a 20 séries;
  recordes por exercício e linha do 1RM estimado no gráfico; medidas corporais com comparação e fotos de progresso
  (guardadas só no aparelho, reduzidas para 1080 px).
- **Exercícios personalizados:** criados na Biblioteca ou no seletor do editor; editáveis na ficha; entram no backup.
- **Proteção dos dados:** pedido de armazenamento persistente após o primeiro treino, lembrete de backup a cada 14 dias
  com treinos novos, status em Configurações e sincronização opcional entre aparelhos.
- **Modo demonstração:** dados de exemplo em um espaço separado; nunca entram na exportação nem se misturam com os seus.

### Áudio

Alertas distintos gerados com Web Audio: início (três notas ascendentes), fim do descanso (bipes agudos) e encerramento
(três notas descendentes, também no encerramento manual). Vibração opcional. Se o navegador bloquear o áudio, o treino
continua normalmente. Os bipes são **alertas**, não música.

**Spotify (padrão):** cada estilo abre o player oficial do Spotify incorporado, com uma playlist editorial como padrão
(`SPOTIFY_DEFAULTS` em `src/data/music.ts`). O usuário pode colar o link de qualquer playlist, álbum, artista ou faixa
por estilo, e a escolha fica salva no aparelho. O iframe só é carregado depois que o usuário toca em “Carregar player do
Spotify”, porque é conteúdo de terceiros com cookies. Com login no Spotify Premium as faixas tocam inteiras; sem login, o
Spotify toca prévias de 30 segundos. Não usa chaves de API nem servidor. Precisa de internet.

**Arquivos do aparelho:** tocar, pausar, próxima, troca de estilo durante a reprodução e volume.
**Nenhuma faixa vem incluída** porque ainda não há músicas com licença de distribuição verificada; o app informa isso e
permite escolher arquivos do próprio aparelho. Para incluir faixas licenciadas, coloque os arquivos em
`public/musica/<estilo>/` e registre título, artista, licença e fonte em `src/data/music.ts`.

## Mídia dos exercícios

### Animações próprias

Cada exercício tem uma **animação própria, desenhada em código** (`src/lib/anim/`): um boneco articulado em vista
lateral ou de frente, com o equipamento, que faz o movimento completo em loop. O músculo principal acende em laranja
forte e os secundários em laranja claro. Não há arquivo de imagem ou vídeo de terceiros, então não há licença externa a
cumprir, e tudo funciona offline (o desenho vai junto com o JavaScript, poucos kB).

- `rig.ts`: esqueleto (comprimentos, ângulos, cinemática direta e inversa para mãos/pés presos ao aparelho).
- `render.ts`: desenho em SVG (corpo, aparelhos, músculos em destaque, enquadramento automático, tempo do ciclo).
- `library.ts`: as posições-chave de cada um dos 50 exercícios (ângulos ou alvos de mão/pé) e o cenário.

Conferência visual: `npx vite-node scripts/anim-sheet.ts saida.html [ids...]` gera uma folha com as posições-chave;
`scripts/anim-frames.ts` exporta quadros para montar GIF/vídeo de prévia. `scripts/anim-debug.ts <id>` mostra as
coordenadas das articulações.

### Como a demonstração funciona

- Biblioteca e ficha: a animação toca sozinha quando está na tela e pausa fora dela, com a aba escondida ou com
  “reduzir movimento” ligado no sistema (aí começa parada). Botão de pausar/reproduzir em cada card.
- Ficha e treino ativo: alternância **Animação / Posições** (“Posição inicial” e “Posição final” lado a lado).
- Prancha (isométrico): posição sustentada, com uma leve respiração.
- Miniaturas (montar treino, escolher exercício): quadro estático da posição final.
- Exercício criado pelo usuário: sem animação (ícone).

## Limitações conhecidas e pendências

- **Animações estilizadas:** o boneco é propositalmente simples (formas arredondadas). Movimentos que acontecem “para
  dentro” da tela (voador, crucifixo) usam vista de frente com encurtamento aproximado.
- **Imagem separada do aparelho:** pendente para os 10 exercícios em máquina/Smith (marcados no inventário).
- **Música:** nenhuma faixa licenciada incluída (ver “Áudio”).
- **Sincronização:** pronta no código e testada localmente; só funciona depois de criar o banco D1 na conta Cloudflare.
- **Controle do Spotify:** pronto no código e testado com o Spotify simulado; precisa do Client ID e de Premium.
  As playlists padrão não puderam ser abertas daqui (rede bloqueada) e devem ser conferidas.
- **Alertas com a tela bloqueada:** o navegador pode silenciar o bipe do fim do descanso; o tempo continua certo e o
  app avisa. Resolver de verdade exige notificação enviada por servidor (Web Push), não incluída.
- **Testes em aparelho real pendentes:** alertas sonoros e vibração com a tela bloqueada, Wake Lock e instalação na tela
  inicial precisam ser conferidos em Android (Chrome) e iPhone (Safari). No iPhone não há vibração pela web.
- **Publicação:** depende de login na conta Cloudflare (`npx wrangler login`).

## Estrutura

```
src/app/            telas (Início, Treinos, editor, Treino ativo, Biblioteca, Evolução, Perfil, Histórico, Configurações)
src/components/     AppShell, ExerciseMedia, ExerciseCard, ExerciseSheet, MuscleMap, MusicPlayer, AudioControls…
src/data/           exercícios, modelos, demonstração, música
src/lib/anim/       animações dos exercícios (boneco em SVG)
src/lib/            tipos, store (Zustand + persistência), regras de sessão, tempos, estatísticas, recordes, volume,
                    sincronização, Spotify, card, plano, esquemas Zod, áudio
worker/             Worker da Cloudflare (API de sincronização) e migrations/ do D1
scripts/            conferência das animações, service worker e servidor de pré-visualização
tests/unit, tests/e2e
legacy/             versão anterior preservada
```
