import { expect, test, type Page } from "@playwright/test";

/**
 * Entra no modo demonstração e espera o estado estar gravado antes de navegar com page.goto.
 * No WebKit o localStorage é gravado de forma assíncrona; sem esperar, a página seguinte pode abrir sem a demonstração.
 */
async function enterDemo(page: Page) {
  // No WebKit do CI, o toque às vezes chega antes do botão estar pronto e se perde; tenta de novo enquanto ele ainda estiver lá.
  await expect(async () => {
    const button = page.getByRole("button", { name: "Ver demonstração" });
    if (await button.isVisible()) await button.click();
    await expect(page.getByText("Modo demonstração.")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15_000 });
  await page.waitForFunction(() => localStorage.getItem("bodybuilder:v2")?.includes('"mode":"demo"'));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("criar treino → recarregar → iniciar → registrar série → descansar → encerrar → histórico", async ({ page }) => {
  await page.goto("/treinos");
  await page.getByRole("link", { name: "Criar do zero" }).click();
  await page.getByLabel("Nome do treino").fill("Treino E2E");

  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  await page.getByLabel("Buscar exercício").fill("supino reto com barra");
  await page.getByRole("button", { name: "Adicionar Supino reto com barra" }).click();
  await page.getByRole("button", { name: "Concluir" }).click();

  const item = page.getByTestId("item-exercicio");
  await expect(item).toHaveCount(1);
  await item.getByRole("button", { name: "Diminuir séries" }).click(); // 3 → 2
  await item.getByLabel("Carga (kg)").fill("40");
  await item.getByLabel("Descanso (s)").fill("3");
  await page.getByRole("button", { name: "Salvar treino" }).click();

  await expect(page).toHaveURL(/\/treinos\/?$/);
  await page.reload();
  const card = page.getByRole("listitem").filter({ hasText: "Treino E2E" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Supino reto com barra");

  await card.getByRole("button", { name: "Iniciar treino" }).click();
  await expect(page).toHaveURL(/treino-ativo/);
  await expect(page.getByRole("heading", { name: "Supino reto com barra" })).toBeVisible();
  await expect(page.getByLabel("Carga (kg)")).toHaveValue("40");

  await page.getByLabel("Repetições", { exact: true }).fill("9");
  await page.getByRole("button", { name: "Concluir série" }).click();
  await expect(page.getByRole("heading", { name: "Série 2 de 2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pular descanso" })).toBeVisible();
  // descanso de 3 s termina sozinho
  await expect(page.getByRole("button", { name: "Pular descanso" })).toBeHidden({ timeout: 8000 });

  await page.getByRole("button", { name: "Concluir série" }).click();
  await expect(page.getByRole("heading", { name: "Todas as séries concluídas" })).toBeVisible();
  await page.getByRole("button", { name: "Finalizar e salvar treino" }).click();

  await expect(page).toHaveURL(/historico/);
  const sessao = page.getByTestId("sessao-historico").first();
  await expect(sessao).toContainText("Treino E2E");
  await expect(sessao).toContainText("Série 1: 40 kg × 9 reps");
  await expect(sessao).toContainText("720 kg");
});

test("retomar sessão interrompida e encerrar manualmente", async ({ page }) => {
  await page.goto("/treinos");
  await page.getByRole("button", { name: "Usar modelo Full Body" }).click();
  await page.getByRole("button", { name: "Iniciar treino" }).first().click();
  await page.getByRole("button", { name: "Concluir série" }).click();

  await page.goto("/");
  await page.reload();
  await expect(page.getByText("Sessão interrompida")).toBeVisible();
  await page.getByRole("link", { name: "Retomar treino" }).click();
  await expect(page.getByRole("heading", { name: "Série 2 de 3" })).toBeVisible();

  await page.getByRole("button", { name: "Pular exercício" }).click();
  await expect(page.getByRole("heading", { name: "Supino reto com barra" })).toBeVisible();

  await page.getByRole("button", { name: "Encerrar treino" }).click();
  await page.getByRole("button", { name: "Encerrar e salvar" }).click();
  await expect(page).toHaveURL(/historico/);
  await expect(page.getByTestId("sessao-historico").first()).toContainText("encerrado manualmente");
});

test("biblioteca: busca sem acento, ficha e demonstração", async ({ page }) => {
  await page.goto("/biblioteca");
  await expect(page.getByText("50 exercícios encontrados")).toBeVisible();
  await page.getByLabel("Buscar exercício").fill("triceps frances");
  await expect(page.getByText("1 exercício encontrado")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tríceps francês com halter" })).toBeVisible();

  await page.getByLabel("Buscar exercício").fill("");
  await page.getByLabel("Filtrar por equipamento").selectOption("maquina");
  await expect(page.getByRole("heading", { name: "Leg press 45°" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Supino reto com barra" })).toHaveCount(0);

  // nenhum vídeo é carregado antes do toque
  await expect(page.locator("video")).toHaveCount(0);
  await page.getByRole("button", { name: "Reproduzir demonstração de Leg press 45°" }).click();
  await expect(page.locator("video")).toHaveCount(1);

  await page.getByRole("article").filter({ hasText: "Leg press 45°" }).getByRole("button", { name: "Ver ficha" }).click();
  const ficha = page.getByRole("dialog");
  await expect(ficha.getByRole("heading", { name: "Leg press 45°" })).toBeVisible();
  await expect(ficha.getByText("Erros comuns")).toBeVisible();
  await ficha.getByRole("button", { name: "Posições" }).click();
  await expect(ficha.getByRole("figure").filter({ hasText: "Posição inicial" })).toBeVisible();
  await expect(ficha.getByRole("figure").filter({ hasText: "Posição final" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ficha).toBeHidden();
});

test("prancha mostra a posição sustentada, sem vídeo", async ({ page }) => {
  await page.goto("/biblioteca");
  await page.getByLabel("Buscar exercício").fill("prancha");
  await page.getByRole("button", { name: "Ver ficha" }).click();
  await expect(page.getByRole("dialog").getByText("Posição sustentada")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: /Reproduzir/ })).toHaveCount(0);
});

test("modo demonstração fica separado dos dados do usuário", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page);
  await page.goto("/historico");
  await expect(page.getByTestId("sessao-historico").first()).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Voltar aos meus dados" }).click();
  await page.goto("/historico");
  await expect(page.getByText("Nenhum treino registrado")).toBeVisible();
});

test("perfil: onboarding salva e sugere plano editável", async ({ page }) => {
  await page.goto("/perfil");
  await page.getByLabel("Como podemos te chamar? (opcional)").fill("Ana");
  await page.getByLabel("Ganhar força").check();
  await page.getByLabel("Intermediário (6 meses a 2 anos)").check();
  await page.getByRole("button", { name: "Sex" }).click(); // padrão Seg, Qua, Sex → fica com 2 dias
  await page.getByRole("button", { name: "Salvar e sugerir plano" }).click();
  await expect(page.getByText("Sugestão de plano inicial")).toBeVisible();
  await expect(page.getByText("não é uma prescrição individual")).toBeVisible();
  await page.getByRole("button", { name: "Adicionar aos meus treinos" }).click();
  await page.reload();
  await expect(page.getByText("Ganhar força")).toBeVisible();
  await page.goto("/treinos");
  await expect(page.getByRole("region", { name: "Meus treinos" }).getByRole("heading", { name: "Full Body" })).toBeVisible();
});

test("configurações: som exige ação do usuário e player indica falta de faixas", async ({ page }) => {
  await page.goto("/configuracoes");
  await expect(page.getByText("Som dos alertas: desligado.")).toBeVisible();
  await page.getByRole("button", { name: "Ativar som dos alertas" }).click();
  // sem saída de áudio (WebKit no CI) o app avisa do bloqueio em vez de ligar o som; os dois são corretos
  await expect(page.getByRole("button", { name: "Desligar som dos alertas" }).or(page.getByText(/O navegador bloqueou o áudio/))).toBeVisible();
  await page.getByRole("tab", { name: "Arquivos do aparelho" }).click();
  await expect(page.getByTestId("musica-indisponivel")).toContainText("Nenhuma faixa de Metal");
  await page.getByRole("radio", { name: "Rock" }).click();
  await expect(page.getByTestId("musica-indisponivel")).toContainText("Nenhuma faixa de Rock");
});

test("spotify: só carrega após consentimento e aceita playlist própria", async ({ page }) => {
  await page.route("https://open.spotify.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<p>spotify</p>" }));
  await page.goto("/configuracoes");
  await expect(page.getByTestId("spotify-player")).toHaveCount(0);
  await page.getByRole("button", { name: "Carregar player do Spotify" }).click();
  const player = page.getByTestId("spotify-player");
  await expect(player).toHaveAttribute("src", /embed\/playlist\/37i9dQZF1DWTcqUzwhNmKv/);
  await page.getByRole("radio", { name: "Hip Hop" }).click();
  await page.getByRole("button", { name: "Trocar playlist" }).click();
  await page.getByLabel("Link do Spotify para Hip Hop").fill("https://exemplo.com/nada");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(/^Link não reconhecido/)).toBeVisible();
  await page.getByLabel("Link do Spotify para Hip Hop").fill("https://open.spotify.com/intl-pt/album/4aawyAB9vmqN3uQ7FjRGTy?si=abc");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(player).toHaveAttribute("src", /embed\/album\/4aawyAB9vmqN3uQ7FjRGTy/);
  await page.reload();
  await page.getByRole("radio", { name: "Hip Hop" }).click();
  await expect(page.getByTestId("spotify-player")).toHaveAttribute("src", /album\/4aawyAB9vmqN3uQ7FjRGTy/);
});

test("histórico: calendário marca dias treinados e salva anotação", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page);
  await page.goto("/historico");
  const cal = page.getByTestId("calendario");
  await expect(cal).toBeVisible();
  // a demonstração termina ontem: se hoje é dia 1, os treinos estão no mês anterior
  if (new Date().getDate() === 1) await page.getByRole("button", { name: "Mês anterior" }).click();
  await expect(cal.locator("[data-treinado]").first()).toBeVisible();
  const first = page.getByTestId("sessao-historico").first();
  await first.locator("summary").click();
  await first.getByLabel("Anotações da sessão").fill("Dormi mal, carga mantida.");
  await first.getByLabel("Anotações da sessão").blur();
  await expect(first.getByText("Anotação salva.")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("sessao-historico").first()).toContainText("Dormi mal, carga mantida.");
});

test("exercício personalizado: criar na biblioteca e usar no treino", async ({ page }) => {
  await page.goto("/biblioteca");
  await page.getByRole("button", { name: "Criar exercício" }).click();
  await page.getByLabel("Nome do exercício").fill("Remada articulada da academia");
  await page.getByLabel("Músculo principal").selectOption("costas");
  await page.getByRole("button", { name: "Salvar exercício" }).click();
  await expect(page.getByRole("heading", { name: "Remada articulada da academia" }).first()).toBeVisible();
  await expect(page.getByText("Exercício criado por você.")).toBeVisible();
  await page.getByRole("button", { name: "Fechar ficha" }).click();
  await expect(page.getByText("51 exercícios encontrados")).toBeVisible();

  await page.goto("/treinos/editar?novo=1");
  await page.getByLabel("Nome do treino").fill("Costas");
  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  await page.getByLabel("Buscar exercício").fill("remada articulada");
  await page.getByRole("button", { name: "Adicionar Remada articulada da academia" }).click();
  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page.getByTestId("item-exercicio")).toContainText("Remada articulada da academia");
  await page.getByRole("button", { name: "Salvar treino" }).click();
  await expect(page).toHaveURL(/\/treinos\/?$/);
  await page.reload();
  await expect(page.getByRole("region", { name: "Meus treinos" })).toContainText("Remada articulada da academia");
});

