import { chromium, Browser, Page } from "playwright";
import path from "path";
import os from "os";
import fs from "fs";

// Resolver o caminho do Chromium explicitamente para evitar problemas de HOME
const PLAYWRIGHT_CHROMIUM_PATH = path.join(
  os.homedir(),
  ".cache",
  "ms-playwright",
  "chromium-1228",
  "chrome-linux64",
  "chrome"
);

const PLAYWRIGHT_CHROMIUM_HEADLESS_PATH = path.join(
  os.homedir(),
  ".cache",
  "ms-playwright",
  "chromium_headless_shell-1228",
  "chrome-headless-shell-linux64",
  "chrome-headless-shell"
);

function getChromiumPath(): string {
  const possiblePaths = [
    PLAYWRIGHT_CHROMIUM_HEADLESS_PATH,
    PLAYWRIGHT_CHROMIUM_PATH,
    "/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell",
    "/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome",
    "/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell",
    "/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome",
  ];
  
  for (const chromiumPath of possiblePaths) {
    try {
      if (fs.existsSync(chromiumPath)) {
        console.log(`[Zeglam] Chromium encontrado em: ${chromiumPath}`);
        return chromiumPath;
      }
    } catch {}
  }
  
  console.warn("[Zeglam] AVISO: Chromium não encontrado em nenhum caminho");
  return "";
}

export interface DevedorExtraido {
  nome: string;
  whatsapp: string;
  valorProdutos: string;
  saldoAberto: string;
  status: string;
}

export interface ResultadoExtracao {
  success: boolean;
  devedores: DevedorExtraido[];
  linkProcessado: string;
  totalDevedores: number;
  erro?: string;
}

/**
 * Rola a página até o final para carregar todo o conteúdo (lazy loading)
 */
async function rolarPagina(page: Page): Promise<void> {
  console.log("[Zeglam] Rolando página para carregar todos os clientes...");
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const step = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        totalHeight += step;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
  await page.waitForTimeout(2000);
  console.log("[Zeglam] Scroll completo");
}

/**
 * Faz login no Zeglam e navega até a página de Romaneios de um link específico
 */
