     1	import type { Env } from '../../types';
     2	
     3	const corsHeaders = {
     4	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     5	  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
     6	  'Access-Control-Allow-Headers': 'Content-Type',
     7	  'Access-Control-Allow-Credentials': 'true',
     8	  'Content-Type': 'application/json',
     9	};
    10	
    11	const DEFAULT_RETENTION = {
    12	  atestado: 60,
    13	  receita: 60,
    14	  cnh: 365,
    15	  cha: 60,
    16	  toxicologico: 60,
    17	  historico: 90,
    18	} as const;
    19	
    20	function getSessionToken(request: Request): string | null {
    21	  const cookie = request.headers.get('Cookie') || '';
    22	  const match = cookie.match(/docmaster_session=([^;]+)/);
    23	  return match ? match[1] : null;
    24	}
    25	
    26	async function getAdminUser(request: Request, env: Env) {
    27	  const token = getSessionToken(request);
    28	  if (!token) return null;
    29	  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
    30	  if (!session) return null;
    31	  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
    32	  return user?.role === 'admin' ? user : null;
    33	}
    34	
    35	async function ensureSettingsTable(env: Env) {
    36	  await env.DB.prepare(`
    37	    CREATE TABLE IF NOT EXISTS system_settings (
    38	      key TEXT PRIMARY KEY,
    39	      value TEXT NOT NULL,
    40	      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    41	    )
    42	  `).run();
    43	
    44	  const defaults: Record<string, string> = {
    45	    auto_delete_atestado: String(DEFAULT_RETENTION.atestado),
    46	    auto_delete_receita: String(DEFAULT_RETENTION.receita),
    47	    auto_delete_cnh: String(DEFAULT_RETENTION.cnh),
    48	    auto_delete_cha: String(DEFAULT_RETENTION.cha),
    49	    auto_delete_toxicologico: String(DEFAULT_RETENTION.toxicologico),
    50	    auto_delete_historico: String(DEFAULT_RETENTION.historico),
    51	  };
    52	
    53	  for (const [key, value] of Object.entries(defaults)) {
    54	    await env.DB.prepare('INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))').bind(key, value).run();
    55	  }
    56	}
    57	
    58	async function logAdminAction(env: Env, adminId: string, action: string, details: any) {
    59	  try {
    60	    await env.DB.prepare(`
    61	      INSERT INTO admin_logs (id, admin_id, action, target_type, details, created_at)
    62	      VALUES (?, ?, ?, 'cleanup', ?, datetime('now'))
    63	    `).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details)).run();
    64	  } catch {}
    65	}
    66	
    67	async function getRetentionDays(env: Env) {
    68	  await ensureSettingsTable(env);
    69	  const keys = [
    70	    'auto_delete_atestado',
    71	    'auto_delete_receita',
    72	    'auto_delete_cnh',
    73	    'auto_delete_cha',
    74	    'auto_delete_toxicologico',
    75	    'auto_delete_historico',
    76	  ];
    77	  const rows = await env.DB.prepare(
    78	    `SELECT key, value FROM system_settings WHERE key IN (${keys.map(() => '?').join(', ')})`
    79	  ).bind(...keys).all<{ key: string; value: string }>();
    80	
    81	  const map = Object.fromEntries((rows.results || []).map(row => [row.key, Number(row.value)]));
    82	  return {
    83	    atestado: map.auto_delete_atestado || DEFAULT_RETENTION.atestado,
    84	    receita: map.auto_delete_receita || DEFAULT_RETENTION.receita,
    85	    cnh: map.auto_delete_cnh || DEFAULT_RETENTION.cnh,
    86	    cha: map.auto_delete_cha || DEFAULT_RETENTION.cha,
    87	    toxicologico: map.auto_delete_toxicologico || DEFAULT_RETENTION.toxicologico,
    88	    historico: map.auto_delete_historico || DEFAULT_RETENTION.historico,
    89	  };
    90	}
    91	
    92	function normalizeDateExpression(expression: string) {
    93	  return `CASE
    94	    WHEN ${expression} IS NULL OR TRIM(${expression}) = '' THEN NULL
    95	    WHEN ${expression} LIKE '__/__/____' THEN substr(${expression}, 7, 4) || '-' || substr(${expression}, 4, 2) || '-' || substr(${expression}, 1, 2)
    96	    WHEN ${expression} LIKE '____-__-__%' THEN substr(${expression}, 1, 10)
    97	    ELSE NULL
    98	  END`;
    99	}
   100	
   101	async function countDocuments(env: Env, sql: string, binds: any[]) {
   102	  const row = await env.DB.prepare(sql).bind(...binds).first<{ count: number }>();
   103	  return Number(row?.count || 0);
   104	}
   105	
   106	async function runDelete(env: Env, sql: string, binds: any[]) {
   107	  const result = await env.DB.prepare(sql).bind(...binds).run();
   108	  return Number(result.meta?.changes || 0);
   109	}
   110	
   111	async function buildPreview(env: Env) {
   112	  const retention = await getRetentionDays(env);
   113	  const docDate = normalizeDateExpression(`COALESCE(
   114	    json_extract(data, '$.dataEmissao'),
   115	    json_extract(data, '$.data_emissao'),
   116	    json_extract(data, '$.emissao'),
   117	    json_extract(data, '$.data_expedicao_historico')
   118	  )`);
   119	
   120	  const preview = {
   121	    atestado: await countDocuments(
   122	      env,
   123	      `SELECT COUNT(*) AS count FROM attestations WHERE ${normalizeDateExpression('data_emissao')} IS NOT NULL AND date(${normalizeDateExpression('data_emissao')}) < date('now', ?)` ,
   124	      [`-${retention.atestado} days`]
   125	    ),
   126	    receita: await countDocuments(
   127	      env,
   128	      `SELECT COUNT(*) AS count FROM receitas WHERE ${normalizeDateExpression('data_emissao')} IS NOT NULL AND date(${normalizeDateExpression('data_emissao')}) < date('now', ?)` ,
   129	      [`-${retention.receita} days`]
   130	    ),
   131	    cnh: await countDocuments(
   132	      env,
   133	      `SELECT COUNT(*) AS count FROM documents WHERE type = 'cnh' AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   134	      [`-${retention.cnh} days`]
   135	    ),
   136	    cha: await countDocuments(
   137	      env,
   138	      `SELECT COUNT(*) AS count FROM documents WHERE type = 'cha' AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   139	      [`-${retention.cha} days`]
   140	    ),
   141	    toxicologico: await countDocuments(
   142	      env,
   143	      `SELECT COUNT(*) AS count FROM documents WHERE type IN ('toxicologico', 'toxicria', 'laudocria') AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   144	      [`-${retention.toxicologico} days`]
   145	    ),
   146	    historico: await countDocuments(
   147	      env,
   148	      `SELECT COUNT(*) AS count FROM documents WHERE type IN ('historico-sp', 'historico-uninter') AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   149	      [`-${retention.historico} days`]
   150	    ),
   151	  };
   152	
   153	  return {
   154	    retention_days: retention,
   155	    pendingDeletion: {
   156	      ...preview,
   157	      total: Object.values(preview).reduce((sum, value) => sum + Number(value || 0), 0),
   158	    },
   159	  };
   160	}
   161	
   162	export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
   163	  const admin = await getAdminUser(request, env);
   164	  if (!admin) {
   165	    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
   166	  }
   167	
   168	  try {
   169	    const preview = await buildPreview(env);
   170	    return new Response(JSON.stringify({ success: true, ...preview }), { headers: corsHeaders });
   171	  } catch (error: any) {
   172	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   173	  }
   174	};
   175	
   176	export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
   177	  const admin = await getAdminUser(request, env);
   178	  if (!admin) {
   179	    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
   180	  }
   181	
   182	  try {
   183	    const preview = await buildPreview(env);
   184	    const retention = preview.retention_days;
   185	    const docDate = normalizeDateExpression(`COALESCE(
   186	      json_extract(data, '$.dataEmissao'),
   187	      json_extract(data, '$.data_emissao'),
   188	      json_extract(data, '$.emissao'),
   189	      json_extract(data, '$.data_expedicao_historico')
   190	    )`);
   191	
   192	    const deleted = {
   193	      atestado: await runDelete(
   194	        env,
   195	        `DELETE FROM attestations WHERE ${normalizeDateExpression('data_emissao')} IS NOT NULL AND date(${normalizeDateExpression('data_emissao')}) < date('now', ?)` ,
   196	        [`-${retention.atestado} days`]
   197	      ),
   198	      receita: await runDelete(
   199	        env,
   200	        `DELETE FROM receitas WHERE ${normalizeDateExpression('data_emissao')} IS NOT NULL AND date(${normalizeDateExpression('data_emissao')}) < date('now', ?)` ,
   201	        [`-${retention.receita} days`]
   202	      ),
   203	      cnh: await runDelete(
   204	        env,
   205	        `DELETE FROM documents WHERE type = 'cnh' AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   206	        [`-${retention.cnh} days`]
   207	      ),
   208	      cha: await runDelete(
   209	        env,
   210	        `DELETE FROM documents WHERE type = 'cha' AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   211	        [`-${retention.cha} days`]
   212	      ),
   213	      toxicologico: await runDelete(
   214	        env,
   215	        `DELETE FROM documents WHERE type IN ('toxicologico', 'toxicria', 'laudocria') AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   216	        [`-${retention.toxicologico} days`]
   217	      ),
   218	      historico: await runDelete(
   219	        env,
   220	        `DELETE FROM documents WHERE type IN ('historico-sp', 'historico-uninter') AND ${docDate} IS NOT NULL AND date(${docDate}) < date('now', ?)` ,
   221	        [`-${retention.historico} days`]
   222	      ),
   223	    };
   224	
   225	    const total = Object.values(deleted).reduce((sum, value) => sum + Number(value || 0), 0);
   226	    await logAdminAction(env, admin.id, 'run_cleanup', { deleted, retention_days: retention, preview: preview.pendingDeletion });
   227	
   228	    return new Response(JSON.stringify({
   229	      success: true,
   230	      message: `Limpeza concluída. ${total} documentos excluídos.`,
   231	      deleted: { ...deleted, total },
   232	      retention_days: retention,
   233	    }), { headers: corsHeaders });
   234	  } catch (error: any) {
   235	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   236	  }
   237	};
   238	
   239	export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
   240	