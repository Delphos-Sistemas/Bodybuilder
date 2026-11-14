/**
 * Receitas originais do BODYBUILDER, escritas para o app.
 * Proteína e calorias são estimativas aproximadas por porção, calculadas com valores médios
 * de tabelas de composição de alimentos. Variam conforme marca, corte e preparo.
 * Não são prescrição: quem tem necessidades específicas deve procurar um nutricionista.
 */

export const RECIPE_TAGS = {
  cafe: "Café da manhã",
  almoco: "Almoço ou jantar",
  lanche: "Lanche",
  "pos-treino": "Pós-treino",
  marmita: "Bom para marmita",
  rapido: "Até 15 min",
  barato: "Econômico",
  vegetariano: "Vegetariano"
} as const;
export type RecipeTag = keyof typeof RECIPE_TAGS;

/** item: nome usado na lista de compras; qtd: quantidade para a receita inteira */
export type Ingredient = { item: string; qtd: string };

export type Recipe = {
  id: string;
  name: string;
  summary: string;
  minutes: number;
  servings: number;
  /** por porção, aproximado */
  proteinG: number;
  kcal: number;
  tags: RecipeTag[];
  ingredients: Ingredient[];
  steps: string[];
};

export const RECIPES: Recipe[] = [
  {
    id: "crepioca-frango",
    name: "Crepioca de frango",
    summary: "Massa de ovo com tapioca, recheada com frango desfiado.",
    minutes: 10,
    servings: 1,
    proteinG: 32,
    kcal: 335,
    tags: ["cafe", "lanche", "rapido"],
    ingredients: [
      { item: "Ovos", qtd: "1 unidade" },
      { item: "Goma de tapioca", qtd: "2 colheres de sopa" },
      { item: "Peito de frango", qtd: "80 g cozido e desfiado" },
      { item: "Requeijão light", qtd: "1 colher de sopa" }
    ],
    steps: [
      "Bata o ovo com a tapioca e uma pitada de sal.",
      "Despeje em frigideira antiaderente aquecida e espalhe como uma panqueca.",
      "Quando soltar do fundo, vire, recheie com o frango e o requeijão e dobre ao meio."
    ]
  },
  {
    id: "panqueca-banana-aveia",
    name: "Panqueca de banana e aveia",
    summary: "Três ingredientes, sem farinha branca.",
    minutes: 10,
    servings: 1,
    proteinG: 17,
    kcal: 345,
    tags: ["cafe", "rapido", "barato", "vegetariano"],
    ingredients: [
      { item: "Ovos", qtd: "2 unidades" },
      { item: "Banana", qtd: "1 unidade madura" },
      { item: "Aveia em flocos", qtd: "30 g (3 colheres de sopa)" }
    ],
    steps: ["Amasse a banana e misture com os ovos e a aveia.", "Faça discos pequenos em frigideira antiaderente, 2 minutos de cada lado."]
  },
  {
    id: "overnight-oats",
    name: "Overnight oats proteico",
    summary: "Prepare à noite e tome o café pronto de manhã.",
    minutes: 5,
    servings: 1,
    proteinG: 40,
    kcal: 395,
    tags: ["cafe", "pos-treino", "rapido", "vegetariano"],
    ingredients: [
      { item: "Aveia em flocos", qtd: "40 g" },
      { item: "Iogurte natural desnatado", qtd: "1 pote (170 g)" },
      { item: "Whey protein", qtd: "1 dose (30 g)" },
      { item: "Leite desnatado", qtd: "100 ml" },
      { item: "Morangos", qtd: "5 unidades" }
    ],
    steps: [
      "Misture aveia, iogurte, whey e leite em um pote com tampa.",
      "Leve à geladeira por pelo menos 6 horas.",
      "Cubra com os morangos picados na hora de comer."
    ]
  },
  {
    id: "omelete-forno",
    name: "Omelete de forno com legumes",
    summary: "Rende duas porções e esquenta bem no dia seguinte.",
    minutes: 30,
    servings: 2,
    proteinG: 28,
    kcal: 360,
    tags: ["cafe", "almoco", "marmita", "vegetariano"],
    ingredients: [
      { item: "Ovos", qtd: "6 unidades" },
      { item: "Queijo minas frescal", qtd: "100 g" },
      { item: "Tomate", qtd: "1 unidade" },
      { item: "Espinafre", qtd: "1 xícara" },
      { item: "Cebola", qtd: "1/2 unidade" }
    ],
    steps: [
      "Bata os ovos com sal e pimenta.",
      "Misture o queijo em cubos e os legumes picados.",
      "Asse em forma untada a 200 °C por cerca de 20 minutos, até firmar no centro."
    ]
  },
  {
    id: "marmita-frango-arroz-feijao",
    name: "Marmita de frango, arroz e feijão",
    summary: "O clássico, com porções medidas.",
    minutes: 25,
    servings: 1,
    proteinG: 55,
    kcal: 450,
    tags: ["almoco", "marmita", "barato"],
    ingredients: [
      { item: "Peito de frango", qtd: "150 g (peso cozido)" },
      { item: "Arroz", qtd: "100 g cozido (4 colheres de sopa)" },
      { item: "Feijão", qtd: "100 g cozido (1 concha pequena)" },
      { item: "Alface", qtd: "à vontade" },
      { item: "Tomate", qtd: "1 unidade" }
    ],
    steps: [
      "Tempere o frango com alho, limão, sal e páprica e grelhe em frigideira quente, 5 minutos de cada lado.",
      "Monte a marmita com arroz, feijão, frango fatiado e a salada em um compartimento separado."
    ]
  },
  {
    id: "carne-moida-legumes",
    name: "Carne moída com abobrinha e cenoura",
    summary: "Uma panela só, rápida e com bastante volume.",
    minutes: 20,
    servings: 1,
    proteinG: 34,
    kcal: 295,
    tags: ["almoco", "marmita", "barato"],
    ingredients: [
      { item: "Patinho moído", qtd: "150 g" },
      { item: "Abobrinha", qtd: "1/2 unidade" },
      { item: "Cenoura", qtd: "1/2 unidade" },
      { item: "Cebola", qtd: "1/2 unidade" },
      { item: "Azeite", qtd: "1 colher de chá" }
    ],
    steps: [
      "Refogue a cebola no azeite e junte a carne, mexendo até dourar.",
      "Acrescente a cenoura ralada e a abobrinha em cubos.",
      "Tampe e cozinhe por 8 minutos. Acerte o sal e finalize com cheiro-verde."
    ]
  },
  {
    id: "strogonoff-fit",
    name: "Strogonoff de frango leve",
    summary: "Molho cremoso com iogurte no lugar do creme de leite.",
    minutes: 25,
    servings: 1,
    proteinG: 45,
    kcal: 300,
    tags: ["almoco", "marmita"],
    ingredients: [
      { item: "Peito de frango", qtd: "150 g cru, em cubos" },
      { item: "Iogurte natural desnatado", qtd: "100 g" },
      { item: "Molho de tomate", qtd: "3 colheres de sopa" },
      { item: "Champignon", qtd: "50 g" },
      { item: "Cebola", qtd: "1/2 unidade" }
    ],
    steps: [
      "Doure o frango com a cebola.",
      "Junte o molho de tomate e o champignon e cozinhe por 5 minutos.",
      "Desligue o fogo e misture o iogurte (fora do fogo, para não talhar)."
    ]
  },
  {
    id: "escondidinho-batata-doce",
    name: "Escondidinho de batata-doce com frango",
    summary: "Purê de batata-doce por cima de frango temperado.",
    minutes: 40,
    servings: 2,
    proteinG: 44,
    kcal: 370,
    tags: ["almoco", "marmita"],
    ingredients: [
      { item: "Peito de frango", qtd: "240 g cozido e desfiado" },
      { item: "Batata-doce", qtd: "300 g" },
      { item: "Muçarela light", qtd: "40 g" },
      { item: "Molho de tomate", qtd: "4 colheres de sopa" }
    ],
    steps: [
      "Cozinhe a batata-doce e amasse com sal e um pouco da água do cozimento.",
      "Refogue o frango com o molho de tomate.",
      "Monte em refratário: frango embaixo, purê por cima e queijo. Gratine por 10 minutos."
    ]
  },
  {
    id: "salada-atum-grao",
    name: "Salada de atum com grão-de-bico",
    summary: "Sem fogão, pronta em 5 minutos.",
    minutes: 5,
    servings: 1,
    proteinG: 40,
    kcal: 360,
    tags: ["almoco", "lanche", "rapido", "marmita"],
    ingredients: [
      { item: "Atum em água", qtd: "1 lata" },
      { item: "Grão-de-bico cozido", qtd: "100 g" },
      { item: "Tomate", qtd: "1 unidade" },
      { item: "Cebola roxa", qtd: "1/4 unidade" },
      { item: "Azeite", qtd: "1 colher de chá" }
    ],
    steps: ["Escorra o atum e o grão-de-bico.", "Misture com tomate e cebola picados, azeite, limão e sal."]
  },
  {
    id: "wrap-frango",
    name: "Wrap de frango",
    summary: "Para levar e comer com a mão.",
    minutes: 10,
    servings: 1,
    proteinG: 38,
    kcal: 360,
    tags: ["almoco", "lanche", "rapido"],
    ingredients: [
      { item: "Tortilha integral", qtd: "1 unidade" },
      { item: "Peito de frango", qtd: "100 g cozido e desfiado" },
      { item: "Requeijão light", qtd: "1 colher de sopa" },
      { item: "Alface", qtd: "2 folhas" },
      { item: "Tomate", qtd: "1/2 unidade" }
    ],
    steps: ["Aqueça a tortilha na frigideira.", "Passe o requeijão, distribua o frango e a salada e enrole bem apertado."]
  },
  {
    id: "vitamina-pos-treino",
    name: "Vitamina pós-treino",
    summary: "Proteína e carboidrato no copo.",
    minutes: 3,
    servings: 1,
    proteinG: 37,
    kcal: 375,
    tags: ["pos-treino", "rapido", "vegetariano"],
    ingredients: [
      { item: "Leite desnatado", qtd: "300 ml" },
      { item: "Banana", qtd: "1 unidade" },
      { item: "Whey protein", qtd: "1 dose (30 g)" },
      { item: "Aveia em flocos", qtd: "15 g" }
    ],
    steps: ["Bata tudo no liquidificador com gelo a gosto."]
  },
  {
    id: "iogurte-granola",
    name: "Iogurte proteico com granola e frutas",
    summary: "Lanche simples para o meio da tarde, reforçado com meia dose de whey.",
    minutes: 3,
    servings: 1,
    proteinG: 24,
    kcal: 320,
    tags: ["lanche", "cafe", "rapido", "vegetariano"],
    ingredients: [
      { item: "Iogurte natural desnatado", qtd: "200 g" },
      { item: "Whey protein", qtd: "1/2 dose (15 g)" },
      { item: "Granola sem açúcar", qtd: "30 g" },
      { item: "Morangos", qtd: "5 unidades" }
    ],
    steps: ["Misture o whey ao iogurte até ficar cremoso.", "Monte em camadas: iogurte, frutas e granola por cima na hora de comer."]
  },
  {
    id: "ovos-cottage-pao",
    name: "Ovos mexidos com cottage e pão integral",
    summary: "Café da manhã reforçado em 10 minutos.",
    minutes: 10,
    servings: 1,
    proteinG: 31,
    kcal: 400,
    tags: ["cafe", "rapido", "vegetariano"],
    ingredients: [
      { item: "Ovos", qtd: "3 unidades" },
      { item: "Queijo cottage", qtd: "50 g" },
      { item: "Pão integral", qtd: "2 fatias" }
    ],
    steps: ["Mexa os ovos em fogo baixo.", "Desligue e misture o cottage ainda quente.", "Sirva com o pão torrado."]
  },
  {
    id: "tilapia-legumes",
    name: "Tilápia assada com legumes",
    summary: "Tudo na mesma assadeira.",
    minutes: 30,
    servings: 1,
    proteinG: 40,
    kcal: 300,
    tags: ["almoco", "marmita"],
    ingredients: [
      { item: "Filé de tilápia", qtd: "180 g" },
      { item: "Brócolis", qtd: "1 xícara" },
      { item: "Abobrinha", qtd: "1/2 unidade" },
      { item: "Tomate-cereja", qtd: "8 unidades" },
      { item: "Azeite", qtd: "1 colher de chá" }
    ],
    steps: [
      "Tempere a tilápia com limão, alho e sal.",
      "Distribua os legumes na assadeira com o azeite e coloque o peixe por cima.",
      "Asse a 200 °C por 20 minutos."
    ]
  },
  {
    id: "sardinha-ovos",
    name: "Sardinha com ovos e salada",
    summary: "Uma das proteínas mais baratas do mercado.",
    minutes: 12,
    servings: 1,
    proteinG: 32,
    kcal: 310,
    tags: ["almoco", "lanche", "barato", "rapido"],
    ingredients: [
      { item: "Sardinha em lata", qtd: "1 lata" },
      { item: "Ovos", qtd: "2 unidades" },
      { item: "Alface", qtd: "à vontade" },
      { item: "Tomate", qtd: "1 unidade" }
    ],
    steps: ["Cozinhe os ovos por 10 minutos.", "Escorra a sardinha e sirva com os ovos cortados e a salada temperada com limão."]
  },
  {
    id: "lentilha-carne",
    name: "Lentilha com carne moída",
    summary: "Rende bem e fica melhor no dia seguinte.",
    minutes: 35,
    servings: 1,
    proteinG: 33,
    kcal: 380,
    tags: ["almoco", "marmita", "barato"],
    ingredients: [
      { item: "Lentilha", qtd: "40 g crua (100 g cozida)" },
      { item: "Patinho moído", qtd: "100 g" },
      { item: "Arroz", qtd: "100 g cozido" },
      { item: "Cebola", qtd: "1/2 unidade" }
    ],
    steps: ["Cozinhe a lentilha em água com louro por 20 minutos.", "Refogue a carne com cebola e alho e junte a lentilha escorrida.", "Sirva com o arroz."]
  },
  {
    id: "arroz-forno-frango",
    name: "Arroz de forno com frango",
    summary: "Aproveita sobras de arroz e frango.",
    minutes: 25,
    servings: 2,
    proteinG: 40,
    kcal: 395,
    tags: ["almoco", "marmita"],
    ingredients: [
      { item: "Arroz", qtd: "240 g cozido" },
      { item: "Peito de frango", qtd: "200 g cozido e desfiado" },
      { item: "Muçarela light", qtd: "40 g" },
      { item: "Ervilha e milho", qtd: "4 colheres de sopa" },
      { item: "Molho de tomate", qtd: "4 colheres de sopa" }
    ],
    steps: ["Misture arroz, frango, ervilha, milho e molho.", "Coloque em refratário, cubra com o queijo e asse até gratinar."]
  },
  {
    id: "panqueca-whey",
    name: "Panqueca de whey",
    summary: "Doce, rápida e com bastante proteína.",
    minutes: 8,
    servings: 1,
    proteinG: 34,
    kcal: 285,
    tags: ["cafe", "pos-treino", "lanche", "rapido", "vegetariano"],
    ingredients: [
      { item: "Ovos", qtd: "1 unidade" },
      { item: "Whey protein", qtd: "1 dose (30 g)" },
      { item: "Aveia em flocos", qtd: "20 g" },
      { item: "Leite desnatado", qtd: "50 ml" }
    ],
    steps: ["Misture tudo até virar uma massa lisa.", "Cozinhe em frigideira antiaderente em fogo baixo, 2 minutos de cada lado."]
  },
  {
    id: "tofu-mexido",
    name: "Tofu mexido com legumes",
    summary: "Opção sem ovo e sem carne.",
    minutes: 12,
    servings: 1,
    proteinG: 30,
    kcal: 335,
    tags: ["cafe", "almoco", "rapido", "vegetariano"],
    ingredients: [
      { item: "Tofu firme", qtd: "200 g" },
      { item: "Pimentão", qtd: "1/2 unidade" },
      { item: "Cebola", qtd: "1/2 unidade" },
      { item: "Cúrcuma", qtd: "1 pitada" },
      { item: "Azeite", qtd: "1 colher de chá" }
    ],
    steps: ["Refogue cebola e pimentão no azeite.", "Esfarele o tofu com as mãos, junte à panela com a cúrcuma e o sal e mexa por 5 minutos."]
  },
  {
    id: "hamburguer-patinho",
    name: "Hambúrguer caseiro de patinho",
    summary: "Carne magra, sem conservantes.",
    minutes: 15,
    servings: 1,
    proteinG: 44,
    kcal: 410,
    tags: ["almoco", "lanche"],
    ingredients: [
      { item: "Patinho moído", qtd: "150 g" },
      { item: "Pão de hambúrguer integral", qtd: "1 unidade" },
      { item: "Queijo prato", qtd: "1 fatia (20 g)" },
      { item: "Alface", qtd: "2 folhas" },
      { item: "Tomate", qtd: "2 rodelas" }
    ],
    steps: [
      "Tempere a carne com sal, pimenta e alho e modele um disco.",
      "Grelhe 4 minutos de cada lado e coloque o queijo no fim.",
      "Monte no pão com a salada."
    ]
  },
  {
    id: "frango-desfiado-base",
    name: "Frango desfiado para a semana",
    summary: "Base para crepioca, wrap, escondidinho e marmitas.",
    minutes: 40,
    servings: 4,
    proteinG: 35,
    kcal: 175,
    tags: ["marmita", "barato", "almoco"],
    ingredients: [
      { item: "Peito de frango", qtd: "600 g cru" },
      { item: "Cebola", qtd: "1 unidade" },
      { item: "Alho", qtd: "3 dentes" },
      { item: "Molho de tomate", qtd: "4 colheres de sopa" }
    ],
    steps: [
      "Cozinhe o frango na panela de pressão com água e sal por 15 minutos após pegar pressão.",
      "Desfie com dois garfos.",
      "Refogue com cebola, alho e molho. Divida em 4 potes e guarde na geladeira por até 4 dias."
    ]
  },
  {
    id: "mingau-proteico",
    name: "Mingau proteico de aveia",
    summary: "Quente e cremoso para dias frios.",
    minutes: 8,
    servings: 1,
    proteinG: 25,
    kcal: 300,
    tags: ["cafe", "rapido", "vegetariano"],
    ingredients: [
      { item: "Aveia em flocos", qtd: "40 g" },
      { item: "Leite desnatado", qtd: "250 ml" },
      { item: "Whey protein", qtd: "1/2 dose (15 g)" },
      { item: "Canela", qtd: "a gosto" }
    ],
    steps: ["Cozinhe a aveia no leite, mexendo, por 4 minutos.", "Desligue, espere 1 minuto e misture o whey e a canela."]
  },
  {
    id: "salada-grao-ovo",
    name: "Salada de grão-de-bico com ovo e queijo",
    summary: "Refeição completa sem carne.",
    minutes: 15,
    servings: 1,
    proteinG: 32,
    kcal: 480,
    tags: ["almoco", "marmita", "vegetariano"],
    ingredients: [
      { item: "Grão-de-bico cozido", qtd: "150 g" },
      { item: "Ovos", qtd: "2 unidades" },
      { item: "Queijo minas frescal", qtd: "40 g" },
      { item: "Pepino", qtd: "1/2 unidade" },
      { item: "Tomate", qtd: "1 unidade" }
    ],
    steps: ["Cozinhe os ovos por 10 minutos.", "Misture tudo picado e tempere com limão, azeite e sal."]
  },
  {
    id: "cuscuz-ovos",
    name: "Cuscuz com ovos e queijo coalho",
    summary: "Café da manhã nordestino, barato e que sustenta.",
    minutes: 15,
    servings: 1,
    proteinG: 23,
    kcal: 450,
    tags: ["cafe", "barato"],
    ingredients: [
      { item: "Flocão de milho", qtd: "60 g" },
      { item: "Ovos", qtd: "2 unidades" },
      { item: "Queijo coalho", qtd: "30 g" }
    ],
    steps: [
      "Hidrate o flocão com água e sal por 10 minutos e cozinhe na cuscuzeira por 8 minutos.",
      "Faça os ovos mexidos ou fritos com pouco óleo e grelhe o queijo.",
      "Sirva tudo junto."
    ]
  }
];

export const RECIPE_MAP: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
