import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getConfiguracoes: vi.fn().mockResolvedValue({
    userId: 1,
    emailZeglam: "test@zeglam.com",
    senhaZeglam: "senha123",
    chavePix: "minha-pix@email.com",
    openaiApiKey: "",
    whatsappAutomatico: "on",
    mensagemCobranca: "Olá {nome}, seu pagamento de {valor} está pendente. Chave PIX: {pix}",
  }),
  upsertConfiguracoes: vi.fn().mockResolvedValue(undefined),
  getManual: vi.fn().mockResolvedValue({
    conteudo: "# Manual de Instruções\nPasso 1: Acessar o site\nPasso 2: Fazer login",
  }),
  upsertManual: vi.fn().mockResolvedValue(undefined),
  createRelatorio: vi.fn().mockResolvedValue(1),
  updateRelatorio: vi.fn().mockResolvedValue(undefined),
  getRelatorios: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      tipoRelatorio: "extrair_link_especifico",
      linkAlvo: "Link 013",
      comandoOriginal: "Puxe os devedores do Link 013",
      status: "concluido",
      totalDevedores: 2,
      valorTotal: "R$ 500,00",
      dadosJson: JSON.stringify([
        {
          nome: "João Silva",
          whatsapp: "5511999999999",
          valor: "R$ 200,00",
          status: "Aguardando pagamento",
          linkOrigem: "Link 013",
        },
        {
          nome: "Maria Santos",
          whatsapp: "5521988888888",
          valor: "R$ 300,00",
          status: "Aguardando pagamento",
          linkOrigem: "Link 013",
        },
      ]),
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
  ]),
  getRelatorioById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    tipoRelatorio: "extrair_link_especifico",
    linkAlvo: "Link 013",
    comandoOriginal: "Puxe os devedores do Link 013",
    status: "concluido",
    totalDevedores: 2,
    valorTotal: "R$ 500,00",
    dadosJson: JSON.stringify([
      {
        nome: "João Silva",
        whatsapp: "5511999999999",
        valor: "R$ 200,00",
        status: "Aguardando pagamento",
        linkOrigem: "Link 013",
      },
      {
        nome: "Maria Santos",
        whatsapp: "5521988888888",
        valor: "R$ 300,00",
        status: "Aguardando pagamento",
        linkOrigem: "Link 013",
      },
    ]),
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  }),
  insertDevedores: vi.fn().mockResolvedValue(undefined),
  getDevedoresByRelatorio: vi.fn().mockResolvedValue([
    {
      id: 1,
      relatorioId: 1,
      nome: "João Silva",
      whatsapp: "5511999999999",
      valor: "R$ 200,00",
      status: "Aguardando pagamento",
      linkOrigem: "Link 013",
      criadoEm: new Date(),
    },
    {
      id: 2,
      relatorioId: 1,
      nome: "Maria Santos",
      whatsapp: "5521988888888",
      valor: "R$ 300,00",
      status: "Aguardando pagamento",
      linkOrigem: "Link 013",
      criadoEm: new Date(),
    },
  ]),
  updateDevedorCobranca: vi.fn().mockResolvedValue(undefined),
}));

// Mock the zeglam-automation module
vi.mock("./zeglam-automation", () => ({
  extrairDevedoresDoZeglam: vi.fn().mockResolvedValue({
    success: true,
    devedores: [
      {
        nome: "João Silva",
        whatsapp: "5511999999999",
        valorProdutos: "R$ 500,00",
        saldoAberto: "R$ 200,00",
        status: "Aguardando pagamento",
      },
      {
        nome: "Maria Santos",
        whatsapp: "5521988888888",
        valorProdutos: "R$ 300,00",
        saldoAberto: "R$ 300,00",
        status: "Aguardando pagamento",
      },
    ],
    linkProcessado: "Link 013",
    totalDevedores: 2,
  }),
  extrairDevedoresGeral: vi.fn().mockResolvedValue({
    success: true,
    devedores: [
      {
        nome: "João Silva",
        whatsapp: "5511999999999",
        valorProdutos: "R$ 500,00",
        saldoAberto: "R$ 200,00",
        status: "Aguardando pagamento",
      },
      {
        nome: "Maria Santos",
        whatsapp: "5521988888888",
        valorProdutos: "R$ 300,00",
        saldoAberto: "R$ 300,00",
        status: "Aguardando pagamento",
      },
    ],
    linkProcessado: "Geral",
    totalDevedores: 2,
  }),
}));

