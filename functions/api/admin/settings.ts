import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAdminUser(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  const user = await env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
  return user?.role === 'admin' ? user : null;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ALLOWED_KEYS = [
  'site_name',
  'support_whatsapp',
  'max_documents_per_day',
  'auto_delete_days',
  'maintenance_mode',
];

// Ensure settings table exists and has defaults
async function ensureSettingsTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    // Insert defaults if not present
    const defaults: Record<string, string> = {
      site_name: 'DocMaster',
      support_whatsapp: '',
      max_documents_per_day: '100',
      auto_delete_days: '60',
      maintenance_mode: 'false',
    };
    for (const [key, value] of Object.entries(defaults)) {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)`
      ).bind(key, value).run();
    }
  } catch (_) { /* table may already exist */ }
}

// GET: Load all settings
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
  }

  try {
    await ensureSettingsTable(env);
    const result = await env.DB.prepare(
      `SELECT key, value FROM system_settings WHERE key IN (${ALLOWED_KEYS.map(() => '?').join(', ')})`
    ).bind(...ALLOWED_KEYS).all<{ key: string; value: string }>();

    const settings: Record<string, string | boolean> = {
      site_name: 'DocMaster',
      support_whatsapp: '',
      max_documents_per_day: '100',
      auto_delete_days: '60',
      maintenance_mode: false,
    };

    for (const row of result.results || []) {
      if (row.key === 'maintenance_mode') {
        settings[row.key] = row.value === 'true';
      } else {
        settings[row.key] = row.value;
      }
    }

    return new Response(JSON.stringify({ success: true, settings }), { status: 200, headers: JSON_HEADERS });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
};

// POST/PUT: Save settings
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getAdminUser(request, env);
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
  }

  try {
    await ensureSettingsTable(env);
    const body = await request.json() as Record<string, any>;

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      const strValue = typeof value === 'boolean' ? String(value) : String(value ?? '');
      await env.DB.prepare(
        `INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`
      ).bind(key, strValue).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Configurações salvas com sucesso' }), { status: 200, headers: JSON_HEADERS });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
};

export const onRequestPut = onRequestPost;

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
