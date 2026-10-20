import { supabase, SupabaseClientRecord } from "../lib/supabase";
import { AccessSession } from "../types";

export const MASTER_ADMIN_EMAIL = "herisson.trader.jt5@gmail.com";
export const HIOVE_ACCESS_KEY = "hiove_da2db06e1e059a8c192e68fb86d50ad1a6318465a4ab673e";

const LOCAL_STORAGE_KEY = "candlex_clients_cache_v2";

export interface ClientRecord {
  email: string;
  firstLoginAt: number;
  lastLoginAt: number;
  expiresAt: number | null; // null = Lifetime
  status: "ACTIVE" | "EXPIRED" | "BLOCKED";
  registeredVia: "HIOVE" | "ADMIN_MANUAL" | "ADMIN_MASTER";
  notes?: string;
}

// Initial fallback seeds
const INITIAL_SEED: ClientRecord[] = [
  {
    email: MASTER_ADMIN_EMAIL,
    firstLoginAt: 1740000000000,
    lastLoginAt: Date.now(),
    expiresAt: null,
    status: "ACTIVE",
    registeredVia: "ADMIN_MASTER",
    notes: "Administrador Master do Sistema CandleX AI",
  },
];

function getLocalCache(): ClientRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Erro ao ler cache local de clientes:", e);
  }
  return INITIAL_SEED;
}

function setLocalCache(clients: ClientRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {
    console.warn("Erro ao salvar cache local de clientes:", e);
  }
}

function mapSupabaseToLocal(row: SupabaseClientRecord): ClientRecord {
  return {
    email: row.email.toLowerCase().trim(),
    firstLoginAt: row.first_login_at ? Number(row.first_login_at) : Date.now(),
    lastLoginAt: row.last_login_at ? Number(row.last_login_at) : Date.now(),
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
    status: row.status,
    registeredVia: row.registered_via,
    notes: row.notes || "",
  };
}

function mapLocalToSupabase(client: ClientRecord): SupabaseClientRecord {
  return {
    email: client.email.toLowerCase().trim(),
    first_login_at: client.firstLoginAt,
    last_login_at: client.lastLoginAt,
    expires_at: client.expiresAt,
    status: client.status,
    registered_via: client.registeredVia,
    notes: client.notes || "",
  };
}

/**
 * Busca todos os clientes diretamente no Supabase com fallback para o cache local
 */
export async function getClientsFromDatabase(): Promise<ClientRecord[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapSupabaseToLocal);
      
      // Garante que o Admin Master sempre exista na lista
      const hasAdmin = mapped.some((c) => c.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());
      if (!hasAdmin) {
        mapped.unshift(INITIAL_SEED[0]);
      }
      
      setLocalCache(mapped);
      return mapped;
    } else if (error) {
      console.warn("[Supabase] Aviso ao buscar clientes:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase] Falha de conexão ao buscar clientes:", err);
  }

  // Fallback seguro para cache local
  return getLocalCache();
}

/**
 * Cria ou atualiza um cliente no Supabase e no cache local
 */
export async function saveClientToDatabase(client: ClientRecord): Promise<ClientRecord[]> {
  const cleanEmail = client.email.toLowerCase().trim();
  const updatedClient: ClientRecord = {
    ...client,
    email: cleanEmail,
  };

  // 1. Atualiza cache local imediatamente para fluidez
  const current = getLocalCache();
  const idx = current.findIndex((c) => c.email.toLowerCase() === cleanEmail);
  let updatedList: ClientRecord[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = updatedClient;
  } else {
    updatedList = [updatedClient, ...current];
  }
  setLocalCache(updatedList);

  // 2. Persiste no Supabase
  try {
    const row = mapLocalToSupabase(updatedClient);
    const { error } = await supabase
      .from("clients")
      .upsert(row, { onConflict: "email" });

    if (error) {
      console.warn("[Supabase] Aviso ao salvar cliente no banco:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase] Falha de conexão ao salvar cliente:", err);
  }

  // 3. Sincroniza também com o servidor local (data/clients.json) se disponível
  try {
    fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: updatedClient.email,
        expiresAt: updatedClient.expiresAt,
        status: updatedClient.status,
        notes: updatedClient.notes,
      }),
    }).catch(() => {});
  } catch {}

  return updatedList;
}