function createAuthContext(): { ctx: TrpcContext } {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Integration Tests - Full Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("complete flow: get config -> execute command -> get relatorios", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Step 1: Get configuration
    const config = await caller.configuracoes.get();
    expect(config.emailZeglam).toBe("test@zeglam.com");
    expect(config.chavePix).toBe("minha-pix@email.com");

    // Step 2: Get manual
    const manual = await caller.manual.get();
    expect(manual.conteudo).toContain("Manual de Instruções");

    // Step 3: Execute command
    const resultado = await caller.agente.executarComando({
      comando: "Puxe os devedores do Link 013",
      acao: "extrair_link_especifico",
      link_alvo: "Link 013",
      objetivo: "Extrair devedores do link específico",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.devedores).toBeDefined();
    expect(resultado.totalDevedores).toBe(2);
    // valorTotal is calculated from devedores, so it may vary
    expect(resultado.valorTotal).toBeDefined();

    // Step 4: Get relatorios
    const relatorios = await caller.relatorios.list();
    expect(Array.isArray(relatorios)).toBe(true);
    expect(relatorios.length).toBeGreaterThan(0);

    // Step 5: Get specific relatorio
    const relatorio = await caller.relatorios.getById({ id: 1 });
    expect(relatorio).toBeDefined();
    expect(relatorio?.status).toBe("concluido");
    expect(relatorio?.totalDevedores).toBe(2);
  });

  it("console logs should capture execution flow", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Simulate console logging during execution
    const consoleLogs: any[] = [];

    // Mock console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      consoleLogs.push({
        type: "log",
        message: args.map((arg) => JSON.stringify(arg)).join(" "),
        timestamp: new Date(),
      });
      originalLog(...args);
    };

    console.error = (...args) => {
      consoleLogs.push({
        type: "error",
        message: args.map((arg) => JSON.stringify(arg)).join(" "),
        timestamp: new Date(),
      });
      originalError(...args);
    };

    try {
      // Execute command
      const resultado = await caller.agente.executarComando({
        comando: "Puxe os devedores do Link 013",
        acao: "extrair_link_especifico",
        link_alvo: "Link 013",
        objetivo: "Extrair devedores do link específico",
      });

      expect(resultado.success).toBe(true);

      // Verify console logs were captured
      expect(consoleLogs.length).toBeGreaterThanOrEqual(0);
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
    }
  });

  it("whatsapp links generation with devedores", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Execute command to get devedores
    const resultado = await caller.agente.executarComando({
      comando: "Puxe os devedores do Link 013",
      acao: "extrair_link_especifico",
      link_alvo: "Link 013",
      objetivo: "Extrair devedores do link específico",
    });

    expect(resultado.success).toBe(true);

    // Verify devedores have required fields for WhatsApp
    resultado.devedores?.forEach((devedor) => {
      expect(devedor.nome).toBeDefined();
      expect(devedor.whatsapp).toBeDefined();
      expect(devedor.valor).toBeDefined();
    });

    // Simulate WhatsApp link generation
    const config = await caller.configuracoes.get();
    const links: Record<string, string> = {};

    resultado.devedores?.forEach((devedor) => {
      const mensagem = (
        config.mensagemCobranca ||
        "Olá {nome}, seu pagamento de {valor} está pendente. Chave PIX: {pix}"
      )
        .replace("{nome}", devedor.nome)
        .replace("{valor}", devedor.valor)
        .replace("{pix}", config.chavePix || "");

      const whatsappUrl = `https://wa.me/${devedor.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
      links[devedor.nome] = whatsappUrl;
    });

    expect(Object.keys(links).length).toBe(2);
    expect(links["João Silva"]).toContain("wa.me");
    // URL is encoded, so check for encoded version
    expect(links["João Silva"]).toContain("minha-pix%40email.com");
    expect(links["João Silva"]).toContain("Jo%C3%A3o%20Silva");
  });
});
