import type { Env } from '../types';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthUser(env: Env, request: Request) {
  const token = getSessionToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1'
  ).bind(token).first<{ user_id: string }>();

  if (!session) return null;

  return env.DB.prepare(
    'SELECT id, username, role, balance, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1'
  ).bind(session.user_id).first<any>();
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

  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_activity_user_started ON user_presence_activity(user_id, started_at DESC)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_activity_session ON user_presence_activity(session_id)').run();
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await getAuthUser(env, request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    }

    await ensurePresenceTables(env);

    const body = await request.json<any>().catch(() => ({}));
    const now = typeof body?.timestamp === 'string' && body.timestamp ? body.timestamp : new Date().toISOString();
    const currentPage = typeof body?.current_page === 'string' && body.current_page ? body.current_page : '/dashboard';
    const currentAction = typeof body?.current_action === 'string' && body.current_action ? body.current_action : 'navegando';
    const sessionId = typeof body?.session_id === 'string' && body.session_id ? body.session_id : crypto.randomUUID();
    const activityMeta = body?.meta ? JSON.stringify(body.meta) : null;
    const userAgent = request.headers.get('User-Agent') || null;
    const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || null;

    const existing = await env.DB.prepare(
      'SELECT * FROM user_presence WHERE user_id = ? LIMIT 1'
    ).bind(user.id).first<any>();

    const lastSeenTs = existing?.last_seen ? new Date(existing.last_seen).getTime() : 0;
    const timedOut = !lastSeenTs || (Date.now() - lastSeenTs) > 5 * 60 * 1000;
    const isNewSession = !existing || timedOut || existing.session_id !== sessionId;
    const pageChanged = !existing || existing.current_page !== currentPage;
    const actionChanged = !existing || existing.current_action !== currentAction;
    const shouldRotateActivity = isNewSession || pageChanged || actionChanged;

    if (existing?.current_activity_id) {
      await env.DB.prepare(`
        UPDATE user_presence_activity
        SET ended_at = ?,
            duration_seconds = MAX(0, CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER))
        WHERE id = ?
      `).bind(now, now, existing.current_activity_id).run();
    }

    let currentActivityId = existing?.current_activity_id || null;
    let pageStartedAt = existing?.current_page_started_at || existing?.session_started_at || now;
    const sessionStartedAt = isNewSession ? now : (existing?.session_started_at || now);
    const firstSeen = isNewSession ? now : (existing?.first_seen || existing?.session_started_at || now);

    if (shouldRotateActivity) {
      currentActivityId = crypto.randomUUID();
      pageStartedAt = now;

      await env.DB.prepare(`
        INSERT INTO user_presence_activity (
          id, user_id, session_id, page_path, action, started_at, ended_at, duration_seconds, activity_meta, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).bind(
        currentActivityId,
        user.id,
        sessionId,
        currentPage,
        currentAction,
        now,
        now,
        activityMeta,
        now,
      ).run();
    } else if (currentActivityId) {
      await env.DB.prepare(`
        UPDATE user_presence_activity
        SET ended_at = ?,
            duration_seconds = MAX(0, CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER)),
            activity_meta = COALESCE(?, activity_meta)
        WHERE id = ?
      `).bind(now, now, activityMeta, currentActivityId).run();
    }

    await env.DB.prepare(`
      INSERT INTO user_presence (
        user_id, current_page, current_action, last_seen, is_online,
        session_id, session_started_at, first_seen, current_page_started_at,
        current_activity_id, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_page = excluded.current_page,
        current_action = excluded.current_action,
        last_seen = excluded.last_seen,
        is_online = 1,
        session_id = excluded.session_id,
        session_started_at = excluded.session_started_at,
        first_seen = excluded.first_seen,
        current_page_started_at = excluded.current_page_started_at,
        current_activity_id = excluded.current_activity_id,
        ip_address = COALESCE(excluded.ip_address, user_presence.ip_address),
        user_agent = COALESCE(excluded.user_agent, user_presence.user_agent)
    `).bind(
      user.id,
      currentPage,
      currentAction,
      now,
      sessionId,
      sessionStartedAt,
      firstSeen,
      pageStartedAt,
      currentActivityId,
      ipAddress,
      userAgent,
    ).run();

    const balanceRow = await env.DB.prepare(
      'SELECT balance FROM users WHERE id = ? LIMIT 1'
    ).bind(user.id).first<{ balance: number }>();

    return new Response(JSON.stringify({
      success: true,
      balance: balanceRow?.balance ?? 0,
      session_id: sessionId,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
