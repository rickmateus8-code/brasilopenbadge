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
    43	    const body = await request.json<any>().catch(() => ({}));
    44	    if (body.confirm !== true || body.confirmation_text !== 'EXCLUIR') {
    45	      return new Response(JSON.stringify({ success: false, error: 'Confirmação dupla obrigatória' }), { status: 400, headers: corsHeaders });
    46	    }
    47	
    48	    const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? LIMIT 1').bind(userId).first<any>();
    49	    if (!user) {
    50	      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
    51	    }
    52	
    53	    if (String(user.id) === String(admin.id)) {
    54	      return new Response(JSON.stringify({ success: false, error: 'Não é possível excluir o próprio admin' }), { status: 400, headers: corsHeaders });
    55	    }
    56	
    57	    const operations = [
    58	      ['DELETE FROM referral_earnings WHERE referrer_id = ? OR referred_id = ?', userId, userId],
    59	      ['DELETE FROM cashback_earnings WHERE user_id = ?', userId],
    60	      ['DELETE FROM referrals WHERE referrer_id = ? OR referred_id = ?', userId, userId],
    61	      ['DELETE FROM referral_codes WHERE user_id = ?', userId],
    62	      ['DELETE FROM user_presence_activity WHERE user_id = ?', userId],
    63	      ['DELETE FROM user_presence WHERE user_id = ?', userId],
    64	      ['DELETE FROM notifications WHERE user_id = ?', userId],
    65	      ['DELETE FROM sessions WHERE user_id = ?', userId],
    66	      ['DELETE FROM transactions WHERE user_id = ?', userId],
    67	      ['DELETE FROM documentos WHERE user_id = ?', userId],
    68	      ['DELETE FROM attestations WHERE user_id = ?', userId],
    69	      ['DELETE FROM receitas WHERE user_id = ?', userId],
    70	      ['DELETE FROM documents WHERE user_id = ?', userId],
    71	      ['DELETE FROM users WHERE id = ?', userId],
    72	    ] as const;
    73	
    74	    for (const entry of operations) {
    75	      const [sql, ...binds] = entry as unknown as [string, ...any[]];
    76	      try {
    77	        await env.DB.prepare(sql).bind(...binds).run();
    78	      } catch {}
    79	    }
    80	
    81	    await logAdminAction(env, admin.id, 'hard_delete_user', userId, {
    82	      username: user.username,
    83	      cascade: ['documents', 'transactions', 'sessions', 'presence', 'referrals'],
    84	    });
    85	
    86	    return new Response(JSON.stringify({ success: true, message: 'Usuário excluído em cascata' }), { headers: corsHeaders });
    87	  } catch (error: any) {
    88	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
    89	  }
    90	};
    91	
    92	export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
    93	