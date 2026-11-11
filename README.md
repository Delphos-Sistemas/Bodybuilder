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
npm test             # Vitest (regras de sessão, tempos, busca, armazenamento, plano sugerido, integridade da mídia)
npm run build && npm run test:e2e   # Playwright em celular (Pixel 7) e desktop
npm run check        # lint + tipos + unitários + build
```

Os testes de ponta a ponta cobrem: criar treino → recarregar → iniciar → registrar série → descanso → encerrar → histórico;
retomar sessão interrompida e encerrar manualmente; busca sem acento, filtros, ficha e demonstração; prancha estática;
modo demonstração separado; onboarding do perfil; ativação do som e player sem faixas; PWA abrindo sem internet.

Para rodar o Playwright contra o runtime local da Cloudflare: `npx wrangler dev --port 8787` em um terminal e
`PORT=8787 npx playwright test` em outro.

## Como publicar na Cloudflare

O app não tem rotas dinâmicas de servidor (todos os dados ficam no navegador), então ele é exportado como site estático e
servido pelo recurso **Static Assets** do Cloudflare Workers. Por isso **não** é necessário o adaptador OpenNext; ele só
seria preciso se o app passasse a usar rotas de API, SSR ou middleware. A pasta `.next` **não** deve ser publicada:
o que vai para a Cloudflare é a pasta `out/`.

Configuração em `wrangler.jsonc` (`assets.directory = ./out`, página 404 própria, URLs sem `.html`).

```bash
npx wrangler login     # uma vez, com a conta Cloudflare da Delphos Sistemas
npm run deploy         # build + wrangler deploy
```

O primeiro deploy cria o Worker `bodybuilder` e um endereço `*.workers.dev`; domínio próprio se configura no painel da
Cloudflare (Workers & Pages → bodybuilder → Settings → Domains & Routes). Também é possível conectar o repositório no
painel (Workers Builds) usando `npm run build` como comando de build e `npx wrangler deploy` como comando de deploy.

Cabeçalhos de cache ficam em `public/_headers` (o `sw.js` nunca é guardado em cache pelo navegador).

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
- **Histórico:** calendário do mês com os dias treinados e anotações livres em cada sessão.
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

### Fonte e licença

Todas as ilustrações vêm do projeto **Everkinetic** (<https://github.com/everkinetic/data>), licença
**CC BY-SA 4.0**. Foram adaptadas por `scripts/build-media.mjs` (recorte com registro entre os quadros, enquadramento 4:3
800×600, traço cinza-grafite sobre fundo cinza-claro e vídeo curto de 3,7 s). Por exigência da licença, **as adaptações
(pasta `public/media/exercicios/`) também ficam sob CC BY-SA 4.0**, com atribuição exibida na ficha de cada exercício e em
Configurações → Créditos de mídia. Os originais usados estão em `media-src/everkinetic/`.

Para regenerar: `npm run media` (requer ImageMagick e ffmpeg com libx264/libvpx-vp9). O mapeamento exercício → arquivos
está em `scripts/media-map.json`.

### Como a demonstração funciona

- Card: capa leve (WebP, ~6 kB) com botão de reproduzir; o vídeo só é baixado quando o usuário toca.
- Apenas um vídeo toca por vez; nada toca sozinho. Com “reduzir movimento” ativo no sistema, as animações da interface são desligadas.
- Ficha e treino ativo: imagem maior, alternância **Vídeo / Posições** (“Posição inicial” e “Posição final” lado a lado).
- O vídeo é um loop sem som que **alterna entre as duas posições reais** do exercício (com transição suave). Não é uma
  animação quadro a quadro do movimento: não inventa posições intermediárias, para não ensinar um movimento errado.
- Músculos trabalhados: mapa anatômico próprio (frente e costas) com o músculo principal em vermelho e os secundários em vermelho-claro.

### Inventário

| Situação | Quantidade |
| --- | --- |
| Exercícios na biblioteca | 50 |
| Com vídeo curto (WebM + MP4) e imagens de posição inicial/final | 49 |
| Só imagem estática correta | 1 (Prancha frontal: posição sustentada) |
| GIF | 0 |
| Sem nenhum material | 0 |
| Exercícios em máquina/Smith sem imagem separada do aparelho | 10 (pendente) |

Os seis exemplos-piloto (supino reto, remada curvada, agachamento livre, leg press, elevação lateral e prancha) foram
conferidos quadro a quadro quanto a postura, equipamento, ordem das posições e enquadramento antes de aplicar o padrão
aos demais. Ajustes feitos na revisão: ordem início/fim corrigida em 8 exercícios; troca de material errado ou cortado
em 3 (remada cavalinho → remada invertida; hack → agachamento no Smith; panturrilha em pé, com os pés cortados na
ilustração, → panturrilha sentada); “Paralelas” renomeada para “Paralelas assistidas”, pois a ilustração mostra a máquina.

| # | Exercício | Material | Imagem do aparelho | Arquivos de origem (Everkinetic) |
| --- | --- | --- | --- | --- |
| 1 | Supino reto com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | bench-press-2, bench-press-1 |
| 2 | Supino inclinado com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | dumbbell-incline-bench-press-2, dumbbell-incline-bench-press-1 |
| 3 | Supino reto com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | bench-press-dumbbell-1, bench-press-dumbbell-2 |
| 4 | Crucifixo com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | dumbbell-flys-1, dumbbell-flys-2 |
| 5 | Crossover na polia alta | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | cable-crossover-1, cable-crossover-2 |
| 6 | Voador (peck deck) | Vídeo WebM/MP4 + imagens inicial/final | pendente | butterfly-machine-1, butterfly-machine-2 |
| 7 | Paralelas assistidas | Vídeo WebM/MP4 + imagens inicial/final | pendente | chest-dips-1, chest-dips-2 |
| 8 | Flexão de braço | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | push-ups-1, push-ups-2 |
| 9 | Remada curvada com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | 809a, 809b |
| 10 | Remada baixa na polia | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | seated-cable-rows-2, seated-cable-rows-1 |
| 11 | Puxada frontal aberta | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | wide-grip-lat-pull-down-2, wide-grip-lat-pull-down-1 |
| 12 | Puxada supinada | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | underhand-pull-downs-1, underhand-pull-downs-2 |
| 13 | Barra fixa | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | pull-ups-1, pull-ups-2 |
| 14 | Remada invertida | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | body-row-2, body-row-1 |
| 15 | Levantamento terra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | barbell-dead-lifts-2, barbell-dead-lifts-1 |
| 16 | Hiperextensão lombar no banco 45° | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | hyperextensions-1, hyperextensions-2 |
| 17 | Agachamento livre com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | barbell-squat-1, barbell-squat-2 |
| 18 | Leg press 45° | Vídeo WebM/MP4 + imagens inicial/final | pendente | leg-press-1, leg-press-2 |
| 19 | Agachamento no Smith | Vídeo WebM/MP4 + imagens inicial/final | pendente | smith-machine-squats-1, smith-machine-squats-2 |
| 20 | Cadeira extensora | Vídeo WebM/MP4 + imagens inicial/final | pendente | leg-extensions-1, leg-extensions-2 |
| 21 | Mesa flexora | Vídeo WebM/MP4 + imagens inicial/final | pendente | lying-leg-curl-machine-1, lying-leg-curl-machine-2 |
| 22 | Cadeira flexora | Vídeo WebM/MP4 + imagens inicial/final | pendente | seated-leg-curl-1, seated-leg-curl-2 |
| 23 | Stiff com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | romanian-dead-lift-1, romanian-dead-lift-2 |
| 24 | Afundo com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | dumbbell-lunges-1, dumbbell-lunges-2 |
| 25 | Avanço caminhando | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | walking-lunges-1, walking-lunges-2 |
| 26 | Cadeira abdutora | Vídeo WebM/MP4 + imagens inicial/final | pendente | thigh-abductor-1, thigh-abductor-2 |
| 27 | Cadeira adutora | Vídeo WebM/MP4 + imagens inicial/final | pendente | thigh-adductor-1, thigh-adductor-2 |
| 28 | Ponte de glúteo | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | bridging-1, bridging-2 |
| 29 | Panturrilha sentada com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | seated-calf-raise-with-barbell-1, seated-calf-raise-with-barbell-2 |
| 30 | Panturrilha no leg press | Vídeo WebM/MP4 + imagens inicial/final | pendente | calves-press-on-leg-machine-1, calves-press-on-leg-machine-2 |
| 31 | Desenvolvimento com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | dumbbell-shoulder-press-1, dumbbell-shoulder-press-2 |
| 32 | Desenvolvimento militar sentado | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | seated-military-press-1, seated-military-press-2 |
| 33 | Elevação lateral com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | lateral-dumbbell-raises-2, lateral-dumbbell-raises-1 |
| 34 | Elevação frontal com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | front-dumbbell-raise-1, front-dumbbell-raise-2 |
| 35 | Desenvolvimento Arnold | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | arnold-press-1, arnold-press-2 |
| 36 | Remada alta com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | upright-barbell-rows-2, upright-barbell-rows-1 |
| 37 | Encolhimento com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | barbell-shrugs-1, barbell-shrugs-2 |
| 38 | Crucifixo inverso no banco inclinado | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | lying-rear-lateral-raise-1, lying-rear-lateral-raise-2 |
| 39 | Rosca direta com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | bicep-curls-with-barbell-1, bicep-curls-with-barbell-2 |
| 40 | Rosca martelo | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | bicep-hammer-curl-with-dumbbell-1, bicep-hammer-curl-with-dumbbell-2 |
| 41 | Rosca alternada com halteres | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | alternating-bicep-curl-with-dumbbell-1, alternating-bicep-curl-with-dumbbell-2 |
| 42 | Rosca Scott com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | preacher-curl-with-barbell-1, preacher-curl-with-barbell-2 |
| 43 | Tríceps na polia com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | triceps-pushdown-with-cable-1, triceps-pushdown-with-cable-2 |
| 44 | Tríceps na polia com corda | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | triceps-pushdown-with-rope-and-cable-1, triceps-pushdown-with-rope-and-cable-2 |
| 45 | Tríceps testa com barra | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | lying-triceps-press-with-barbell-1, lying-triceps-press-with-barbell-2 |
| 46 | Tríceps francês com halter | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | seated-triceps-press-with-dumbbell-2, seated-triceps-press-with-dumbbell-1 |
| 47 | Prancha frontal | Imagem estática (posição sustentada) | não se aplica | 848 |
| 48 | Abdominal supra com pernas no banco | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | crunches-1, crunches-2 |
| 49 | Abdominal na polia | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | seated-ab-crunch-with-cable-1, seated-ab-crunch-with-cable-2 |
| 50 | Elevação de pernas deitado | Vídeo WebM/MP4 + imagens inicial/final | não se aplica | flat-bench-leg-raises-1, flat-bench-leg-raises-2 |
## Limitações conhecidas e pendências

- **Estilo de referência:** as imagens de referência citadas no pedido não chegaram. As ilustrações Everkinetic são
  desenhos de traço (sem músculos coloridos na figura); o vermelho dos músculos aparece no mapa anatômico separado da ficha.
  Ilustrações no estilo “atlas” (figura realista cinza com músculos em vermelho) exigem material licenciado ou produção própria.
- **Movimento contínuo:** vídeos com o movimento completo exigiriam filmagem própria ou animação produzida
  (ex.: Remotion/HyperFrames, que não estavam instalados neste ambiente). O formato atual alterna duas posições corretas.
- **Imagem separada do aparelho:** pendente para os 10 exercícios em máquina/Smith (marcados no inventário).
- **Música:** nenhuma faixa licenciada incluída (ver “Áudio”).
- **Sem sincronização entre aparelhos:** os dados ficam no navegador. Use Exportar/Importar para backup. Supabase não foi
  incluído porque exigiria autenticação e isolamento de dados por usuário reais.
- **Testes em aparelho real pendentes:** alertas sonoros e vibração com a tela bloqueada, Wake Lock e instalação na tela
  inicial precisam ser conferidos em Android (Chrome) e iPhone (Safari). No iPhone não há vibração pela web.
- **Publicação:** depende de login na conta Cloudflare (`npx wrangler login`).

## Estrutura

```
src/app/            telas (Início, Treinos, editor, Treino ativo, Biblioteca, Evolução, Perfil, Histórico, Configurações)
src/components/     AppShell, ExerciseMedia, ExerciseCard, ExerciseSheet, MuscleMap, MusicPlayer, AudioControls…
src/data/           exercícios, modelos, demonstração, mídia gerada, música
src/lib/            tipos, store (Zustand + persistência), regras de sessão, tempos, estatísticas, plano, esquemas Zod, áudio
scripts/            geração de mídia, service worker e servidor de pré-visualização
public/media/       demonstrações adaptadas (CC BY-SA 4.0)
media-src/          ilustrações originais Everkinetic (CC BY-SA 4.0)
tests/unit, tests/e2e
legacy/             versão anterior preservada
```
