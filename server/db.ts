import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, configuracoes, manualInstrucoes, relatorios, devedores } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { Configuracao, InsertConfiguracao, ManualInstrucao, InsertManualInstrucao, Relatorio, InsertRelatorio, Devedor, InsertDevedor } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// === Configurações ===

export async function getConfiguracoes(userId: number): Promise<Configuracao | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(configuracoes).where(eq(configuracoes.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertConfiguracoes(config: InsertConfiguracao): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert configuracoes: database not available"); return; }
  await db.insert(configuracoes).values(config).onDuplicateKeyUpdate({
    set: {
      emailZeglam: config.emailZeglam ?? null,
      senhaZeglam: config.senhaZeglam ?? null,
      chavePix: config.chavePix ?? null,
      whatsappAutomatico: config.whatsappAutomatico ?? 'on',
      mensagemCobranca: config.mensagemCobranca ?? null,
      openaiApiKey: config.openaiApiKey ?? null,
    },
  });
}

// === Manual de Instruções ===

export async function getManual(userId: number): Promise<ManualInstrucao | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(manualInstrucoes).where(eq(manualInstrucoes.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertManual(userId: number, conteudo: string): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert manual: database not available"); return; }
  await db.insert(manualInstrucoes).values({ userId, conteudo }).onDuplicateKeyUpdate({
    set: { conteudo },
  });
}

// === Relatórios ===

export async function createRelatorio(rel: InsertRelatorio): Promise<number | undefined> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot create relatorio: database not available"); return undefined; }
  const result = await db.insert(relatorios).values(rel);
  return result[0]?.insertId;
}

export async function updateRelatorio(id: number, updates: Partial<Relatorio>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(relatorios).set(updates).where(eq(relatorios.id, id));
}

export async function getRelatorios(userId: number, limit = 20): Promise<Relatorio[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(relatorios).where(eq(relatorios.userId, userId)).orderBy(desc(relatorios.createdAt)).limit(limit);
  return result;
}

export async function getRelatorioById(id: number): Promise<Relatorio | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(relatorios).where(eq(relatorios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// === Devedores ===

export async function insertDevedores(items: InsertDevedor[]): Promise<void> {
  const db = await getDb();
  if (!db || items.length === 0) return;
  await db.insert(devedores).values(items);
}

export async function getDevedoresByRelatorio(relatorioId: number): Promise<Devedor[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(devedores).where(eq(devedores.relatorioId, relatorioId));
  return result;
}

export async function updateDevedorCobranca(id: number, status: 'pendente' | 'enviada' | 'falhou'): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(devedores).set({ cobrancaEnviada: status }).where(eq(devedores.id, id));
}
