import type { Env } from '../../types';

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('Origin') || 'https://docmaster.store';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
};

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAdminSession(request: Request, env: Env) {
  const token = getSessionToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(`
    SELECT s.user_id, u.username, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    LIMIT 1
  `).bind(token).first<any>();

  return session?.role === 'admin' ? session : null;
}

async function ensureReferralTables(env: Env) {
  // Check for schema mismatch in referral_settings
  try {
    const tableInfo = await env.DB.prepare("PRAGMA table_info(referral_settings)").all<any>();
    const hasKeyColumn = tableInfo.results?.some((col: any) => col.name === 'key');

    if (tableInfo.results?.length > 0 && !hasKeyColumn) {
      await env.DB.prepare(`ALTER TABLE referral_settings RENAME TO referral_settings_old_${Date.now()}`).run();
    }
  } catch (_) {}

  const statements = [
    `CREATE TABLE IF NOT EXISTS referral_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL,
      referred_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS referral_earnings (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL,
      referred_id TEXT NOT NULL,
      deposit_amount REAL NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      earned_amount REAL NOT NULL DEFAULT 0,
      deposit_transaction_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS cashback_earnings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      deposit_amount REAL NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      cashback_amount REAL NOT NULL DEFAULT 0,
      deposit_transaction_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS referral_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('referral_percentage', '10', 'Percentual global de indicação')`,
    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('cashback_percentage', '5', 'Percentual global de cashback')`,
    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('referral_enabled', 'true', 'Sistema de indicação habilitado')`,
    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('cashback_enabled', 'true', 'Sistema de cashback habilitado')`,
    `CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id)`,
    `CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_cashback_earnings_user ON cashback_earnings(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id)`,
  ];

  for (const sql of statements) {
    try { await env.DB.prepare(sql).run(); } catch {}
  }

  const userAlterStatements = [
    'ALTER TABLE users ADD COLUMN referred_by TEXT',
    'ALTER TABLE users ADD COLUMN referral_code TEXT',
    'ALTER TABLE users ADD COLUMN referral_percentage REAL',
    'ALTER TABLE users ADD COLUMN cashback_percentage REAL',
  ];
  for (const sql of userAlterStatements) {
    try { await env.DB.prepare(sql).run(); } catch {}
  }
}

async function logAdminAction(env: Env, adminId: string, action: string, details: any) {
  try {
    await env.DB.prepare(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, details, created_at)
       VALUES (?, ?, ?, 'referral', ?, datetime('now'))`
    ).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details)).run();
  } catch {}
}

