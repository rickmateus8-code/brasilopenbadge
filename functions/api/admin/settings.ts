import type { Env } from '../../types';

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('Origin') || 'https://docmaster.store';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
};

const SETTING_DEFAULTS: Record<string, string> = {
  site_name: 'DocMaster',
  support_whatsapp: '',
  max_documents_per_day: '100',
  auto_delete_days: '60',
  maintenance_mode: 'false',
  auto_delete_atestado: '60',
  auto_delete_receita: '60',
  auto_delete_cnh: '365',
  auto_delete_cha: '60',
  auto_delete_toxicologico: '60',
  auto_delete_historico: '90',
};

const ALLOWED_KEYS = Object.keys(SETTING_DEFAULTS);

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAdminUser(request: Request, env: Env) {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
  if (!session) return null;
  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
  return user?.role === 'admin' ? user : null;
}

async function ensureSettingsTable(env: Env) {
  // Check if table exists and has the correct column
  try {
    const tableInfo = await env.DB.prepare("PRAGMA table_info(system_settings)").all<any>();
    const hasKeyColumn = tableInfo.results?.some((col: any) => col.name === 'key');

    if (tableInfo.results?.length > 0 && !hasKeyColumn) {
      // Table exists but is corrupted (missing 'key' column)
      // Renaming to backup and recreating is safest for settings
      await env.DB.prepare(`ALTER TABLE system_settings RENAME TO system_settings_old_${Date.now()}`).run();
    }
  } catch (_) {}

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await env.DB.prepare('INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
      .bind(key, value).run();
  }
}

async function logAdminAction(env: Env, adminId: string, action: string, details: any) {
  try {
    await env.DB.prepare(`
      INSERT INTO admin_logs (id, admin_id, action, target_type, details, created_at)
      VALUES (?, ?, ?, 'settings', ?, datetime('now'))
    `).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details)).run();
  } catch {}
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = getCorsHeaders(request);
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  try {
    await ensureSettingsTable(env);
    const result = await env.DB.prepare(
      `SELECT key, value FROM system_settings WHERE key IN (${ALLOWED_KEYS.map(() => '?').join(', ')})`
    ).bind(...ALLOWED_KEYS).all<{ key: string; value: string }>();

    const settings: Record<string, string | boolean> = { ...SETTING_DEFAULTS, maintenance_mode: false };
    for (const row of result.results || []) {
      settings[row.key] = row.key === 'maintenance_mode' ? row.value === 'true' : row.value;
    }

    return new Response(JSON.stringify({ success: true, settings }), { headers: corsHeaders });
  } catch (error: any) {
    console.error('[settings get error]', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno ao carregar configurações' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = getCorsHeaders(request);
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
  }

  try {
    await ensureSettingsTable(env);
    const body = await request.json<Record<string, any>>().catch(() => ({}));
    const saved: Record<string, string> = {};

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      const stringValue = typeof value === 'boolean' ? String(value) : String(value ?? '');
      await env.DB.prepare(
        'INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))'
      ).bind(key, stringValue).run();
      saved[key] = stringValue;
    }

    await logAdminAction(env, admin.id, 'update_settings', saved);
    return new Response(JSON.stringify({ success: true, settings: saved }), { headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno ao salvar configurações' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPut = onRequestPost;

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: JSON_HEADERS });
