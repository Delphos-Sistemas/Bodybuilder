import type { Exercise } from "@/lib/types";

/**
 * Biblioteca inicial: 50 exercícios.
 * As instruções são orientações gerais de execução e não substituem a avaliação
 * de um profissional de educação física ou de saúde.
 */
export const EXERCISES: Exercise[] = [
  // ───────────── Peito ─────────────
  {
    id: "supino-reto",
    name: "Supino reto com barra",
    primary: "peito",
    secondary: ["triceps", "ombros"],
    equipment: "barra",
    instructions: [
      "Deite no banco reto com os olhos alinhados à barra e os pés firmes no chão.",
      "Segure a barra um pouco mais aberta que a largura dos ombros e retire do suporte com os braços estendidos sobre o peito.",
      "Desça a barra de forma controlada até tocar a parte média/baixa do peito, com os cotovelos a cerca de 45° do tronco.",
      "Empurre a barra de volta até estender os braços, mantendo as escápulas encaixadas no banco."
    ],
    errors: [
      "Quicar a barra no peito para ganhar impulso.",
      "Abrir os cotovelos a 90° do tronco, sobrecarregando os ombros.",
      "Tirar o quadril do banco durante a subida."
    ],
    substitutions: ["supino-reto-halteres", "flexao-de-braco", "supino-inclinado-halteres"]
  },
  {
    id: "supino-inclinado-halteres",
    name: "Supino inclinado com halteres",
    primary: "peito",
    secondary: ["ombros", "triceps"],
    equipment: "halteres",
    instructions: [
      "Ajuste o banco entre 30° e 45° e sente com um halter apoiado em cada coxa.",
      "Deite levando os halteres à altura do peito e empurre até estender os braços acima dos ombros.",
      "Desça os halteres em direção à parte alta do peito, com os antebraços na vertical.",
      "Empurre de volta, aproximando levemente os halteres no topo sem batê-los."
    ],
    errors: [
      "Usar inclinação muito alta, transferindo o trabalho para os ombros.",
      "Descer os halteres sem controle no final da série.",
      "Arquear excessivamente a lombar."
    ],
    substitutions: ["supino-reto-halteres", "supino-reto", "crossover"]
  },
  {
    id: "supino-reto-halteres",
    name: "Supino reto com halteres",
    primary: "peito",
    secondary: ["triceps", "ombros"],
    equipment: "halteres",
    instructions: [
      "Deite no banco reto com um halter em cada mão, braços estendidos acima do peito.",
      "Desça os halteres ao lado do peito, mantendo os punhos alinhados com os cotovelos.",
      "Pare quando sentir alongamento confortável no peito, sem forçar o ombro.",
      "Empurre para cima até estender os braços."
    ],
    errors: [
      "Descer além da amplitude confortável do ombro.",
      "Deixar os punhos dobrarem para trás.",
      "Perder o controle de um lado e terminar com os halteres desalinhados."
    ],
    substitutions: ["supino-reto", "flexao-de-braco", "crucifixo-halteres"]
  },
  {
    id: "crucifixo-halteres",
    name: "Crucifixo com halteres",
    primary: "peito",
    secondary: ["ombros"],
    equipment: "halteres",
    instructions: [
      "Deite no banco com os halteres acima do peito, palmas voltadas uma para a outra.",
      "Mantenha os cotovelos levemente flexionados e fixos durante todo o movimento.",
      "Abra os braços em arco até os halteres ficarem próximos da linha do peito.",
      "Feche os braços pelo mesmo arco, contraindo o peito."
    ],
    errors: [
      "Flexionar e estender o cotovelo, transformando o movimento em supino.",
      "Descer os halteres abaixo da linha do ombro.",
      "Usar carga alta demais para manter o arco."
    ],
    substitutions: ["crossover", "voador", "supino-reto-halteres"]
  },
  {
    id: "crossover",
    name: "Crossover na polia alta",
    primary: "peito",
    secondary: ["ombros"],
    equipment: "polia",
    instructions: [
      "Prenda as alças nas polias altas e fique no centro, com um pé à frente para estabilidade.",
      "Incline levemente o tronco à frente com os braços abertos e cotovelos levemente flexionados.",
      "Traga as mãos para baixo e para a frente até se encontrarem na altura do quadril.",
      "Volte devagar até sentir alongamento no peito."
    ],
    errors: [
      "Puxar com os braços dobrando muito os cotovelos.",
      "Deixar o peso puxar os braços para trás bruscamente.",
      "Balançar o tronco para completar a repetição."
    ],
    substitutions: ["voador", "crucifixo-halteres", "supino-reto-halteres"]
  },
  {
    id: "voador",
    name: "Voador (peck deck)",
    primary: "peito",
    secondary: ["ombros"],
    equipment: "maquina",
    instructions: [
      "Ajuste o banco para que as manoplas fiquem na altura do peito.",
      "Sente com as costas apoiadas e segure as manoplas com os cotovelos levemente flexionados.",
      "Feche os braços à frente do peito, contraindo o peitoral.",
      "Retorne devagar até sentir alongamento, sem passar da linha do ombro."
    ],
    errors: ["Banco muito baixo ou muito alto, deixando as mãos fora da linha do peito.", "Soltar o peso na volta.", "Afastar as costas do encosto."],
    substitutions: ["crossover", "crucifixo-halteres", "supino-reto-halteres"]
  },
  {
    id: "paralelas",
    name: "Paralelas assistidas",
    primary: "peito",
    secondary: ["triceps", "ombros"],
    equipment: "maquina",
    instructions: [
      "Ajuste o contrapeso da máquina: quanto mais peso, mais ajuda.",
      "Apoie os joelhos na plataforma e segure as barras paralelas com os braços estendidos.",
      "Incline levemente o tronco à frente e desça flexionando os cotovelos até cerca de 90°.",
      "Empurre as barras para voltar à posição inicial."
    ],
    errors: ["Descer muito além de 90° com desconforto no ombro.", "Deixar os ombros subirem em direção às orelhas.", "Usar impulso das pernas na plataforma."],
    substitutions: ["supino-reto", "flexao-de-braco", "triceps-polia"]
  },
  {
    id: "flexao-de-braco",
    name: "Flexão de braço",
    primary: "peito",
    secondary: ["triceps", "ombros", "abdomen"],
    equipment: "peso-corporal",
    instructions: [
      "Apoie as mãos no chão um pouco mais abertas que os ombros e estenda as pernas.",
      "Mantenha o corpo alinhado da cabeça aos calcanhares, com abdômen e glúteos contraídos.",
      "Desça o peito em direção ao chão, com os cotovelos a cerca de 45° do tronco.",
      "Empurre o chão até estender os braços."
    ],
    errors: ["Deixar o quadril cair ou subir demais.", "Fazer meia repetição sem aproximar o peito do chão.", "Projetar a cabeça à frente do corpo."],
    substitutions: ["supino-reto-halteres", "supino-reto", "paralelas"]
  },

  // ───────────── Costas ─────────────
  {
    id: "remada-curvada",
    name: "Remada curvada com barra",
    primary: "costas",
    secondary: ["biceps", "trapezio", "lombar"],
    equipment: "barra",
    instructions: [
      "Segure a barra com pegada pronada, um pouco mais aberta que os ombros.",
      "Flexione levemente os joelhos e incline o tronco à frente com a coluna neutra.",
      "Puxe a barra em direção à parte baixa do peito/umbigo, levando os cotovelos para trás.",
      "Desça a barra com controle até estender os braços, sem mudar o ângulo do tronco."
    ],
    errors: ["Arredondar a lombar.", "Levantar o tronco a cada repetição para ajudar na puxada.", "Puxar só com os braços, sem aproximar as escápulas."],
    substitutions: ["remada-baixa", "remada-invertida", "puxada-frontal"]
  },
  {
    id: "remada-baixa",
    name: "Remada baixa na polia",
    primary: "costas",
    secondary: ["biceps", "trapezio"],
    equipment: "polia",
    instructions: [
      "Sente com os pés apoiados na plataforma e os joelhos levemente flexionados.",
      "Segure o puxador com os braços estendidos e o tronco ereto.",
      "Puxe o puxador até o abdômen, aproximando as escápulas.",
      "Retorne estendendo os braços sem deixar o tronco cair à frente."
    ],
    errors: ["Balançar o tronco para trás e para a frente.", "Encolher os ombros ao puxar.", "Travar os joelhos completamente estendidos."],
    substitutions: ["remada-curvada", "remada-invertida", "puxada-frontal"]
  },
  {
    id: "puxada-frontal",
    name: "Puxada frontal aberta",
    primary: "costas",
    secondary: ["biceps", "ombros"],
    equipment: "polia",
    instructions: [
      "Ajuste o apoio das coxas e segure a barra com pegada aberta e pronada.",
      "Comece com os braços estendidos acima da cabeça e o peito levemente elevado.",
      "Puxe a barra até a parte alta do peito, levando os cotovelos para baixo e para trás.",
      "Suba a barra com controle até estender os braços."
    ],
    errors: ["Puxar a barra atrás da nuca.", "Inclinar muito o tronco para trás.", "Deixar a barra subir rápido demais."],
    substitutions: ["puxada-supinada", "barra-fixa", "remada-baixa"]
  },
  {
    id: "puxada-supinada",
    name: "Puxada supinada",
    primary: "costas",
    secondary: ["biceps"],
    equipment: "polia",
    instructions: [
      "Segure a barra com as palmas voltadas para você, na largura dos ombros.",
      "Sente com as coxas presas sob o apoio e os braços estendidos.",
      "Puxe a barra até o peito, mantendo os cotovelos próximos ao corpo.",
      "Retorne devagar até estender os braços."
    ],
    errors: ["Usar o balanço do tronco.", "Não completar a extensão dos braços.", "Puxar com os punhos dobrados."],
    substitutions: ["puxada-frontal", "barra-fixa", "remada-baixa"]
  },
  {
    id: "barra-fixa",
    name: "Barra fixa",
    primary: "costas",
    secondary: ["biceps", "abdomen"],
    equipment: "peso-corporal",
    instructions: [
      "Segure a barra com pegada pronada, um pouco mais aberta que os ombros, e fique pendurado.",
      "Ative as escápulas, puxando os ombros para baixo.",
      "Puxe o corpo até o queixo passar a barra, sem balançar.",
      "Desça com controle até estender os braços."
    ],
    errors: ["Usar impulso das pernas (kipping) sem domínio da técnica.", "Fazer meia amplitude.", "Esticar o pescoço para passar o queixo."],
    substitutions: ["puxada-frontal", "puxada-supinada", "remada-invertida"]
  },
  {
    id: "remada-invertida",
    name: "Remada invertida",
    primary: "costas",
    secondary: ["biceps", "abdomen"],
    equipment: "peso-corporal",
    instructions: [
      "Posicione uma barra na altura do quadril (no Smith ou no rack) e fique deitado sob ela.",
      "Segure a barra e mantenha o corpo reto, apoiado nos calcanhares.",
      "Puxe o peito em direção à barra, aproximando as escápulas.",
      "Desça com controle até estender os braços."
    ],
    errors: ["Deixar o quadril cair.", "Puxar a barra em direção ao pescoço.", "Perder a contração do abdômen."],
    substitutions: ["remada-curvada", "remada-baixa", "barra-fixa"]
  },
  {
    id: "levantamento-terra",
    name: "Levantamento terra",
    primary: "posteriores",
    secondary: ["gluteos", "lombar", "costas", "trapezio"],
    equipment: "barra",
    instructions: [
      "Fique com os pés na largura do quadril e a barra sobre o meio dos pés.",
      "Flexione quadril e joelhos e segure a barra por fora das pernas, com a coluna neutra.",
      "Empurre o chão e estenda quadril e joelhos ao mesmo tempo, mantendo a barra próxima ao corpo.",
      "Desça empurrando o quadril para trás e deslizando a barra pelas coxas até o chão."
    ],
    errors: ["Arredondar a lombar ao tirar a barra do chão.", "Afastar a barra do corpo.", "Hiperestender a coluna no topo."],
    substitutions: ["stiff", "hiperextensao-lombar", "ponte-de-gluteo"]
  },
  {
    id: "hiperextensao-lombar",
    name: "Hiperextensão lombar no banco 45°",
    primary: "lombar",
    secondary: ["gluteos", "posteriores"],
    equipment: "peso-corporal",
    instructions: [
      "Ajuste o apoio para que a borda fique logo abaixo do quadril.",
      "Cruze os braços no peito e mantenha o corpo em linha reta.",
      "Desça o tronco flexionando o quadril, com a coluna neutra.",
      "Suba contraindo glúteos e lombar até alinhar o corpo novamente."
    ],
    errors: [
      "Subir além da linha do corpo, hiperestendendo a lombar.",
      "Fazer o movimento rápido, com balanço.",
      "Apoio posicionado alto demais, travando o quadril."
    ],
    substitutions: ["stiff", "ponte-de-gluteo", "levantamento-terra"]
  },

  // ───────────── Pernas ─────────────
  {
    id: "agachamento-livre",
    name: "Agachamento livre com barra",
    primary: "quadriceps",
    secondary: ["gluteos", "posteriores", "lombar"],
    equipment: "barra",
    instructions: [
      "Apoie a barra sobre o trapézio, retire do suporte e afaste os pés na largura dos ombros.",
      "Inspire, contraia o abdômen e inicie a descida levando o quadril para trás e para baixo.",
      "Desça até onde mantiver a coluna neutra e os calcanhares no chão, com os joelhos na direção dos pés.",
      "Suba empurrando o chão até estender quadril e joelhos."
    ],
    errors: ["Deixar os joelhos caírem para dentro.", "Tirar os calcanhares do chão.", "Arredondar a lombar no fundo do movimento."],
    substitutions: ["agachamento-smith", "leg-press", "afundo-halteres"]
  },
  {
    id: "leg-press",
    name: "Leg press 45°",
    primary: "quadriceps",
    secondary: ["gluteos", "posteriores"],
    equipment: "maquina",
    instructions: [
      "Sente com as costas e o quadril apoiados e os pés na plataforma, na largura do quadril.",
      "Destrave a plataforma com as pernas estendidas, sem travar os joelhos.",
      "Desça a plataforma flexionando os joelhos até cerca de 90°, sem tirar o quadril do banco.",
      "Empurre a plataforma de volta até quase estender as pernas."
    ],
    errors: ["Descer tanto que o quadril sai do encosto.", "Travar os joelhos no topo.", "Empurrar com a ponta dos pés."],
    substitutions: ["agachamento-smith", "agachamento-livre", "cadeira-extensora"]
  },
  {
    id: "agachamento-smith",
    name: "Agachamento no Smith",
    primary: "quadriceps",
    secondary: ["gluteos", "posteriores"],
    equipment: "smith",
    instructions: [
      "Posicione a barra do Smith sobre o trapézio e os pés levemente à frente da linha da barra.",
      "Destrave a barra girando os punhos.",
      "Desça flexionando joelhos e quadril até as coxas ficarem próximas da paralela.",
      "Suba empurrando o chão e trave a barra ao final da série."
    ],
    errors: ["Pés muito para trás, jogando os joelhos à frente.", "Esquecer de travar a barra ao terminar.", "Descer sem controle."],
    substitutions: ["agachamento-livre", "leg-press", "afundo-halteres"]
  },
  {
    id: "cadeira-extensora",
    name: "Cadeira extensora",
    primary: "quadriceps",
    secondary: [],
    equipment: "maquina",
    instructions: [
      "Ajuste o encosto para que o joelho fique alinhado ao eixo da máquina.",
      "Posicione o rolo sobre a parte baixa da canela.",
      "Estenda os joelhos até as pernas ficarem retas, contraindo o quadríceps.",
      "Desça com controle sem deixar o peso bater."
    ],
    errors: ["Joelho desalinhado com o eixo da máquina.", "Chutar o peso com impulso.", "Tirar o quadril do banco."],
    substitutions: ["leg-press", "agachamento-smith", "afundo-halteres"]
  },
  {
    id: "mesa-flexora",
    name: "Mesa flexora",
    primary: "posteriores",
    secondary: ["panturrilhas"],
    equipment: "maquina",
    instructions: [
      "Deite de bruços com os joelhos logo após a borda do banco.",
      "Posicione o rolo acima dos calcanhares.",
      "Flexione os joelhos trazendo os calcanhares em direção aos glúteos.",
      "Retorne devagar até quase estender as pernas."
    ],
    errors: ["Tirar o quadril do banco.", "Fazer meia amplitude.", "Soltar o peso na descida."],
    substitutions: ["cadeira-flexora", "stiff", "ponte-de-gluteo"]
  },
  {
    id: "cadeira-flexora",
    name: "Cadeira flexora",
    primary: "posteriores",
    secondary: [],
    equipment: "maquina",
    instructions: [
      "Ajuste o encosto para alinhar o joelho ao eixo da máquina e prenda as coxas com o apoio.",
      "Posicione o rolo atrás dos calcanhares com as pernas estendidas.",
      "Flexione os joelhos levando os calcanhares para baixo e para trás.",
      "Retorne com controle até estender as pernas."
    ],
    errors: ["Apoio de coxa solto, deixando o quadril subir.", "Movimento curto.", "Retorno rápido."],
    substitutions: ["mesa-flexora", "stiff", "levantamento-terra"]
  },
  {
    id: "stiff",
    name: "Stiff com barra",
    primary: "posteriores",
    secondary: ["gluteos", "lombar"],
    equipment: "barra",
    instructions: [
      "Fique em pé segurando a barra à frente das coxas, pés na largura do quadril.",
      "Com os joelhos levemente flexionados, empurre o quadril para trás.",
      "Desça a barra rente às pernas até sentir alongamento nos posteriores, com a coluna neutra.",
      "Suba levando o quadril à frente e contraindo os glúteos."
    ],
    errors: ["Arredondar as costas para descer mais.", "Flexionar demais os joelhos, transformando em agachamento.", "Afastar a barra das pernas."],
    substitutions: ["levantamento-terra", "mesa-flexora", "hiperextensao-lombar"]
  },
  {
    id: "afundo-halteres",
    name: "Afundo com halteres",
    primary: "quadriceps",
    secondary: ["gluteos", "posteriores"],
    equipment: "halteres",
    instructions: [
      "Fique em pé com um halter em cada mão e dê um passo à frente.",
      "Desça o joelho de trás em direção ao chão, mantendo o tronco ereto.",
      "O joelho da frente fica alinhado com o pé, sem cair para dentro.",
      "Empurre o pé da frente para voltar à posição inicial e alterne as pernas."
    ],
    errors: ["Passo curto demais, jogando o joelho muito à frente.", "Tronco inclinado à frente.", "Bater o joelho de trás no chão."],
    substitutions: ["avanco-caminhando", "agachamento-smith", "leg-press"]
  },
  {
    id: "avanco-caminhando",
    name: "Avanço caminhando",
    primary: "quadriceps",
    secondary: ["gluteos", "posteriores"],
    equipment: "halteres",
    instructions: [
      "Segure os halteres ao lado do corpo.",
      "Dê um passo longo à frente e desça até os dois joelhos formarem cerca de 90°.",
      "Empurre com a perna da frente e traga a perna de trás à frente no próximo passo.",
      "Continue avançando, alternando as pernas."
    ],
    errors: ["Perder o equilíbrio por pisar em linha reta (base estreita).", "Inclinar o tronco à frente.", "Passos curtos e apressados."],
    substitutions: ["afundo-halteres", "agachamento-livre", "leg-press"]
  },
  {
    id: "cadeira-abdutora",
    name: "Cadeira abdutora",
    primary: "gluteos",
    secondary: [],
    equipment: "maquina",
    instructions: [
      "Sente com as costas apoiadas e as pernas encostadas nas almofadas pelo lado de fora.",
      "Afaste as pernas o máximo que conseguir com controle.",
      "Segure um instante na abertura máxima.",
      "Retorne devagar sem deixar as placas baterem."
    ],
    errors: ["Usar impulso do tronco.", "Amplitude curta.", "Soltar o peso na volta."],
    substitutions: ["ponte-de-gluteo", "afundo-halteres", "agachamento-livre"]
  },
  {
    id: "cadeira-adutora",
    name: "Cadeira adutora",
    primary: "adutores",
    secondary: [],
    equipment: "maquina",
    instructions: [
      "Sente com as costas apoiadas e as almofadas na parte interna dos joelhos.",
      "Comece com as pernas afastadas numa abertura confortável.",
      "Feche as pernas contraindo a parte interna das coxas.",
      "Abra devagar até a posição inicial."
    ],
    errors: ["Começar com abertura além do confortável.", "Bater as placas no fechamento.", "Tirar as costas do encosto."],
    substitutions: ["agachamento-livre", "afundo-halteres", "leg-press"]
  },
  {
    id: "ponte-de-gluteo",
    name: "Ponte de glúteo",
    primary: "gluteos",
    secondary: ["posteriores", "lombar"],
    equipment: "peso-corporal",
    instructions: [
      "Deite de costas com os joelhos flexionados e os pés apoiados no chão.",
      "Apoie os braços ao lado do corpo.",
      "Eleve o quadril contraindo os glúteos até alinhar ombros, quadril e joelhos.",
      "Desça com controle sem relaxar totalmente entre as repetições."
    ],
    errors: ["Subir arqueando a lombar em vez de contrair os glúteos.", "Pés longe demais do quadril.", "Fazer o movimento rápido."],
    substitutions: ["cadeira-abdutora", "stiff", "hiperextensao-lombar"]
  },
  {
    id: "panturrilha-sentada",
    name: "Panturrilha sentada com barra",
    primary: "panturrilhas",
    secondary: [],
    equipment: "barra",
    instructions: [
      "Sente com a ponta dos pés sobre um bloco e a barra apoiada sobre as coxas, perto dos joelhos (use uma almofada).",
      "Deixe os calcanhares descerem até sentir alongamento.",
      "Eleve os calcanhares o máximo possível.",
      "Desça devagar, controlando o alongamento."
    ],
    errors: ["Fazer repetições curtas e rápidas.", "Apoiar a barra sem proteção sobre as coxas.", "Deixar os tornozelos virarem para fora."],
    substitutions: ["panturrilha-leg-press"]
  },
  {
    id: "panturrilha-leg-press",
    name: "Panturrilha no leg press",
    primary: "panturrilhas",
    secondary: [],
    equipment: "maquina",
    instructions: [
      "Sente no leg press e apoie só a ponta dos pés na borda inferior da plataforma.",
      "Estenda as pernas sem travar os joelhos.",
      "Empurre a plataforma com a ponta dos pés, estendendo os tornozelos.",
      "Volte devagar até sentir alongamento na panturrilha."
    ],
    errors: ["Flexionar os joelhos durante o movimento.", "Pés escorregando da plataforma: use apoio firme.", "Amplitude curta."],
    substitutions: ["panturrilha-sentada"]
  },

  // ───────────── Ombros e trapézio ─────────────
  {
    id: "desenvolvimento-halteres",
    name: "Desenvolvimento com halteres",
    primary: "ombros",
    secondary: ["triceps", "trapezio"],
    equipment: "halteres",
    instructions: [
      "Sente com o encosto quase na vertical e os halteres na altura dos ombros.",
      "Mantenha os antebraços na vertical e o abdômen contraído.",
      "Empurre os halteres para cima até estender os braços.",
      "Desça com controle até a altura das orelhas."
    ],
    errors: ["Arquear a lombar para empurrar.", "Bater os halteres no topo.", "Descer os halteres muito abaixo da linha dos ombros com desconforto."],
    substitutions: ["desenvolvimento-militar", "desenvolvimento-arnold", "elevacao-lateral"]
  },
  {
    id: "desenvolvimento-militar",
    name: "Desenvolvimento militar sentado",
    primary: "ombros",
    secondary: ["triceps", "trapezio"],
    equipment: "barra",
    instructions: [
      "Sente com as costas apoiadas e a barra à frente, na altura da parte alta do peito.",
      "Segure a barra um pouco mais aberta que os ombros.",
      "Empurre a barra para cima até estender os braços acima da cabeça.",
      "Desça devagar até a parte alta do peito."
    ],
    errors: ["Levar a barra atrás da nuca.", "Arquear excessivamente a lombar.", "Usar impulso das pernas."],
    substitutions: ["desenvolvimento-halteres", "desenvolvimento-arnold", "elevacao-frontal"]
  },
  {
    id: "elevacao-lateral",
    name: "Elevação lateral com halteres",
    primary: "ombros",
    secondary: ["trapezio"],
    equipment: "halteres",
    instructions: [
      "Fique em pé com um halter em cada mão ao lado do corpo e os cotovelos levemente flexionados.",
      "Eleve os braços para os lados até a altura dos ombros.",
      "Mantenha os punhos na linha dos cotovelos, sem girar as mãos para cima.",
      "Desça devagar até a posição inicial."
    ],
    errors: [
      "Balançar o tronco para subir o peso.",
      "Subir os halteres acima da linha dos ombros encolhendo o trapézio.",
      "Carga alta demais, perdendo o controle na descida."
    ],
    substitutions: ["desenvolvimento-halteres", "remada-alta", "crucifixo-inverso"]
  },
  {
    id: "elevacao-frontal",
    name: "Elevação frontal com halteres",
    primary: "ombros",
    secondary: ["peito"],
    equipment: "halteres",
    instructions: [
      "Fique em pé com os halteres à frente das coxas.",
      "Eleve um ou os dois braços à frente até a altura dos ombros, com cotovelos levemente flexionados.",
      "Faça uma breve pausa no topo.",
      "Desça com controle."
    ],
    errors: ["Jogar o tronco para trás.", "Subir acima da cabeça sem necessidade.", "Descer sem controle."],
    substitutions: ["desenvolvimento-halteres", "desenvolvimento-militar", "elevacao-lateral"]
  },
  {
    id: "desenvolvimento-arnold",
    name: "Desenvolvimento Arnold",
    primary: "ombros",
    secondary: ["triceps"],
    equipment: "halteres",
    instructions: [
      "Sente com os halteres à frente do rosto, palmas voltadas para você.",
      "Ao empurrar, gire as mãos para que as palmas terminem voltadas para a frente.",
      "Estenda os braços acima da cabeça.",
      "Desça fazendo a rotação inversa até a posição inicial."
    ],
    errors: ["Girar rápido demais, perdendo o controle.", "Arquear a lombar.", "Encurtar a amplitude na descida."],
    substitutions: ["desenvolvimento-halteres", "desenvolvimento-militar", "elevacao-lateral"]
  },
  {
    id: "remada-alta",
    name: "Remada alta com barra",
    primary: "ombros",
    secondary: ["trapezio", "biceps"],
    equipment: "barra",
    instructions: [
      "Fique em pé com a barra à frente das coxas e pegada na largura dos ombros ou um pouco mais aberta.",
      "Puxe a barra para cima, rente ao corpo, levando os cotovelos para os lados.",
      "Pare quando os cotovelos chegarem perto da altura dos ombros.",
      "Desça devagar até estender os braços."
    ],
    errors: ["Pegada muito fechada, com desconforto no ombro.", "Subir os cotovelos muito acima dos ombros.", "Balançar o tronco."],
    substitutions: ["elevacao-lateral", "encolhimento-barra", "desenvolvimento-halteres"]
  },
  {
    id: "encolhimento-barra",
    name: "Encolhimento com barra",
    primary: "trapezio",
    secondary: ["antebraco"],
    equipment: "barra",
    instructions: [
      "Fique em pé segurando a barra à frente das coxas, braços estendidos.",
      "Eleve os ombros em direção às orelhas, sem dobrar os cotovelos.",
      "Segure um instante no topo.",
      "Desça os ombros devagar."
    ],
    errors: ["Girar os ombros em círculos.", "Flexionar os cotovelos para ajudar.", "Projetar a cabeça à frente."],
    substitutions: ["remada-alta", "levantamento-terra"]
  },
  {
    id: "crucifixo-inverso",
    name: "Crucifixo inverso no banco inclinado",
    primary: "ombros",
    secondary: ["trapezio", "costas"],
    equipment: "halteres",
    instructions: [
      "Deite de bruços em um banco inclinado com um halter em cada mão, braços pendendo.",
      "Mantenha os cotovelos levemente flexionados.",
      "Abra os braços para os lados até a linha dos ombros, aproximando as escápulas.",
      "Desça com controle."
    ],
    errors: ["Puxar com os braços dobrados, virando uma remada.", "Tirar o peito do banco.", "Carga excessiva."],
    substitutions: ["elevacao-lateral", "remada-baixa", "remada-curvada"]
  },

  // ───────────── Bíceps ─────────────
  {
    id: "rosca-direta",
    name: "Rosca direta com barra",
    primary: "biceps",
    secondary: ["antebraco"],
    equipment: "barra",
    instructions: [
      "Fique em pé segurando a barra com as palmas para a frente, na largura dos ombros.",
      "Mantenha os cotovelos junto ao corpo.",
      "Flexione os cotovelos levando a barra até a altura dos ombros.",
      "Desça devagar até estender os braços."
    ],
    errors: ["Balançar o tronco para subir a barra.", "Levar os cotovelos à frente.", "Não estender os braços na descida."],
    substitutions: ["rosca-alternada", "rosca-scott", "rosca-martelo"]
  },
  {
    id: "rosca-martelo",
    name: "Rosca martelo",
    primary: "biceps",
    secondary: ["antebraco"],
    equipment: "halteres",
    instructions: [
      "Segure os halteres ao lado do corpo com as palmas voltadas uma para a outra.",
      "Flexione os cotovelos mantendo a pegada neutra.",
      "Suba até os halteres ficarem próximos aos ombros.",
      "Desça com controle."
    ],
    errors: ["Afastar os cotovelos do tronco.", "Girar o punho durante o movimento.", "Usar balanço."],
    substitutions: ["rosca-direta", "rosca-alternada"]
  },
  {
    id: "rosca-alternada",
    name: "Rosca alternada com halteres",
    primary: "biceps",
    secondary: ["antebraco"],
    equipment: "halteres",
    instructions: [
      "Fique em pé com um halter em cada mão, braços estendidos.",
      "Flexione um braço girando a palma para cima durante a subida.",
      "Desça com controle e repita com o outro braço.",
      "Mantenha o tronco imóvel durante toda a série."
    ],
    errors: ["Girar o tronco para ajudar.", "Subir o cotovelo à frente.", "Pressa na troca entre os braços."],
    substitutions: ["rosca-direta", "rosca-martelo", "rosca-scott"]
  },
  {
    id: "rosca-scott",
    name: "Rosca Scott com barra",
    primary: "biceps",
    secondary: ["antebraco"],
    equipment: "barra",
    instructions: [
      "Sente no banco Scott com a parte de trás dos braços apoiada na almofada.",
      "Segure a barra com as palmas para cima.",
      "Flexione os cotovelos até a barra se aproximar dos ombros.",
      "Desça devagar até quase estender os braços, sem tirá-los do apoio."
    ],
    errors: ["Estender o cotovelo de forma brusca no final.", "Tirar os braços da almofada.", "Banco alto ou baixo demais."],
    substitutions: ["rosca-direta", "rosca-alternada"]
  },

  // ───────────── Tríceps ─────────────
  {
    id: "triceps-polia",
    name: "Tríceps na polia com barra",
    primary: "triceps",
    secondary: [],
    equipment: "polia",
    instructions: [
      "Fique de frente para a polia alta segurando a barra com pegada pronada.",
      "Cole os cotovelos ao lado do corpo, flexionados.",
      "Estenda os cotovelos empurrando a barra até as coxas.",
      "Volte devagar até os antebraços ficarem um pouco acima da horizontal."
    ],
    errors: ["Deixar os cotovelos irem para a frente.", "Inclinar o tronco sobre a barra.", "Usar o peso do corpo para empurrar."],
    substitutions: ["triceps-corda", "triceps-testa", "triceps-frances"]
  },
  {
    id: "triceps-corda",
    name: "Tríceps na polia com corda",
    primary: "triceps",
    secondary: [],
    equipment: "polia",
    instructions: [
      "Segure a corda na polia alta com as palmas voltadas uma para a outra.",
      "Mantenha os cotovelos junto ao tronco.",
      "Estenda os cotovelos e afaste as pontas da corda no final.",
      "Retorne devagar."
    ],
    errors: ["Cotovelos abrindo para os lados.", "Movimento curto, sem extensão total.", "Balanço do tronco."],
    substitutions: ["triceps-polia", "triceps-frances", "triceps-testa"]
  },
  {
    id: "triceps-testa",
    name: "Tríceps testa com barra",
    primary: "triceps",
    secondary: [],
    equipment: "barra",
    instructions: [
      "Deite no banco segurando a barra acima do peito com os braços estendidos.",
      "Mantenha os braços parados e flexione apenas os cotovelos.",
      "Desça a barra em direção à testa ou um pouco atrás da cabeça.",
      "Estenda os cotovelos para voltar."
    ],
    errors: ["Abrir os cotovelos para os lados.", "Mover os ombros junto, virando um supino.", "Descer sem controle próximo ao rosto."],
    substitutions: ["triceps-frances", "triceps-polia", "triceps-corda"]
  },
  {
    id: "triceps-frances",
    name: "Tríceps francês com halter",
    primary: "triceps",
    secondary: [],
    equipment: "halteres",
    instructions: [
      "Sente com as costas apoiadas e segure um halter com as duas mãos acima da cabeça.",
      "Mantenha os cotovelos apontados para cima e próximos à cabeça.",
      "Desça o halter atrás da cabeça flexionando os cotovelos.",
      "Estenda os braços para voltar."
    ],
    errors: ["Abrir demais os cotovelos.", "Arquear a lombar.", "Descer o halter rápido atrás da cabeça."],
    substitutions: ["triceps-testa", "triceps-corda", "triceps-polia"]
  },

  // ───────────── Abdômen ─────────────
  {
    id: "prancha",
    name: "Prancha frontal",
    primary: "abdomen",
    secondary: ["ombros", "gluteos"],
    equipment: "peso-corporal",
    isometric: true,
    instructions: [
      "Apoie os antebraços no chão com os cotovelos abaixo dos ombros.",
      "Estenda as pernas e apoie a ponta dos pés.",
      "Mantenha o corpo alinhado da cabeça aos calcanhares, contraindo abdômen e glúteos.",
      "Sustente a posição pelo tempo planejado, respirando normalmente."
    ],
    errors: ["Deixar o quadril cair, sobrecarregando a lombar.", "Elevar demais o quadril.", "Prender a respiração."],
    substitutions: ["abdominal-supra", "elevacao-de-pernas"]
  },
  {
    id: "abdominal-supra",
    name: "Abdominal supra com pernas no banco",
    primary: "abdomen",
    secondary: [],
    equipment: "peso-corporal",
    instructions: [
      "Deite de costas com as pernas apoiadas sobre um banco, joelhos a 90°.",
      "Coloque as mãos ao lado da cabeça sem puxar o pescoço.",
      "Enrole o tronco tirando as escápulas do chão, aproximando as costelas do quadril.",
      "Desça devagar."
    ],
    errors: ["Puxar a cabeça com as mãos.", "Subir com impulso.", "Tirar a lombar do chão."],
    substitutions: ["abdominal-polia", "prancha", "elevacao-de-pernas"]
  },
  {
    id: "abdominal-polia",
    name: "Abdominal na polia",
    primary: "abdomen",
    secondary: [],
    equipment: "polia",
    instructions: [
      "Segure a corda presa na polia alta, ao lado da cabeça.",
      "Mantenha o quadril parado e flexione o tronco, aproximando os cotovelos das coxas.",
      "Contraia o abdômen no final.",
      "Retorne devagar até alongar o abdômen."
    ],
    errors: ["Movimentar o quadril em vez de flexionar o tronco.", "Puxar com os braços.", "Carga alta com amplitude curta."],
    substitutions: ["abdominal-supra", "prancha"]
  },
  {
    id: "elevacao-de-pernas",
    name: "Elevação de pernas deitado",
    primary: "abdomen",
    secondary: [],
    equipment: "peso-corporal",
    instructions: [
      "Deite de costas com as pernas estendidas e as mãos sob o quadril ou ao lado do corpo.",
      "Eleve as pernas estendidas até ficarem na vertical.",
      "Desça devagar sem deixar a lombar sair do chão.",
      "Pare antes de encostar os pés no chão e repita."
    ],
    errors: ["Arquear a lombar na descida.", "Usar impulso das pernas.", "Descer rápido demais."],
    substitutions: ["abdominal-supra", "prancha", "abdominal-polia"]
  }
];

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

const BUILTIN_IDS = new Set(EXERCISES.map((e) => e.id));

/**
 * Registra os exercícios criados pelo usuário no mapa global, para que todas as telas
 * encontrem o exercício pelo id. Chamado pelo store sempre que os dados mudam.
 */
export function syncCustomExercises(list: Exercise[] | undefined): void {
  for (const id of Object.keys(EXERCISE_MAP)) if (!BUILTIN_IDS.has(id)) delete EXERCISE_MAP[id];
  for (const e of list ?? []) if (!BUILTIN_IDS.has(e.id)) EXERCISE_MAP[e.id] = { ...e, custom: true };
}

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_MAP[id];
}
