import type { Env } from '../../types';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthAdmin(request: Request, env: Env): Promise<any | null> {
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

async function ensurePresenceTables(env: Env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id TEXT PRIMARY KEY,
      current_page TEXT DEFAULT '/dashboard',
      current_action TEXT DEFAULT 'navegando',
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      is_online INTEGER NOT NULL DEFAULT 0,
      session_id TEXT,
      session_started_at TEXT,
      first_seen TEXT,
      current_page_started_at TEXT,
      current_activity_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS user_presence_activity (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      page_path TEXT NOT NULL,
      action TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      activity_meta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  const alterStatements = [
    'ALTER TABLE user_presence ADD COLUMN session_id TEXT',
    'ALTER TABLE user_presence ADD COLUMN session_started_at TEXT',
    'ALTER TABLE user_presence ADD COLUMN first_seen TEXT',
    'ALTER TABLE user_presence ADD COLUMN current_page_started_at TEXT',
    'ALTER TABLE user_presence ADD COLUMN current_activity_id TEXT',
    'ALTER TABLE user_presence ADD COLUMN ip_address TEXT',
    'ALTER TABLE user_presence ADD COLUMN user_agent TEXT',
  ];
  for (const sql of alterStatements) {
    try { await env.DB.prepare(sql).run(); } catch {}
  }
  try { await env.DB.prepare('ALTER TABLE users ADD COLUMN profile_photo TEXT').run(); } catch {}

  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_activity_user_started ON user_presence_activity(user_id, started_at DESC)').run();
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    await ensurePresenceTables(env);

    const staleBefore = new Date(Date.now() - 75 * 1000).toISOString();
    await env.DB.prepare(
      'UPDATE user_presence SET is_online = 0 WHERE last_seen < ?'
    ).bind(staleBefore).run();

    const usersResult = await env.DB.prepare(`
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        u.balance,
        u.profile_photo,
        u.created_at AS user_created_at,
        COALESCE(up.is_online, 0) AS is_online,
        COALESCE(up.current_page, '') AS current_page,
        COALESCE(up.current_action, '') AS current_action,
        up.last_seen,
        up.first_seen,
        up.session_id,
        up.session_started_at,
        up.current_page_started_at,
        up.current_activity_id,
        up.ip_address,
        up.user_agent
      FROM users u
      LEFT JOIN user_presence up ON CAST(u.id AS TEXT) = CAST(up.user_id AS TEXT)
      WHERE u.is_active = 1
      ORDER BY COALESCE(up.is_online, 0) DESC, COALESCE(up.last_seen, u.created_at) DESC
    `).all<any>();

    const activityResult = await env.DB.prepare(`
      SELECT id, user_id, session_id, page_path, action, started_at, ended_at, duration_seconds, activity_meta
      FROM user_presence_activity
      ORDER BY started_at DESC
      LIMIT 2000
    `).all<any>();

    const now = Date.now();
    const activityByUser = new Map<string, any[]>();

    for (const row of activityResult.results || []) {
      const endTs = row.ended_at ? new Date(row.ended_at).getTime() : now;
      const startTs = row.started_at ? new Date(row.started_at).getTime() : now;
      const computedDuration = Math.max(0, Math.floor((endTs - startTs) / 1000));
      const item = {
        ...row,
        ended_at: row.ended_at || null,
        duration_seconds: row.duration_seconds ? Number(row.duration_seconds) : computedDuration,
        activity_meta: row.activity_meta ? (() => { try { return JSON.parse(row.activity_meta); } catch { return null; } })() : null,
      };
      const bucket = activityByUser.get(String(row.user_id)) || [];
      if (bucket.length < 20) {
        bucket.push(item);
        activityByUser.set(String(row.user_id), bucket);
      }
    }

    const results = (usersResult.results || []).map((row: any) => {
      const timeline = (activityByUser.get(String(row.user_id)) || []).sort((a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );

      const totalsMap = new Map<string, number>();
      for (const item of timeline) {
        totalsMap.set(item.page_path, (totalsMap.get(item.page_path) || 0) + Number(item.duration_seconds || 0));
      }

      const page_totals = Array.from(totalsMap.entries())
        .map(([page, duration_seconds]) => ({ page, duration_seconds }))
        .sort((a, b) => b.duration_seconds - a.duration_seconds);

      const sessionStartedAt = row.session_started_at || row.first_seen || row.last_seen || null;
      const pageStartedAt = row.current_page_started_at || sessionStartedAt || row.last_seen || null;
      const sessionDurationSeconds = sessionStartedAt ? Math.max(0, Math.floor((now - new Date(sessionStartedAt).getTime()) / 1000)) : 0;
      const currentPageDurationSeconds = pageStartedAt ? Math.max(0, Math.floor((now - new Date(pageStartedAt).getTime()) / 1000)) : 0;

      return {
        ...row,
        timeline,
        page_totals,
        total_session_seconds: sessionDurationSeconds,
        current_page_duration_seconds: currentPageDurationSeconds,
      };
    });

    const onlineCount = results.filter((item: any) => item.is_online === 1).length;

    return new Response(JSON.stringify({
      success: true,
      presence: results,
      online_count: onlineCount,
      offline_count: results.length - onlineCount,
      total_users: results.length,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
