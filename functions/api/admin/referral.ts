// Admin referral management endpoints
// GET: List all referrals, earnings, and settings
// PUT: Update referral/cashback settings (global or per-user)
// DELETE: Clear referral logs

const JSON_HEADERS = { "Content-Type": "application/json" };

// Auto-cria as tabelas de referral se não existirem
async function ensureReferralTables(db: D1Database) {
  const migrations = [
    "CREATE TABLE IF NOT EXISTS referral_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS referrals (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id TEXT NOT NULL, referred_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS referral_earnings (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id TEXT NOT NULL, referred_id TEXT NOT NULL, deposit_amount REAL NOT NULL, percentage REAL NOT NULL, earned_amount REAL NOT NULL, deposit_transaction_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS cashback_earnings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, deposit_amount REAL NOT NULL, percentage REAL NOT NULL, cashback_amount REAL NOT NULL, deposit_transaction_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "INSERT OR IGNORE INTO system_settings (key, value) VALUES ('referral_percentage', '10')",
    "INSERT OR IGNORE INTO system_settings (key, value) VALUES ('cashback_percentage', '5')",
    "INSERT OR IGNORE INTO system_settings (key, value) VALUES ('referral_enabled', 'true')",
    "INSERT OR IGNORE INTO system_settings (key, value) VALUES ('cashback_enabled', 'true')",
  ];
  // Adicionar colunas à tabela users se não existirem
  const userCols = [
    "ALTER TABLE users ADD COLUMN referral_code TEXT",
    "ALTER TABLE users ADD COLUMN referred_by TEXT",
    "ALTER TABLE users ADD COLUMN cashback_percentage REAL",
    "ALTER TABLE users ADD COLUMN referral_percentage REAL",
    "ALTER TABLE users ADD COLUMN total_deposited REAL DEFAULT 0",
  ];
  for (const sql of [...migrations, ...userCols]) {
    try { await db.prepare(sql).run(); } catch { /* ignora erros de "already exists" */ }
  }
}

// Wrapper seguro para queries que podem falhar se tabela não existir
async function safeQuery<T>(db: D1Database, sql: string, params: any[] = []): Promise<T | null> {
  try {
    let stmt = db.prepare(sql);
    if (params.length > 0) stmt = stmt.bind(...params);
    return await stmt.first<T>();
  } catch { return null; }
}

