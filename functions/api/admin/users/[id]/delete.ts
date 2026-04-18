import type { Env } from '../../../../types';

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

async function getAdminUser(request: Request, env: Env) {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
  if (!session) return null;
  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
  return user?.role === 'admin' ? user : null;
}

async function logAdminAction(env: Env, adminId: string, action: string, targetId: string, details: any) {
  try {
    await env.DB.prepare(`
      INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, 'user', ?, ?, datetime('now'))
    `).bind(crypto.randomUUID(), adminId, action, targetId, JSON.stringify(details)).run();
  } catch {}
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const admin = await getAdminUser(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
    }

    const userId = String(params.id || '');
    const body = await request.json<any>().catch(() => ({}));
    if (body.confirm !== true || body.confirmation_text !== 'EXCLUIR') {
      return new Response(JSON.stringify({ success: false, error: 'Confirmação dupla obrigatória' }), { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? LIMIT 1').bind(userId).first<any>();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    }

    if (String(user.id) === String(admin.id)) {
      return new Response(JSON.stringify({ success: false, error: 'Não é possível excluir o próprio admin' }), { status: 400, headers: corsHeaders });
    }

    const operations = [
      ['DELETE FROM referral_earnings WHERE referrer_id = ? OR referred_id = ?', userId, userId],
      ['DELETE FROM cashback_earnings WHERE user_id = ?', userId],
      ['DELETE FROM referrals WHERE referrer_id = ? OR referred_id = ?', userId, userId],
      ['DELETE FROM referral_codes WHERE user_id = ?', userId],
      ['DELETE FROM user_presence_activity WHERE user_id = ?', userId],
      ['DELETE FROM user_presence WHERE user_id = ?', userId],
      ['DELETE FROM notifications WHERE user_id = ?', userId],
      ['DELETE FROM sessions WHERE user_id = ?', userId],
      ['DELETE FROM transactions WHERE user_id = ?', userId],
      ['DELETE FROM documentos WHERE user_id = ?', userId],
      ['DELETE FROM attestations WHERE user_id = ?', userId],
      ['DELETE FROM receitas WHERE user_id = ?', userId],
      ['DELETE FROM documents WHERE user_id = ?', userId],
      ['DELETE FROM users WHERE id = ?', userId],
    ] as const;

    for (const entry of operations) {
      const [sql, ...binds] = entry as unknown as [string, ...any[]];
      try {
        await env.DB.prepare(sql).bind(...binds).run();
      } catch {}
    }

    await logAdminAction(env, admin.id, 'hard_delete_user', userId, {
      username: user.username,
      cascade: ['documents', 'transactions', 'sessions', 'presence', 'referrals'],
    });

    return new Response(JSON.stringify({ success: true, message: 'Usuário excluído em cascata' }), { headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
