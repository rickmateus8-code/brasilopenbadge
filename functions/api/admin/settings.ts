     1	import type { Env } from '../../types';
     2	
     3	const JSON_HEADERS = {
     4	  'Content-Type': 'application/json',
     5	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     6	  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
     7	  'Access-Control-Allow-Headers': 'Content-Type',
     8	  'Access-Control-Allow-Credentials': 'true',
     9	};
    10	
    11	const SETTING_DEFAULTS: Record<string, string> = {
    12	  site_name: 'DocMaster',
    13	  support_whatsapp: '',
    14	  max_documents_per_day: '100',
    15	  auto_delete_days: '60',
    16	  maintenance_mode: 'false',
    17	  auto_delete_atestado: '60',
    18	  auto_delete_receita: '60',
    19	  auto_delete_cnh: '365',
    20	  auto_delete_cha: '60',
    21	  auto_delete_toxicologico: '60',
    22	  auto_delete_historico: '90',
    23	};
    24	
    25	const ALLOWED_KEYS = Object.keys(SETTING_DEFAULTS);
    26	
    27	function getSessionToken(request: Request): string | null {
    28	  const cookie = request.headers.get('Cookie') || '';
    29	  const match = cookie.match(/docmaster_session=([^;]+)/);
    30	  return match ? match[1] : null;
    31	}
    32	
    33	async function getAdminUser(request: Request, env: Env) {
    34	  const token = getSessionToken(request);
    35	  if (!token) return null;
    36	  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
    37	  if (!session) return null;
    38	  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
    39	  return user?.role === 'admin' ? user : null;
    40	}
    41	
    42	async function ensureSettingsTable(env: Env) {
    43	  await env.DB.prepare(`
    44	    CREATE TABLE IF NOT EXISTS system_settings (
    45	      key TEXT PRIMARY KEY,
    46	      value TEXT NOT NULL,
    47	      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    48	    )
    49	  `).run();
    50	
    51	  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    52	    await env.DB.prepare('INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
    53	      .bind(key, value).run();
    54	  }
    55	}
    56	
    57	async function logAdminAction(env: Env, adminId: string, action: string, details: any) {
    58	  try {
    59	    await env.DB.prepare(`
    60	      INSERT INTO admin_logs (id, admin_id, action, target_type, details, created_at)
    61	      VALUES (?, ?, ?, 'settings', ?, datetime('now'))
    62	    `).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details)).run();
    63	  } catch {}
    64	}
    65	
    66	export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    67	  const admin = await getAdminUser(request, env);
    68	  if (!admin) {
    69	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
    70	  }
    71	
    72	  try {
    73	    await ensureSettingsTable(env);
    74	    const result = await env.DB.prepare(
    75	      `SELECT key, value FROM system_settings WHERE key IN (${ALLOWED_KEYS.map(() => '?').join(', ')})`
    76	    ).bind(...ALLOWED_KEYS).all<{ key: string; value: string }>();
    77	
    78	    const settings: Record<string, string | boolean> = { ...SETTING_DEFAULTS, maintenance_mode: false };
    79	    for (const row of result.results || []) {
    80	      settings[row.key] = row.key === 'maintenance_mode' ? row.value === 'true' : row.value;
    81	    }
    82	
    83	    return new Response(JSON.stringify({ success: true, settings }), { headers: JSON_HEADERS });
    84	  } catch (error: any) {
    85	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
    86	  }
    87	};
    88	
    89	export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    90	  const admin = await getAdminUser(request, env);
    91	  if (!admin) {
    92	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
    93	  }
    94	
    95	  try {
    96	    await ensureSettingsTable(env);
    97	    const body = await request.json<Record<string, any>>().catch(() => ({}));
    98	    const saved: Record<string, string> = {};
    99	
   100	    for (const [key, value] of Object.entries(body)) {
   101	      if (!ALLOWED_KEYS.includes(key)) continue;
   102	      const stringValue = typeof value === 'boolean' ? String(value) : String(value ?? '');
   103	      await env.DB.prepare(
   104	        'INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))'
   105	      ).bind(key, stringValue).run();
   106	      saved[key] = stringValue;
   107	    }
   108	
   109	    await logAdminAction(env, admin.id, 'update_settings', saved);
   110	    return new Response(JSON.stringify({ success: true, settings: saved }), { headers: JSON_HEADERS });
   111	  } catch (error: any) {
   112	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
   113	  }
   114	};
   115	
   116	export const onRequestPut = onRequestPost;
   117	
   118	export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: JSON_HEADERS });
   119	