async function fazerLoginENavegar(
  page: Page,
  email: string,
  senha: string,
  linkAlvo: string
): Promise<boolean> {
  try {
    // 1. Acessar a página de login
    console.log("[Zeglam] Acessando página de login...");
    await page.goto("https://zeglam.semijoias.net/admin/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    console.log("[Zeglam] Página de login carregada");

    // 2. Fazer login
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', senha);
    console.log("[Zeglam] Credenciais preenchidas, clicando em submit...");

    await Promise.all([
      page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    console.log("[Zeglam] Login realizado");

    // Aguardar a página carregar após login
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // 3. Clicar em "Grupo de Compras" (navegação por hash: #virtualcatalog)
    console.log("[Zeglam] Procurando menu Grupo de Compras...");
    await page.locator("#li-virtualcatalog").first().click({ force: true, timeout: 15000 });
    console.log("[Zeglam] Clique em Grupo de Compras realizado");

    // Aguardar a tabela de links carregar
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForSelector("table tbody tr", { timeout: 15000 }).catch(() => {});
    console.log("[Zeglam] Tabela de links carregada");

    // 4. Procurar pelo link específico (busca case-insensitive)
    const tabelaGrupoCompras = page.locator("table").filter({ hasText: "Romaneios" }).first();
    await page.waitForTimeout(1000);

    const linkAlvoLower = linkAlvo.toLowerCase().trim();
    let linkEncontrado = false;
    let paginaAtual = 1;
    const maxPaginas = 10;

    while (!linkEncontrado && paginaAtual <= maxPaginas) {
      const linhas = await tabelaGrupoCompras.locator("tbody tr").all();
      console.log(`[Zeglam] Página ${paginaAtual}: ${linhas.length} linhas`);

      for (let i = 0; i < linhas.length; i++) {
        const textoLinha = await linhas[i].textContent().catch(() => "");
        if (textoLinha && textoLinha.toLowerCase().includes(linkAlvoLower)) {
          linkEncontrado = true;
          console.log(`[Zeglam] Link encontrado na página ${paginaAtual}, linha ${i}`);

          // Clicar no botão "Romaneios" dentro desta linha
          const romaneiosBtn = linhas[i].locator('a:has-text("Romaneios")').first();
          console.log("[Zeglam] Clicando em Romaneios...");
          await Promise.all([
            page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
            romaneiosBtn.click({ force: true }),
          ]);

          // Aguardar a lista de romaneios carregar via AJAX
          console.log("[Zeglam] Aguardando lista de romaneios carregar...");
          await page.waitForTimeout(5000);
          await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

          // Aguardar o container #vcatalog-invoices aparecer
          await page.waitForSelector("#vcatalog-invoices", { timeout: 15000 }).catch(() => {});
          console.log("[Zeglam] Container de romaneios carregado");
          break;
        }
      }

      if (linkEncontrado) break;

      // Tentar avançar para a próxima página
      const botaoAvancar = await tabelaGrupoCompras
        .locator('a:has-text("Avançar"), button:has-text("Avançar"), [aria-label="Next"]')
        .first()
        .isVisible()
        .catch(() => false);
      if (botaoAvancar) {
        await tabelaGrupoCompras
          .locator('a:has-text("Avançar"), button:has-text("Avançar"), [aria-label="Next"]')
          .first()
          .click();
        await page.waitForTimeout(2000);
        paginaAtual++;
      } else {
        break;
      }
    }

    if (!linkEncontrado) {
      throw new Error(`Link "${linkAlvo}" não encontrado após ${maxPaginas} páginas`);
    }

    // 5. Rolar a página para carregar todos os clientes (lazy loading)
    await rolarPagina(page);

    return true;
  } catch (erro) {
    console.error("[Zeglam] Erro ao fazer login e navegar:", erro);
    throw erro;
  }
}

/**
 * Extrai a lista de clientes da página de Romaneios
 * Estrutura: #vcatalog-invoices > ol > li.item-container
 * Cada LI tem divs: attribute data-name="Nome|Qtd Produtos|Valor Produtos|Total Compra|Saldo Aberto|Status"
 */
async function extrairTabelaDevedores(page: Page): Promise<DevedorExtraido[]> {
  try {
    const container = page.locator("#vcatalog-invoices").first();
    await container.waitFor({ timeout: 15000 }).catch(() => {});

    // Cada cliente é um <li> dentro de <ol>
    const items = container.locator("ol > li");
    const itemCount = await items.count();
    console.log(`[Zeglam] ${itemCount} clientes encontrados na lista de romaneios`);

    const devedores: DevedorExtraido[] = [];

    for (let i = 0; i < itemCount; i++) {
      try {
        const li = items.nth(i);

        // Extrair dados usando os divs attribute com data-name
        const nomeDiv = li.locator('div.attribute[data-name="Nome"]').first();
        const valorDiv = li.locator('div.attribute[data-name="Valor Produtos"]').first();
        const saldoDiv = li.locator('div.attribute[data-name="Saldo Aberto"]').first();
        const statusDiv = li.locator('div.attribute[data-name="Status"]').first();

        // Extrair nome (remover textos extras como links e badges)
        let nome = "";
        try {
          const nomeText = await nomeDiv.textContent().catch(() => "");
          // O nome é o primeiro texto antes do \n (remover "Registrar Custos/Despesas" etc)
          nome = nomeText?.trim().split("\n")[0].trim() || "";
          // Remover espaços múltiplos (badges geralmente vem com espaços extras)
          nome = nome.replace(/\s\s+/g, " ").trim();
          // Se houver espaços duplos no meio, pegar apenas até lá
          if (nome.includes("  ")) {
            nome = nome.split("  ")[0].trim();
          }
        } catch {}

        // Extrair valor dos produtos
        let valorProdutos = "";
        try {
          valorProdutos = (await valorDiv.textContent().catch(() => ""))?.trim() || "N/A";
        } catch {}

        // Extrair saldo aberto (remover links como "Registrar Pagamento")
        let saldoAberto = "";
        try {
          // Pegar apenas o texto direto, ignorando links
          saldoAberto = await saldoDiv.evaluate((el: Element) => {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
            const parts: string[] = [];
            let node: Node | null;
            while ((node = walker.nextNode())) {
              const text = node.textContent?.trim();
              if (text && !text.includes("Registrar") && !text.includes("Pagamento") && !text.includes("Configurar")) {
                parts.push(text);
              }
            }
            return parts.join(" ").trim() || "R$ 0,00";
          }).catch(() => "R$ 0,00");
        } catch {}

        // Extrair status e verificar se é "Aguardando pagamento"
        let statusTexto = "";
        let isAguardandoPagamento = false;
        try {
          statusTexto = (await statusDiv.textContent().catch(() => ""))?.trim() || "";
          isAguardandoPagamento = statusTexto.toLowerCase().includes("aguardando");

          // Se não encontrou pelo texto, verificar pela cor de fundo do badge
          if (!isAguardandoPagamento) {
            const badge = statusDiv.locator(".alert, .badge, span").first();
            const bgColor = await badge.evaluate((el: Element) =>
              window.getComputedStyle(el).backgroundColor
            ).catch(() => "");
            // Amarelo/Laranja = Aguardando (RGB: 255, 193, 7)
            isAguardandoPagamento =
              bgColor.includes("255") && (bgColor.includes("193") || bgColor.includes("235"));
          }
        } catch {}

        // Incluir apenas se tiver nome e status de aguardando pagamento
        if (nome && isAguardandoPagamento) {
          devedores.push({
            nome,
            whatsapp: "", // WhatsApp não está disponível na tabela de romaneios
            valorProdutos,
            saldoAberto,
            status: "Aguardando pagamento",
          });
          console.log(`[Zeglam] Devedor encontrado: ${nome} - Saldo: ${saldoAberto}`);
        }
      } catch (erro) {
        // Continuar para o próximo cliente
        continue;
      }
    }

    console.log(`[Zeglam] Total: ${devedores.length} devedores (Aguardando pagamento)`);
    return devedores;
  } catch (erro) {
    console.error("[Zeglam] Erro ao extrair lista:", erro);
    throw erro;
  }
}

/**
 * Função principal de automação - extração por link específico
 */
export async function extrairDevedoresDoZeglam(
  email: string,
  senha: string,
  linkAlvo: string
): Promise<ResultadoExtracao> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const chromiumPath = getChromiumPath();
    console.log("[Zeglam] Iniciando Chromium...", chromiumPath || "(auto)");
    browser = await chromium.launch({
      headless: true,
      ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    });
    page = await browser.newPage();
    console.log("[Zeglam] Navegador iniciado com sucesso");

    await fazerLoginENavegar(page, email, senha, linkAlvo);
    const devedores = await extrairTabelaDevedores(page);

    return {
      success: true,
      devedores,
      linkProcessado: linkAlvo,
      totalDevedores: devedores.length,
    };
  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : "Erro desconhecido";
    console.error("[Zeglam] Erro na extração:", mensagemErro);
    return {
      success: false,
      devedores: [],
      linkProcessado: linkAlvo,
      totalDevedores: 0,
      erro: mensagemErro,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Função para extrair relatório geral (todos os devedores de todos os links)
 */
export async function extrairDevedoresGeral(
  email: string,
  senha: string
): Promise<ResultadoExtracao> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const chromiumPath = getChromiumPath();
    console.log("[Zeglam] Iniciando Chromium para relatório geral...", chromiumPath || "(auto)");
    browser = await chromium.launch({
      headless: true,
      ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    });
    page = await browser.newPage();
    console.log("[Zeglam] Navegador iniciado com sucesso");

    // Login
    console.log("[Zeglam] Fazendo login...");
    await page.goto("https://zeglam.semijoias.net/admin/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', senha);
    await Promise.all([
      page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    console.log("[Zeglam] Login realizado");

    // Ir para Clientes (relatório geral)
    console.log("[Zeglam] Navegando para Clientes...");
    await page.locator("text=Clientes").first().click({ timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForSelector("table tbody tr", { timeout: 15000 }).catch(() => {});
    console.log("[Zeglam] Página de Clientes carregada");

    // Rolar página para carregar todos os clientes
    await rolarPagina(page);

    // Extrair tabela de clientes
    const devedores: DevedorExtraido[] = [];
    const linhas = await page.locator("table tbody tr").all();
    console.log(`[Zeglam] ${linhas.length} clientes encontrados`);

    for (const linha of linhas) {
      try {
        const colunas = await linha.locator("td").all();
        if (colunas.length < 3) continue;

        const nome = await colunas[0].textContent().catch(() => "");
        const whatsapp = await colunas[1]?.textContent().catch(() => "") || "";
        const saldoAberto = await colunas[2]?.textContent().catch(() => "") || "";

        if (nome && nome.trim() && saldoAberto.trim()) {
          const temSaldo = !saldoAberto.includes("R$ 0,00") && !saldoAberto.includes("0,00");
          if (temSaldo) {
            devedores.push({
              nome: nome.trim().split("\n")[0].trim().replace(/\s+/g, " "),
              whatsapp: whatsapp.trim(),
              valorProdutos: "N/A",
              saldoAberto: saldoAberto.trim(),
              status: "Devedor",
            });
          }
        }
      } catch {
        continue;
      }
    }

    console.log(`[Zeglam] ${devedores.length} devedores no total`);
    return {
      success: true,
      devedores,
      linkProcessado: "Relatório Geral",
      totalDevedores: devedores.length,
    };
  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : "Erro desconhecido";
    console.error("[Zeglam] Erro na extração geral:", mensagemErro);
    return {
      success: false,
      devedores: [],
      linkProcessado: "Relatório Geral",
      totalDevedores: 0,
      erro: mensagemErro,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