test("treino ativo: aquecimento não conta e recorde é avisado", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page);
  await page.goto("/treinos");
  await page.getByRole("button", { name: "Iniciar treino" }).first().click();
  await expect(page).toHaveURL(/treino-ativo/);
  const serie = page.getByRole("heading", { name: /^Série 1 de/ });
  await expect(serie).toBeVisible();

  await page.getByRole("radio", { name: "Aquecimento" }).click();
  await page.getByRole("button", { name: "Registrar aquecimento" }).click();
  await expect(page.getByTestId("series-extras")).toContainText("1 aquecimento");
  await expect(serie).toBeVisible();
  await expect(page.getByRole("button", { name: "Pular descanso" })).toHaveCount(0);

  await page.getByLabel("Carga (kg)").fill("500");
  await page.getByRole("button", { name: "Concluir série" }).click();
  await expect(page.getByTestId("recorde")).toContainText("Novo recorde de carga: 500 kg");
  await expect(page.getByRole("heading", { name: /^Série 2 de/ })).toBeVisible();
});

test("evolução: volume semanal, recordes, medidas", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page);
  await page.goto("/evolucao");
  await expect(page.getByTestId("volume-semanal")).toBeVisible();
  await expect(page.getByTestId("recordes")).toContainText("1RM estimado");
  await page.getByLabel("Cintura (cm)").fill("85");
  await page.getByRole("button", { name: "Registrar medidas" }).click();
  await expect(page.getByTestId("tabela-medidas")).toContainText("85 cm");
  await page.getByLabel("Cintura (cm)").fill("5");
  await page.getByRole("button", { name: "Registrar medidas" }).click();
  await expect(page.getByText("Cintura: informe um valor entre 10 e 300 cm.")).toBeVisible();
});