/**
 * Exclui um cliente do Supabase e do cache local
 */
export async function deleteClientFromDatabase(email: string): Promise<ClientRecord[]> {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Não é possível excluir o Administrador Master.");
  }

  // Atualiza cache local
  const current = getLocalCache();
  const filtered = current.filter((c) => c.email.toLowerCase() !== cleanEmail);
  setLocalCache(filtered);

  // Remove do Supabase
  try {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("email", cleanEmail);

    if (error) {
      console.warn("[Supabase] Aviso ao deletar cliente:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase] Falha ao deletar cliente do banco:", err);
  }

  // Sincroniza exclusão no servidor local se disponível
  try {
    fetch(`/api/admin/clients/${encodeURIComponent(cleanEmail)}`, {
      method: "DELETE",
    }).catch(() => {});
  } catch {}

  return filtered;
}

/**
 * Define a quantidade exata de dias de acesso a partir de agora (ou null para Vitalício)
 */
export async function setClientDays(
  email: string,
  days: number | null,
  customNotes?: string
): Promise<ClientRecord[]> {
  const cleanEmail = email.toLowerCase().trim();
  const clients = await getClientsFromDatabase();
  const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);

  const expiresAt = days === null ? null : Date.now() + Math.max(0, days) * 24 * 60 * 60 * 1000;
  const status: "ACTIVE" | "EXPIRED" = days === 0 ? "EXPIRED" : "ACTIVE";

  if (existing) {
    return saveClientToDatabase({
      ...existing,
      expiresAt,
      status,
      notes: customNotes !== undefined ? customNotes : existing.notes,
    });
  } else {
    const now = Date.now();
    return saveClientToDatabase({
      email: cleanEmail,
      firstLoginAt: now,
      lastLoginAt: now,
      expiresAt,
      status,
      registeredVia: "ADMIN_MANUAL",
      notes: customNotes || "Cadastrado manualmente pelo Administrador",
    });
  }
}

/**
 * Soma ou subtrai dias do prazo atual do membro
 */
export async function addClientDays(
  email: string,
  daysToAdd: number
): Promise<ClientRecord[]> {
  const cleanEmail = email.toLowerCase().trim();
  const clients = await getClientsFromDatabase();
  const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!existing) {
    return setClientDays(cleanEmail, daysToAdd);
  }

  const now = Date.now();
  // Se o membro já tem validade futura, adiciona sobre ela; se expirou ou é vitalício, baseia em agora
  const baseTimestamp =
    existing.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;

  const newExpiresAt = Math.max(now, baseTimestamp + daysToAdd * 24 * 60 * 60 * 1000);

  return saveClientToDatabase({
    ...existing,
    expiresAt: newExpiresAt,
    status: "ACTIVE",
  });
}

/**
 * Define uma data específica de expiração
 */
export async function setClientExpirationDate(
  email: string,
  targetTimestamp: number | null
): Promise<ClientRecord[]> {
  const cleanEmail = email.toLowerCase().trim();
  const clients = await getClientsFromDatabase();
  const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!existing) return clients;

  return saveClientToDatabase({
    ...existing,
    expiresAt: targetTimestamp,
    status: targetTimestamp && targetTimestamp < Date.now() ? "EXPIRED" : "ACTIVE",
  });
}

/**
 * Alterna status do membro entre ACTIVE e BLOCKED
 */
export async function toggleClientStatus(
  email: string
): Promise<ClientRecord[]> {
  const cleanEmail = email.toLowerCase().trim();
  const clients = await getClientsFromDatabase();
  const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!existing) return clients;

  const nextStatus = existing.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
  return saveClientToDatabase({
    ...existing,
    status: nextStatus,
  });
}

/**
 * Validação de acesso do cliente via Hiove Access API
 */