async function safeQueryAll<T>(db: D1Database, sql: string, params: any[] = []): Promise<T[]> {
  try {
    let stmt = db.prepare(sql);
    if (params.length > 0) stmt = stmt.bind(...params);
    const result = await stmt.all<T>();
    return result?.results || [];
  } catch { return []; }
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/docmaster_session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: JSON_HEADERS });

  const session = await safeQuery<{ user_id: string; role: string }>(db,
    "SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')",
    [tokenMatch[1]]
  );
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: JSON_HEADERS });

  // Garantir que as tabelas existem
  await ensureReferralTables(db);

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "overview";

  if (tab === "overview") {
    const totalReferrals = await safeQuery<{ count: number }>(db, "SELECT COUNT(*) as count FROM referrals");
    const totalReferralEarnings = await safeQuery<{ total: number }>(db, "SELECT COALESCE(SUM(earned_amount), 0) as total FROM referral_earnings");
    const totalCashbackPaid = await safeQuery<{ total: number }>(db, "SELECT COALESCE(SUM(cashback_amount), 0) as total FROM cashback_earnings");
    const activeReferrers = await safeQuery<{ count: number }>(db, "SELECT COUNT(DISTINCT referrer_id) as count FROM referrals");
    const settings = await safeQueryAll<{ key: string; value: string }>(db,
      "SELECT key, value FROM system_settings WHERE key IN ('referral_percentage', 'cashback_percentage', 'referral_enabled', 'cashback_enabled')"
    );

    return new Response(JSON.stringify({
      totalReferrals: totalReferrals?.count || 0,
      totalReferralEarnings: totalReferralEarnings?.total || 0,
      totalCashbackPaid: totalCashbackPaid?.total || 0,
      activeReferrers: activeReferrers?.count || 0,
      settings,
    }), { headers: JSON_HEADERS });
  }

  if (tab === "referrals") {
    const referrals = await safeQueryAll(db, `
      SELECT r.id, r.created_at,
             COALESCE(u1.display_name, u1.username) as referrer_name, u1.email as referrer_email, u1.referral_percentage as referrer_custom_pct,
             COALESCE(u2.display_name, u2.username) as referred_name, u2.email as referred_email,
             COALESCE(SUM(re.earned_amount), 0) as total_earned
      FROM referrals r
      JOIN users u1 ON r.referrer_id = u1.id
      JOIN users u2 ON r.referred_id = u2.id
      LEFT JOIN referral_earnings re ON re.referrer_id = r.referrer_id AND re.referred_id = r.referred_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    return new Response(JSON.stringify({ referrals }), { headers: JSON_HEADERS });
  }

  if (tab === "earnings") {
    const earnings = await safeQueryAll(db, `
      SELECT re.id, re.deposit_amount, re.percentage, re.earned_amount, re.created_at,
             COALESCE(u1.display_name, u1.username) as referrer_name, COALESCE(u2.display_name, u2.username) as referred_name
      FROM referral_earnings re
      JOIN users u1 ON re.referrer_id = u1.id
      JOIN users u2 ON re.referred_id = u2.id
      ORDER BY re.created_at DESC
      LIMIT 100
    `);
    return new Response(JSON.stringify({ earnings }), { headers: JSON_HEADERS });
  }

  if (tab === "cashback") {
    const cashback = await safeQueryAll(db, `
      SELECT ce.id, ce.deposit_amount, ce.percentage, ce.cashback_amount, ce.created_at,
             COALESCE(u.display_name, u.username) as user_name, u.email as user_email
      FROM cashback_earnings ce
      JOIN users u ON ce.user_id = u.id
      ORDER BY ce.created_at DESC
      LIMIT 100
    `);
    return new Response(JSON.stringify({ cashback }), { headers: JSON_HEADERS });
  }

  if (tab === "users") {
    const users = await safeQueryAll(db, `
      SELECT u.id, COALESCE(u.display_name, u.username) as name, u.email, u.referral_code, u.referral_percentage, u.cashback_percentage,
             rc.code,
             (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as total_referred,
             (SELECT COALESCE(SUM(earned_amount), 0) FROM referral_earnings WHERE referrer_id = u.id) as total_earned,
             (SELECT COALESCE(SUM(cashback_amount), 0) FROM cashback_earnings WHERE user_id = u.id) as total_cashback
      FROM users u
      LEFT JOIN referral_codes rc ON rc.user_id = u.id
      ORDER BY COALESCE(u.display_name, u.username) ASC
      LIMIT 200
    `);
    return new Response(JSON.stringify({ users }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Tab inválida" }), { status: 400, headers: JSON_HEADERS });
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/docmaster_session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: JSON_HEADERS });

  const session = await safeQuery<{ user_id: string; role: string }>(db,
    "SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')",
    [tokenMatch[1]]
  );
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: JSON_HEADERS });

  await ensureReferralTables(db);

  const body = await request.json() as any;
  const { action } = body;

  if (action === "update_global_settings") {
    const { referral_percentage, cashback_percentage, referral_enabled, cashback_enabled } = body;
    if (referral_percentage !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('referral_percentage', ?, datetime('now'))").bind(String(referral_percentage)).run();
    }
    if (cashback_percentage !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('cashback_percentage', ?, datetime('now'))").bind(String(cashback_percentage)).run();
    }
    if (referral_enabled !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('referral_enabled', ?, datetime('now'))").bind(String(referral_enabled)).run();
    }
    if (cashback_enabled !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('cashback_enabled', ?, datetime('now'))").bind(String(cashback_enabled)).run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  }

  if (action === "update_user_settings") {
    const { userId, referral_percentage, cashback_percentage } = body;
    if (!userId) return new Response(JSON.stringify({ error: "userId é obrigatório" }), { status: 400, headers: JSON_HEADERS });

    // Verificar se as colunas existem antes de atualizar
    try {
      await db.prepare("UPDATE users SET referral_percentage = ?, cashback_percentage = ? WHERE id = ?")
        .bind(referral_percentage ?? null, cashback_percentage ?? null, userId).run();
    } catch (e: any) {
      // Se colunas não existem, tentar adicionar e depois atualizar
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN referral_percentage REAL").run();
      } catch {}
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN cashback_percentage REAL").run();
      } catch {}
      await db.prepare("UPDATE users SET referral_percentage = ?, cashback_percentage = ? WHERE id = ?")
        .bind(referral_percentage ?? null, cashback_percentage ?? null, userId).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: JSON_HEADERS });
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/docmaster_session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: JSON_HEADERS });

  const session = await safeQuery<{ user_id: string; role: string }>(db,
    "SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')",
    [tokenMatch[1]]
  );
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: JSON_HEADERS });

  const url = new URL(request.url);
  const clearType = url.searchParams.get("clear");

  try {
    if (clearType === "earnings") {
      await db.exec("DELETE FROM referral_earnings");
      await db.exec("DELETE FROM cashback_earnings");
      return new Response(JSON.stringify({ success: true, message: "Ganhos limpos" }), { headers: JSON_HEADERS });
    }
    if (clearType === "referrals") {
      await db.exec("DELETE FROM referrals");
      return new Response(JSON.stringify({ success: true, message: "Indicações limpas" }), { headers: JSON_HEADERS });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Tipo de limpeza inválido" }), { status: 400, headers: JSON_HEADERS });
};
