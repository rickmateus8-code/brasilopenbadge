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
    35	async function insertTransaction(env: Env, userId: string, type: 'credit' | 'debit', amount: number, description: string) {
    36	  try {
    37	    await env.DB.prepare(
    38	      `INSERT INTO transactions (id, user_id, type, amount, description, created_at)
    39	       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    40	    ).bind(crypto.randomUUID(), userId, type, amount, description).run();
    41	  } catch {
    42	    await env.DB.prepare('INSERT INTO transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, datetime("now"))')
    43	      .bind(userId, type, amount, description).run();
    44	  }
    45	}
    46	
    47	export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
    48	  const admin = await getAdminUser(request, env);
    49	  if (!admin) {
    50	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
    51	  }
    52	
    53	  try {
    54	    const userId = String(params.id || '');
    55	    const body = await request.json<any>().catch(() => ({}));
    56	    const delta = Number(body.delta || 0);
    57	    if (!Number.isFinite(delta) || delta === 0) {
    58	      return new Response(JSON.stringify({ success: false, error: 'Delta inválido' }), { status: 400, headers: corsHeaders });
    59	    }
    60	
    61	    const user = await env.DB.prepare('SELECT id, username, balance FROM users WHERE id = ? LIMIT 1').bind(userId).first<any>();
    62	    if (!user) {
    63	      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    64	    }
    65	
    66	    const nextBalance = Number(user.balance || 0) + delta;
    67	    if (nextBalance < 0) {
    68	      return new Response(JSON.stringify({ success: false, error: 'Saldo insuficiente para débito manual' }), { status: 400, headers: corsHeaders });
    69	    }
    70	
    71	    await env.DB.prepare('UPDATE users SET balance = ?, updated_at = datetime("now") WHERE id = ?').bind(nextBalance, userId).run();
    72	    const type = delta > 0 ? 'credit' : 'debit';
    73	    const description = delta > 0 ? 'Crédito manual pelo administrador' : 'Débito manual pelo administrador';
    74	    await insertTransaction(env, userId, type, Math.abs(delta), description);
    75	    await logAdminAction(env, admin.id, 'adjust_user_balance', userId, { delta, old_balance: user.balance, new_balance: nextBalance });
    76	
    77	    return new Response(JSON.stringify({ success: true, user: { ...user, balance: nextBalance } }), { headers: corsHeaders });
    78	  } catch (error: any) {
    79	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
    80	  }
    81	};
    82	
    83	export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
    84	