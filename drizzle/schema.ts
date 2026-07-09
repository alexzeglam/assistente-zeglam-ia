import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Configurações do usuário (credenciais Zeglam, chave PIX, etc.)
 */
export const configuracoes = mysqlTable("configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailZeglam: varchar("emailZeglam", { length: 320 }),
  senhaZeglam: varchar("senhaZeglam", { length: 256 }),
  chavePix: varchar("chavePix", { length: 256 }),
  whatsappAutomatico: mysqlEnum("whatsappAutomatico", ["on", "off"]).default("on").notNull(),
  mensagemCobranca: text("mensagemCobranca"),
  openaiApiKey: varchar("openaiApiKey", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Manual de Instruções editável pelo usuário
 */
export const manualInstrucoes = mysqlTable("manual_instrucoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conteudo: text("conteudo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Relatórios de extração gerados pelo sistema
 */
export const relatorios = mysqlTable("relatorios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipoRelatorio: varchar("tipoRelatorio", { length: 128 }).notNull(),
  linkAlvo: varchar("linkAlvo", { length: 256 }),
  comandoOriginal: text("comandoOriginal").notNull(),
  totalDevedores: int("totalDevedores").default(0).notNull(),
  valorTotal: varchar("valorTotal", { length: 64 }).default("R$ 0,00").notNull(),
  status: mysqlEnum("status", ["concluido", "erro", "processando"]).default("processando").notNull(),
  dadosJson: text("dadosJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Devedores extraídos por relatório
 */
export const devedores = mysqlTable("devedores", {
  id: int("id").autoincrement().primaryKey(),
  relatorioId: int("relatorioId").notNull(),
  nome: varchar("nome", { length: 256 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  valor: varchar("valor", { length: 64 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  linkOrigem: varchar("linkOrigem", { length: 256 }),
  cobrancaEnviada: mysqlEnum("cobrancaEnviada", ["pendente", "enviada", "falhou"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Configuracao = typeof configuracoes.$inferSelect;
export type InsertConfiguracao = typeof configuracoes.$inferInsert;
export type ManualInstrucao = typeof manualInstrucoes.$inferSelect;
export type InsertManualInstrucao = typeof manualInstrucoes.$inferInsert;
export type Relatorio = typeof relatorios.$inferSelect;
export type InsertRelatorio = typeof relatorios.$inferInsert;
export type Devedor = typeof devedores.$inferSelect;
export type InsertDevedor = typeof devedores.$inferInsert;