function settingsArrayToObject(items: Array<{ key: string; value: string }>) {
  return items.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const session = await getAdminSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
    }

    await ensureReferralTables(env);

    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || 'overview';

    const settingsRows = await env.DB.prepare(
      `SELECT key, value FROM referral_settings WHERE key IN ('referral_percentage', 'cashback_percentage', 'referral_enabled', 'cashback_enabled')`
    ).all<{ key: string; value: string }>();
    const settings = settingsArrayToObject(settingsRows.results || []);

    if (tab === 'overview') {
      const totals = await env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM referrals) AS total_referrals,
          (SELECT COALESCE(SUM(earned_amount), 0) FROM referral_earnings) AS total_referral_earnings,
          (SELECT COALESCE(SUM(cashback_amount), 0) FROM cashback_earnings) AS total_cashback_paid,
          (SELECT COUNT(*) FROM referral_codes) AS active_codes,
          (SELECT COUNT(DISTINCT referrer_id) FROM referrals) AS active_referrers
      `).first<any>();

      const earningsByReferrer = await env.DB.prepare(`
        SELECT
          r.referrer_id,
          u.username AS referrer_username,
          COALESCE(e.total_earned, 0) AS total_earned,
          COUNT(DISTINCT r.referred_id) AS total_referred,
          e.last_earning_at
        FROM referrals r
        JOIN users u ON u.id = r.referrer_id
        LEFT JOIN (
          SELECT referrer_id, SUM(earned_amount) AS total_earned, MAX(created_at) AS last_earning_at
          FROM referral_earnings
          GROUP BY referrer_id
        ) e ON e.referrer_id = r.referrer_id
        GROUP BY r.referrer_id, u.username
        ORDER BY total_earned DESC, total_referred DESC
        LIMIT 50
      `).all<any>();

      return new Response(JSON.stringify({
        success: true,
        totalReferrals: Number(totals?.total_referrals || 0),
        totalReferralEarnings: Number(totals?.total_referral_earnings || 0),
        totalCashbackPaid: Number(totals?.total_cashback_paid || 0),
        activeCodes: Number(totals?.active_codes || 0),
        activeReferrers: Number(totals?.active_referrers || 0),
        settings: settingsRows.results || [],
        earningsByReferrer: earningsByReferrer.results || [],
      }), { headers: JSON_HEADERS });
    }

    if (tab === 'referrals') {
      const referrals = await env.DB.prepare(`
        SELECT
          r.id,
          r.created_at,
          r.status,
          ru.username AS referrer_username,
          uu.username AS referred_username,
          COALESCE(SUM(re.earned_amount), 0) AS commission_earned,
          COALESCE(MAX(re.percentage), ru.referral_percentage, 0) AS commission_percentage
        FROM referrals r
        JOIN users ru ON ru.id = r.referrer_id
        JOIN users uu ON uu.id = r.referred_id
        LEFT JOIN referral_earnings re ON re.referrer_id = r.referrer_id AND re.referred_id = r.referred_id
        GROUP BY r.id, r.created_at, r.status, ru.username, uu.username, ru.referral_percentage
        ORDER BY r.created_at DESC
        LIMIT 500
      `).all<any>();

      return new Response(JSON.stringify({ success: true, referrals: referrals.results || [] }), { headers: JSON_HEADERS });
    }

    if (tab === 'earnings') {
      const earnings = await env.DB.prepare(`
        SELECT
          re.id,
          re.created_at,
          re.deposit_amount,
          re.percentage,
          re.earned_amount,
          ru.username AS referrer_username,
          uu.username AS referred_username
        FROM referral_earnings re
        JOIN users ru ON ru.id = re.referrer_id
        JOIN users uu ON uu.id = re.referred_id
        ORDER BY re.created_at DESC
        LIMIT 500
      `).all<any>();

      const byReferrer = await env.DB.prepare(`
        SELECT
          re.referrer_id,
          u.username AS referrer_username,
          COUNT(*) AS earnings_count,
          COALESCE(SUM(re.earned_amount), 0) AS total_earned,
          COALESCE(SUM(re.deposit_amount), 0) AS total_deposit_base,
          MAX(re.created_at) AS last_earning_at
        FROM referral_earnings re
        JOIN users u ON u.id = re.referrer_id
        GROUP BY re.referrer_id, u.username
        ORDER BY total_earned DESC
        LIMIT 100
      `).all<any>();

      return new Response(JSON.stringify({ success: true, earnings: earnings.results || [], byReferrer: byReferrer.results || [] }), { headers: JSON_HEADERS });
    }

    if (tab === 'cashback') {
      const cashback = await env.DB.prepare(`
        SELECT
          ce.id,
          ce.created_at,
          ce.deposit_amount,
          ce.percentage,
          ce.cashback_amount,
          u.username AS user_name,
          u.email AS user_email
        FROM cashback_earnings ce
        JOIN users u ON u.id = ce.user_id
        ORDER BY ce.created_at DESC
        LIMIT 500
      `).all<any>();

      return new Response(JSON.stringify({ success: true, cashback: cashback.results || [] }), { headers: JSON_HEADERS });
    }

    if (tab === 'users') {
      const users = await env.DB.prepare(`
        SELECT
          u.id,
          u.username,
          u.email,
          COALESCE(rc.code, u.referral_code) AS code,
          u.referral_percentage,
          u.cashback_percentage,
          (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.id) AS total_referred,
          (SELECT COALESCE(SUM(earned_amount), 0) FROM referral_earnings re WHERE re.referrer_id = u.id) AS total_earned,
          (SELECT COALESCE(SUM(cashback_amount), 0) FROM cashback_earnings ce WHERE ce.user_id = u.id) AS total_cashback
        FROM users u
        LEFT JOIN referral_codes rc ON rc.user_id = u.id
        ORDER BY u.username ASC
        LIMIT 1000
      `).all<any>();

      return new Response(JSON.stringify({ success: true, users: users.results || [], settings: settingsRows.results || [] }), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ success: false, error: 'Tab inválida' }), { status: 400, headers: JSON_HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const session = await getAdminSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
    }

    await ensureReferralTables(env);

    const body = await request.json<any>().catch(() => ({}));
    if (body.action !== 'link_manual') {
      return new Response(JSON.stringify({ success: false, error: 'Ação inválida' }), { status: 400, headers: JSON_HEADERS });
    }

    const referrerId = String(body.referrer_id || '');
    const referredId = String(body.referred_id || '');
    if (!referrerId || !referredId) {
      return new Response(JSON.stringify({ success: false, error: 'IDs obrigatórios' }), { status: 400, headers: JSON_HEADERS });
    }
    if (referrerId === referredId) {
      return new Response(JSON.stringify({ success: false, error: 'Um usuário não pode indicar a si mesmo' }), { status: 400, headers: JSON_HEADERS });
    }

    const existing = await env.DB.prepare('SELECT id FROM referrals WHERE referred_id = ? LIMIT 1').bind(referredId).first();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'Este usuário já possui um indicador vinculado' }), { status: 409, headers: JSON_HEADERS });
    }

    await env.DB.prepare(
      `INSERT INTO referrals (id, referrer_id, referred_id, status, created_at)
       VALUES (?, ?, ?, 'active', datetime('now'))`
    ).bind(crypto.randomUUID(), referrerId, referredId).run();
    await env.DB.prepare('UPDATE users SET referred_by = ? WHERE id = ?').bind(referrerId, referredId).run();

    await logAdminAction(env, session.user_id, 'link_referral_manual', { referrer_id: referrerId, referred_id: referredId });

    return new Response(JSON.stringify({ success: true, message: 'Vínculo criado com sucesso' }), { headers: JSON_HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const session = await getAdminSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
    }

    await ensureReferralTables(env);

    const body = await request.json<any>().catch(() => ({}));
    const action = body.action;

    if (action === 'update_global_settings') {
      const updates = [
        ['referral_percentage', body.referral_percentage],
        ['cashback_percentage', body.cashback_percentage],
        ['referral_enabled', body.referral_enabled],
        ['cashback_enabled', body.cashback_enabled],
      ].filter(([, value]) => value !== undefined);

      for (const [key, value] of updates) {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO referral_settings (key, value, description, updated_at)
           VALUES (?, ?, COALESCE((SELECT description FROM referral_settings WHERE key = ?), ''), datetime('now'))`
        ).bind(key, String(value), key).run();
      }

      await logAdminAction(env, session.user_id, 'update_referral_global_settings', Object.fromEntries(updates));
      return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
    }

    if (action === 'update_user_settings') {
      const userId = String(body.userId || body.user_id || '');
      if (!userId) {
        return new Response(JSON.stringify({ success: false, error: 'userId é obrigatório' }), { status: 400, headers: JSON_HEADERS });
      }

      await env.DB.prepare(`
        UPDATE users
        SET referral_percentage = ?, cashback_percentage = ?
        WHERE id = ?
      `).bind(
        body.referral_percentage === null || body.referral_percentage === undefined || body.referral_percentage === '' ? null : Number(body.referral_percentage),
        body.cashback_percentage === null || body.cashback_percentage === undefined || body.cashback_percentage === '' ? null : Number(body.cashback_percentage),
        userId,
      ).run();

      await logAdminAction(env, session.user_id, 'update_user_referral_settings', {
        user_id: userId,
        referral_percentage: body.referral_percentage,
        cashback_percentage: body.cashback_percentage,
      });

      return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ success: false, error: 'Ação inválida' }), { status: 400, headers: JSON_HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const session = await getAdminSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
    }

    const url = new URL(request.url);
    const clearType = url.searchParams.get('clear');

    if (clearType === 'earnings') {
      await env.DB.prepare('DELETE FROM referral_earnings').run();
      await env.DB.prepare('DELETE FROM cashback_earnings').run();
      await logAdminAction(env, session.user_id, 'clear_referral_earnings', {});
      return new Response(JSON.stringify({ success: true, message: 'Ganhos limpos' }), { headers: JSON_HEADERS });
    }

    if (clearType === 'referrals') {
      await env.DB.prepare('DELETE FROM referrals').run();
      await logAdminAction(env, session.user_id, 'clear_referrals', {});
      return new Response(JSON.stringify({ success: true, message: 'Indicações limpas' }), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ success: false, error: 'Tipo de limpeza inválido' }), { status: 400, headers: JSON_HEADERS });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: JSON_HEADERS });
};
