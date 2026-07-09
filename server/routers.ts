import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  getConfiguracoes,
  upsertConfiguracoes,
  getManual,
  upsertManual,
  createRelatorio,
  updateRelatorio,
  getRelatorios,
  getRelatorioById,
  insertDevedores,
  getDevedoresByRelatorio,
  updateDevedorCobranca,
} from "./db";
import { z } from "zod";
import { extrairDevedoresDoZeglam, extrairDevedoresGeral } from "./zeglam-automation";

// Schema de validação para o agente de IA
const AgenteDecisionSchema = {
  name: "agente_decision",
  strict: true,
  schema: {
    type: "object",
    properties: {
      acao: {
        type: "string",
        enum: ["extrair_link_especifico", "extrair_geral", "gerar_cobranca", "desconhecido"],
        description: "Tipo de ação a executar",
      },
      link_alvo: {
        type: "string",
        description: "Nome do link/fornecedor se for extração específica",
      },
      objetivo: {
        type: "string",
        description: "Objetivo da ação em linguagem natural",
      },
    },
    required: ["acao"],
  },
};

// Manual de instruções padrão
const MANUAL_PADRAO = `# Manual de Instruções do Agente Zeglam IA

## 1. Navegação Base
- **Página Inicial:** https://zeglam.semijoias.net/admin
- **Menu Principal:** Localizado à esquerda (sidebar escura). Os itens principais são:
  - "Grupo de Compras": Para relatórios de links/fornecedores específicos
  - "Clientes": Para ver a lista geral de clientes e saldos devedores globais

## 2. Fluxo de Extração por Link Específico
**Objetivo:** Extrair todos os clientes com saldo devedor de um link/fornecedor específico.

**Passos:**
1. Clique em "Grupo de Compras" no menu lateral esquerdo
2. Você verá uma tabela com vários links de compra
3. Se o link não estiver visível, use o botão "Avançar Página" para navegar entre páginas
4. Localize o link desejado pela descrição (ex: "XANGAI BRUTOS - NOVIDADES 40% DE DESCONTO - Link 013 - SP")
5. Na mesma linha do link, clique no botão **"Romaneios"** (fica à direita, depois de "Produtos")
6. A página abrirá com o título "Romaneios dos Clientes" e uma tabela com todos os clientes

## 3. Interpretação da Tabela de Romaneios
**Colunas da tabela:**
- **Nome:** Nome do cliente
- **Qtd Produtos:** Quantidade de itens
- **Valor Produtos:** Valor total dos produtos
- **Total Compra:** Valor total da compra
- **Saldo Aberto:** Valor que o cliente ainda deve pagar
- **Status:** Indicador visual de pagamento
  - **Verde (Pagamento Concluído):** Cliente já pagou tudo
  - **Amarelo (Aguardando pagamento):** Cliente ainda deve pagar - **ESTES SÃO OS DEVEDORES**

## 4. Filtragem de Devedores
- Extrair APENAS os clientes com status **Amarelo** (Aguardando pagamento)
- Para cada devedor, coletar:
  - Nome completo
  - Número de WhatsApp (coluna WhatsApp)
  - Valor do Saldo Aberto (valor que deve)
  - Status: "Aguardando pagamento"

## 5. Extração de Relatório Geral
- Para ver TODOS os devedores (de todos os links):
  1. Clique em "Clientes" no menu lateral
  2. Você verá uma tabela com todos os clientes do sistema
  3. Filtre apenas aqueles com "Saldo Devedor" maior que R$ 0,00
  4. Colete: Nome, WhatsApp, Saldo Devedor

## 6. Ação de Cobreça
- A cobreça deve ser feita via WhatsApp Web.
- **Mensagem Padrão:** "Olá [Nome], tudo bem? Seu pagamento de [Valor] está pendente. Chave PIX para acerto: [CHAVE_PIX]. Se já pagou, desconsidere."

## 7. Regras de "Ensino" (Aprendizado)
- Se o sistema mudar, o usuário deve atualizar este manual descrevendo o novo nome do botão ou a nova posição da tabela.
- A IA deve sempre priorizar as instruções contidas neste manual antes de tentar qualquer ação autônoma.`;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // === Configurações ===
  configuracoes: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const config = await getConfiguracoes(ctx.user.id);
      if (!config) {
        return {
          emailZeglam: "",
          senhaZeglam: "",
          chavePix: "",
          openaiApiKey: "",
          whatsappAutomatico: "on" as const,
          mensagemCobranca: "Olá {nome}, tudo bem? Seu pagamento de {valor} está pendente. Chave PIX: {pix}",
        };
      }
      return config;
    }),

    upsert: protectedProcedure
      .input(z.object({
        emailZeglam: z.string().optional(),
        senhaZeglam: z.string().optional(),
        chavePix: z.string().optional(),
        openaiApiKey: z.string().optional(),
        whatsappAutomatico: z.enum(["on", "off"]).optional(),
        mensagemCobranca: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertConfiguracoes({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),

  // === Manual da IA ===
  manual: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const manual = await getManual(ctx.user.id);
      return { conteudo: manual?.conteudo || MANUAL_PADRAO };
    }),

    upsert: protectedProcedure
      .input(z.object({ conteudo: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await upsertManual(ctx.user.id, input.conteudo);
        return { success: true };
      }),
  }),

  // === Agente de IA ===
  agente: router({
    executarComando: protectedProcedure
      .input(z.object({
        comando: z.string(),
        acao: z.string(),
        link_alvo: z.string().optional().default(""),
        objetivo: z.string().optional().default(""),
      }))
      .mutation(async ({ ctx, input }) => {
        // Criar registro do relatório
        const relatorioId = await createRelatorio({
          userId: ctx.user.id,
          tipoRelatorio: input.acao,
          linkAlvo: input.link_alvo || null,
          comandoOriginal: input.comando,
          status: "processando",
        });

        if (!relatorioId) {
          return { success: false, error: "Falha ao criar relatório" };
        }

        // Obter credenciais do usuário
        const config = await getConfiguracoes(ctx.user.id);
        if (!config?.emailZeglam || !config?.senhaZeglam) {
          await updateRelatorio(relatorioId, {
            status: "erro",
            dadosJson: JSON.stringify({ erro: "Credenciais do Zeglam não configuradas" }),
          });
          return { success: false, error: "Credenciais do Zeglam não configuradas" };
        }

        try {
          // Executar extração real com Playwright
          let resultado;
          if (input.link_alvo && input.link_alvo.trim() !== "") {
            // Extração de link específico
            resultado = await extrairDevedoresDoZeglam(
              config.emailZeglam,
              config.senhaZeglam,
              input.link_alvo
            );
          } else {
            // Extração geral
            resultado = await extrairDevedoresGeral(
              config.emailZeglam,
              config.senhaZeglam
            );
          }

          if (!resultado.success) {
            await updateRelatorio(relatorioId, {
              status: "erro",
              dadosJson: JSON.stringify({ erro: resultado.erro }),
            });
            return { success: false, error: resultado.erro };
          }

          // Converter devedores para o formato esperado
          const devedoresFormatados = resultado.devedores.map(d => ({
            nome: d.nome,
            whatsapp: d.whatsapp,
            valor: d.saldoAberto,
            status: d.status,
            linkOrigem: input.link_alvo || "Geral",
          }));

          // Salvar devedores no banco
          await insertDevedores(
            devedoresFormatados.map(d => ({
              relatorioId,
              nome: d.nome,
              whatsapp: d.whatsapp,
              valor: d.valor,
              status: d.status,
              linkOrigem: d.linkOrigem,
            }))
          );

          // Calcular valor total
          const valorTotal = devedoresFormatados
            .reduce((acc, d) => {
              const valor = parseFloat(d.valor.replace("R$ ", "").replace(",", "."));
              return acc + (isNaN(valor) ? 0 : valor);
            }, 0)
            .toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

          // Atualizar relatório como concluído
          await updateRelatorio(relatorioId, {
            status: "concluido",
            totalDevedores: devedoresFormatados.length,
            valorTotal,
            dadosJson: JSON.stringify(devedoresFormatados),
          });

          return {
            success: true,
            relatorioId,
            devedores: devedoresFormatados,
            totalDevedores: devedoresFormatados.length,
            valorTotal,
            objetivo: input.objetivo,
          };
        } catch (erro) {
          const mensagemErro = erro instanceof Error ? erro.message : "Erro desconhecido";
          await updateRelatorio(relatorioId, {
            status: "erro",
            dadosJson: JSON.stringify({ erro: mensagemErro }),
          });
          return { success: false, error: mensagemErro };
        }
      }),
  }),

  // === Relatórios ===
  relatorios: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getRelatorios(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const relatorio = await getRelatorioById(input.id);
        if (!relatorio) return null;
        const devedoresList = await getDevedoresByRelatorio(input.id);
        return { ...relatorio, devedores: devedoresList };
      }),

    updateCobranca: protectedProcedure
      .input(z.object({
        devedorId: z.number(),
        status: z.enum(["pendente", "enviada", "falhou"]),
      }))
      .mutation(async ({ input }) => {
        await updateDevedorCobranca(input.devedorId, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
