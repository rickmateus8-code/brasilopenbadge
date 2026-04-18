     1	import type { Env } from '../../../../types';
     2	
     3	const corsHeaders = {
     4	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     5	  'Access-Control-Allow-Methods': 'POST, OPTIONS',
     6	  'Access-Control-Allow-Headers': 'Content-Type',
     7	  'Access-Control-Allow-Credentials': 'true',
     8	  'Content-Type': 'application/json',
     9	};
    10	
    11	function getSessionToken(request: Request): string | null {
    12	  const cookie = request.headers.get('Cookie') || '';
    13	  const match = cookie.match(/docmaster_session=([^;]+)/);
    14	  return match ? match[1] : null;
    15	}
    16	
    17	async function getAdminUser(request: Request, env: Env) {
    18	  const token = getSessionToken(request);
    19	  if (!token) return null;
    20	  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
    21	  if (!session) return null;
    22	  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
    23	  return user?.role === 'admin' ? user : null;
    24	}
    25	
    26	async function logAdminAction(env: Env, adminId: string, action: string, targetId: string, details: any) {
    27	  try {
    28	    await env.DB.prepare(`
    29	      INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
    30	      VALUES (?, ?, ?, 'user', ?, ?, datetime('now'))
    31	    `).bind(crypto.randomUUID(), adminId, action, targetId, JSON.stringify(details)).run();
    32	  } catch {}
    33	}
    34	
    35	export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
    36	  try {
    37	    const admin = await getAdminUser(request, env);
    38	    if (!admin) {
    39	      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
    40	    }
    41	
    42	    const userId = String(params.id || '');
    43	    const user = await env.DB.prepare('SELECT id, username, is_active FROM users WHERE id = ? LIMIT 1').bind(userId).first<any>();
    44	    if (!user) {
    45	      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    46	    }
    47	
    48	    const nextActive = Number(user.is_active) ? 0 : 1;
    49	    await env.DB.prepare('UPDATE users SET is_active = ?, updated_at = datetime("now") WHERE id = ?').bind(nextActive, userId).run();
    50	    await logAdminAction(env, admin.id, 'toggle_user_active', userId, { previous: user.is_active, next: nextActive, username: user.username });
    51	
    52	    return new Response(JSON.stringify({ success: true, is_active: nextActive }), { headers: corsHeaders });
    53	  } catch (error: any) {
    54	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
    55	  }
    56	};
    57	
    58	export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
    59	