test("histórico: card do treino para compartilhar", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page);
  await page.goto("/historico");
  const first = page.getByTestId("sessao-historico").first();
  await first.locator("summary").click();
  await first.getByRole("button", { name: "Compartilhar" }).click();
  const canvas = page.getByRole("img", { name: /Resumo do treino/ });
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width)).toBe(1080);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Compartilhar imagem" }).click();
  expect((await download).suggestedFilename()).toMatch(/^treino-.*\.png$/);
});

test("nutrição: meta pelo peso, registro rápido, plano e card no início", async ({ page }) => {
  await page.goto("/evolucao");
  await page.getByLabel("Peso (kg)").fill("80");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  await page.goto("/nutricao");
  const protein = page.getByTestId("proteina");
  await expect(protein).toContainText("de 145 g");
  await protein.getByRole("button", { name: "+25 g" }).click();
  await protein.getByRole("button", { name: "+10 g" }).click();
  await expect(page.getByTestId("proteina-valor")).toHaveText("35");
  const water = page.getByTestId("agua");
  await expect(water).toContainText("de 2.750 ml");
  await water.getByRole("button", { name: /\+500 ml/ }).click();
  await water.getByRole("button", { name: "Tirar 250 ml de água" }).click();
  await expect(page.getByTestId("agua-valor")).toHaveText("250");

  await page.getByRole("switch", { name: "Segui meu plano hoje" }).click();
  await expect(page.getByRole("switch", { name: "Segui meu plano hoje" })).toHaveAttribute("aria-checked", "true");

  // meta fixa vence o cálculo
  await page.getByLabel("Ou meta fixa (g)").fill("160");
  await page.getByRole("button", { name: "Salvar metas" }).click();
  await expect(protein).toContainText("de 160 g");

  await page.reload();
  await expect(page.getByTestId("proteina-valor")).toHaveText("35");
  await page.goto("/");
  await expect(page.getByTestId("nutricao-inicio")).toContainText("35 g de 160 g");
  await expect(page.getByTestId("nutricao-inicio")).toContainText("Plano seguido hoje");
});