export async function checkHioveAccessDirect(email: string): Promise<{ access: boolean; error?: string }> {
  try {
    const res = await fetch("https://access.hiove.io/api/v1/access-check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HIOVE_ACCESS_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Hiove Access API] Status ${res.status}:`, errText);
      return { access: false, error: `Hiove API status ${res.status}` };
    }

    const data = (await res.json()) as { access?: boolean };
    return { access: Boolean(data.access) };
  } catch (err: any) {
    console.error("[Hiove Access API] Erro ao validar:", err);
    return { access: false, error: err.message || "Erro de conexão com Hiove API" };
  }
}

/**
 * Validador Unificado de Acesso (100% Cloud, sem precisar de localhost)
 */
export async function verifyClientAccess(email: string): Promise<{
  success: boolean;
  access: boolean;
  isAdmin?: boolean;
  isExpired?: boolean;
  expiresAt?: number | null;
  email: string;
  message: string;
  error?: string;
}> {
  if (!email || !email.includes("@")) {
    return {
      success: false,
      access: false,
      email,
      message: "Por favor, informe um endereço de e-mail válido.",
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();

  // 1. MASTER ADMIN BYPASS (Acesso instantâneo e vitalício)
  if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
    const adminRecord: ClientRecord = {
      email: cleanEmail,
      firstLoginAt: now,
      lastLoginAt: now,
      expiresAt: null,
      status: "ACTIVE",
      registeredVia: "ADMIN_MASTER",
      notes: "Administrador Master do Sistema CandleX AI",
    };

    saveClientToDatabase(adminRecord).catch(() => {});

    return {
      success: true,
      access: true,
      isAdmin: true,
      email: cleanEmail,
      expiresAt: null,
      message: "Acesso de Administrador Master liberado com sucesso!",
    };
  }

  // 2. BUSCA NO BANCO DE DADOS (SUPABASE / CACHE)
  const clients = await getClientsFromDatabase();
  const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);

  if (existing) {
    // Cliente bloqueado pelo administrador
    if (existing.status === "BLOCKED") {
      return {
        success: true,
        access: false,
        email: cleanEmail,
        message: "Acesso bloqueado pela administração do CandleX AI. Entre em contato com o suporte.",
      };
    }

    // Cliente com prazo expirado
    if (existing.expiresAt && existing.expiresAt < now) {
      return {
        success: true,
        access: false,
        isExpired: true,
        email: cleanEmail,
        expiresAt: existing.expiresAt,
        message: `Seu período de acesso expirou em ${new Date(existing.expiresAt).toLocaleDateString("pt-BR")}. Entre em contato com o suporte para renovar.`,
      };
    }

    // Cliente ativo e válido
    existing.lastLoginAt = now;
    saveClientToDatabase(existing).catch(() => {});

    return {
      success: true,
      access: true,
      isAdmin: false,
      email: cleanEmail,
      expiresAt: existing.expiresAt,
      message: "Acesso VIP liberado com sucesso!",
    };
  }

  // 3. SE NÃO ENCONTRADO NO BANCO, VALIDA VIA HIOVE API
  const hioveResult = await checkHioveAccessDirect(cleanEmail);

  if (hioveResult.access) {
    // Novo cliente aprovado na Hiove: adiciona com 30 dias de acesso inicial
    const defaultDays = 30;
    const expiresAt = now + defaultDays * 24 * 60 * 60 * 1000;

    const newClient: ClientRecord = {
      email: cleanEmail,
      firstLoginAt: now,
      lastLoginAt: now,
      expiresAt,
      status: "ACTIVE",
      registeredVia: "HIOVE",
      notes: "Aprovado via Hiove Access API (cadastro + depósito)",
    };

    await saveClientToDatabase(newClient);

    return {
      success: true,
      access: true,
      isAdmin: false,
      email: cleanEmail,
      expiresAt,
      message: "Acesso VIP liberado com sucesso via Hiove!",
    };
  }

  return {
    success: true,
    access: false,
    email: cleanEmail,
    message: "Acesso não liberado. Certifique-se de que se cadastrou pelo link oficial e concluiu o primeiro depósito na Hiove.",
    error: hioveResult.error,
  };
}