test("nutrição: receita vai para a lista de compras sem duplicar", async ({ page }) => {
  await page.goto("/nutricao#receitas");
  await expect(page.getByRole("tab", { name: "Receitas" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Vegetariano" }).click();
  await page.getByLabel("Buscar receita ou ingrediente").fill("panqueca de banana");
  await expect(page.getByTestId("receita")).toHaveCount(1);
  await page.getByTestId("receita").click();
  const dialog = page.getByRole("dialog", { name: "Panqueca de banana e aveia" });
  await expect(dialog).toContainText("Modo de preparo");
  await dialog.getByRole("button", { name: "Adicionar à lista" }).click();
  await expect(dialog.getByRole("status")).toContainText("3 itens adicionados");
  await dialog.getByRole("button", { name: "Adicionar à lista" }).click();
  await expect(dialog.getByRole("status")).toContainText("0 itens novos");
  await dialog.getByRole("button", { name: "Comi 1 porção" }).click();
  await expect(dialog.getByRole("status")).toContainText("+17 g");
  await dialog.getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("tab", { name: /Compras/ }).click();
  const items = page.getByTestId("item-compra");
  await expect(items).toHaveCount(3);
  await expect(items.filter({ hasText: "Ovos" })).toContainText("4 unidades");

  await page.getByLabel("Item", { exact: true }).fill("Café");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(items).toHaveCount(4);
  await items.filter({ hasText: "Banana" }).getByRole("checkbox").check();
  await expect(page.getByRole("heading", { name: "No carrinho (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar comprados" }).click();
  await expect(items).toHaveCount(3);
  await page.reload();
  await page.getByRole("tab", { name: /Compras/ }).click();
  await expect(page.getByTestId("item-compra")).toHaveCount(3);
});
