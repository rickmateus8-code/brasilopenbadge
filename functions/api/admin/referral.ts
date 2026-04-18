     1	import type { Env } from '../../types';
     2	
     3	const JSON_HEADERS = {
     4	  'Content-Type': 'application/json',
     5	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     6	  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     7	  'Access-Control-Allow-Headers': 'Content-Type',
     8	  'Access-Control-Allow-Credentials': 'true',
     9	};
    10	
    11	function getSessionToken(request: Request): string | null {
    12	  const cookie = request.headers.get('Cookie') || '';
    13	  const match = cookie.match(/docmaster_session=([^;]+)/);
    14	  return match ? match[1] : null;
    15	}
    16	
    17	async function getAdminSession(request: Request, env: Env) {
    18	  const token = getSessionToken(request);
    19	  if (!token) return null;
    20	
    21	  const session = await env.DB.prepare(`
    22	    SELECT s.user_id, u.username, u.role
    23	    FROM sessions s
    24	    JOIN users u ON u.id = s.user_id
    25	    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    26	    LIMIT 1
    27	  `).bind(token).first<any>();
    28	
    29	  return session?.role === 'admin' ? session : null;
    30	}
    31	
    32	async function ensureReferralTables(env: Env) {
    33	  const statements = [
    34	    `CREATE TABLE IF NOT EXISTS referral_codes (
    35	      id TEXT PRIMARY KEY,
    36	      user_id TEXT NOT NULL UNIQUE,
    37	      code TEXT NOT NULL UNIQUE,
    38	      created_at TEXT NOT NULL DEFAULT (datetime('now')),
    39	      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    40	    )`,
    41	    `CREATE TABLE IF NOT EXISTS referrals (
    42	      id TEXT PRIMARY KEY,
    43	      referrer_id TEXT NOT NULL,
    44	      referred_id TEXT NOT NULL UNIQUE,
    45	      status TEXT NOT NULL DEFAULT 'active',
    46	      created_at TEXT NOT NULL DEFAULT (datetime('now')),
    47	      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    48	      FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
    49	    )`,
    50	    `CREATE TABLE IF NOT EXISTS referral_earnings (
    51	      id TEXT PRIMARY KEY,
    52	      referrer_id TEXT NOT NULL,
    53	      referred_id TEXT NOT NULL,
    54	      deposit_amount REAL NOT NULL DEFAULT 0,
    55	      percentage REAL NOT NULL DEFAULT 0,
    56	      earned_amount REAL NOT NULL DEFAULT 0,
    57	      deposit_transaction_id TEXT,
    58	      created_at TEXT NOT NULL DEFAULT (datetime('now')),
    59	      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    60	      FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
    61	    )`,
    62	    `CREATE TABLE IF NOT EXISTS cashback_earnings (
    63	      id TEXT PRIMARY KEY,
    64	      user_id TEXT NOT NULL,
    65	      deposit_amount REAL NOT NULL DEFAULT 0,
    66	      percentage REAL NOT NULL DEFAULT 0,
    67	      cashback_amount REAL NOT NULL DEFAULT 0,
    68	      deposit_transaction_id TEXT,
    69	      created_at TEXT NOT NULL DEFAULT (datetime('now')),
    70	      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    71	    )`,
    72	    `CREATE TABLE IF NOT EXISTS referral_settings (
    73	      key TEXT PRIMARY KEY,
    74	      value TEXT NOT NULL,
    75	      description TEXT,
    76	      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    77	    )`,
    78	    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('referral_percentage', '10', 'Percentual global de indicação')`,
    79	    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('cashback_percentage', '5', 'Percentual global de cashback')`,
    80	    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('referral_enabled', 'true', 'Sistema de indicação habilitado')`,
    81	    `INSERT OR IGNORE INTO referral_settings (key, value, description) VALUES ('cashback_enabled', 'true', 'Sistema de cashback habilitado')`,
    82	    `CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)`,
    83	    `CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id)`,
    84	    `CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_id, created_at DESC)`,
    85	    `CREATE INDEX IF NOT EXISTS idx_cashback_earnings_user ON cashback_earnings(user_id, created_at DESC)`,
    86	    `CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id)`,
    87	  ];
    88	
    89	  for (const sql of statements) {
    90	    try { await env.DB.prepare(sql).run(); } catch {}
    91	  }
    92	
    93	  const userAlterStatements = [
    94	    'ALTER TABLE users ADD COLUMN referred_by TEXT',
    95	    'ALTER TABLE users ADD COLUMN referral_code TEXT',
    96	    'ALTER TABLE users ADD COLUMN referral_percentage REAL',
    97	    'ALTER TABLE users ADD COLUMN cashback_percentage REAL',
    98	  ];
    99	  for (const sql of userAlterStatements) {
   100	    try { await env.DB.prepare(sql).run(); } catch {}
   101	  }
   102	}
   103	
   104	async function logAdminAction(env: Env, adminId: string, action: string, details: any) {
   105	  try {
   106	    await env.DB.prepare(
   107	      `INSERT INTO admin_logs (id, admin_id, action, target_type, details, created_at)
   108	       VALUES (?, ?, ?, 'referral', ?, datetime('now'))`
   109	    ).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details)).run();
   110	  } catch {}
   111	}
   112	
   113	function settingsArrayToObject(items: Array<{ key: string; value: string }>) {
   114	  return items.reduce<Record<string, string>>((acc, item) => {
   115	    acc[item.key] = item.value;
   116	    return acc;
   117	  }, {});
   118	}
   119	
   120	export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
   121	  try {
   122	    const session = await getAdminSession(request, env);
   123	    if (!session) {
   124	      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
   125	    }
   126	
   127	    await ensureReferralTables(env);
   128	
   129	    const url = new URL(request.url);
   130	    const tab = url.searchParams.get('tab') || 'overview';
   131	
   132	    const settingsRows = await env.DB.prepare(
   133	      `SELECT key, value FROM referral_settings WHERE key IN ('referral_percentage', 'cashback_percentage', 'referral_enabled', 'cashback_enabled')`
   134	    ).all<{ key: string; value: string }>();
   135	    const settings = settingsArrayToObject(settingsRows.results || []);
   136	
   137	    if (tab === 'overview') {
   138	      const totals = await env.DB.prepare(`
   139	        SELECT
   140	          (SELECT COUNT(*) FROM referrals) AS total_referrals,
   141	          (SELECT COALESCE(SUM(earned_amount), 0) FROM referral_earnings) AS total_referral_earnings,
   142	          (SELECT COALESCE(SUM(cashback_amount), 0) FROM cashback_earnings) AS total_cashback_paid,
   143	          (SELECT COUNT(*) FROM referral_codes) AS active_codes,
   144	          (SELECT COUNT(DISTINCT referrer_id) FROM referrals) AS active_referrers
   145	      `).first<any>();
   146	
   147	      const earningsByReferrer = await env.DB.prepare(`
   148	        SELECT
   149	          r.referrer_id,
   150	          u.username AS referrer_username,
   151	          COALESCE(SUM(re.earned_amount), 0) AS total_earned,
   152	          COUNT(DISTINCT r.referred_id) AS total_referred,
   153	          MAX(re.created_at) AS last_earning_at
   154	        FROM referrals r
   155	        JOIN users u ON u.id = r.referrer_id
   156	        LEFT JOIN referral_earnings re ON re.referrer_id = r.referrer_id
   157	        GROUP BY r.referrer_id, u.username
   158	        ORDER BY total_earned DESC, total_referred DESC
   159	        LIMIT 50
   160	      `).all<any>();
   161	
   162	      return new Response(JSON.stringify({
   163	        success: true,
   164	        totalReferrals: Number(totals?.total_referrals || 0),
   165	        totalReferralEarnings: Number(totals?.total_referral_earnings || 0),
   166	        totalCashbackPaid: Number(totals?.total_cashback_paid || 0),
   167	        activeCodes: Number(totals?.active_codes || 0),
   168	        activeReferrers: Number(totals?.active_referrers || 0),
   169	        settings: settingsRows.results || [],
   170	        earningsByReferrer: earningsByReferrer.results || [],
   171	      }), { headers: JSON_HEADERS });
   172	    }
   173	
   174	    if (tab === 'referrals') {
   175	      const referrals = await env.DB.prepare(`
   176	        SELECT
   177	          r.id,
   178	          r.created_at,
   179	          r.status,
   180	          ru.username AS referrer_username,
   181	          uu.username AS referred_username,
   182	          COALESCE(SUM(re.earned_amount), 0) AS commission_earned,
   183	          COALESCE(MAX(re.percentage), ru.referral_percentage, 0) AS commission_percentage
   184	        FROM referrals r
   185	        JOIN users ru ON ru.id = r.referrer_id
   186	        JOIN users uu ON uu.id = r.referred_id
   187	        LEFT JOIN referral_earnings re ON re.referrer_id = r.referrer_id AND re.referred_id = r.referred_id
   188	        GROUP BY r.id, r.created_at, r.status, ru.username, uu.username, ru.referral_percentage
   189	        ORDER BY r.created_at DESC
   190	        LIMIT 500
   191	      `).all<any>();
   192	
   193	      return new Response(JSON.stringify({ success: true, referrals: referrals.results || [] }), { headers: JSON_HEADERS });
   194	    }
   195	
   196	    if (tab === 'earnings') {
   197	      const earnings = await env.DB.prepare(`
   198	        SELECT
   199	          re.id,
   200	          re.created_at,
   201	          re.deposit_amount,
   202	          re.percentage,
   203	          re.earned_amount,
   204	          ru.username AS referrer_username,
   205	          uu.username AS referred_username
   206	        FROM referral_earnings re
   207	        JOIN users ru ON ru.id = re.referrer_id
   208	        JOIN users uu ON uu.id = re.referred_id
   209	        ORDER BY re.created_at DESC
   210	        LIMIT 500
   211	      `).all<any>();
   212	
   213	      const byReferrer = await env.DB.prepare(`
   214	        SELECT
   215	          re.referrer_id,
   216	          u.username AS referrer_username,
   217	          COUNT(*) AS earnings_count,
   218	          COALESCE(SUM(re.earned_amount), 0) AS total_earned,
   219	          COALESCE(SUM(re.deposit_amount), 0) AS total_deposit_base,
   220	          MAX(re.created_at) AS last_earning_at
   221	        FROM referral_earnings re
   222	        JOIN users u ON u.id = re.referrer_id
   223	        GROUP BY re.referrer_id, u.username
   224	        ORDER BY total_earned DESC
   225	        LIMIT 100
   226	      `).all<any>();
   227	
   228	      return new Response(JSON.stringify({ success: true, earnings: earnings.results || [], byReferrer: byReferrer.results || [] }), { headers: JSON_HEADERS });
   229	    }
   230	
   231	    if (tab === 'cashback') {
   232	      const cashback = await env.DB.prepare(`
   233	        SELECT
   234	          ce.id,
   235	          ce.created_at,
   236	          ce.deposit_amount,
   237	          ce.percentage,
   238	          ce.cashback_amount,
   239	          u.username AS user_name,
   240	          u.email AS user_email
   241	        FROM cashback_earnings ce
   242	        JOIN users u ON u.id = ce.user_id
   243	        ORDER BY ce.created_at DESC
   244	        LIMIT 500
   245	      `).all<any>();
   246	
   247	      return new Response(JSON.stringify({ success: true, cashback: cashback.results || [] }), { headers: JSON_HEADERS });
   248	    }
   249	
   250	    if (tab === 'users') {
   251	      const users = await env.DB.prepare(`
   252	        SELECT
   253	          u.id,
   254	          u.username,
   255	          u.email,
   256	          COALESCE(rc.code, u.referral_code) AS code,
   257	          u.referral_percentage,
   258	          u.cashback_percentage,
   259	          (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.id) AS total_referred,
   260	          (SELECT COALESCE(SUM(earned_amount), 0) FROM referral_earnings re WHERE re.referrer_id = u.id) AS total_earned,
   261	          (SELECT COALESCE(SUM(cashback_amount), 0) FROM cashback_earnings ce WHERE ce.user_id = u.id) AS total_cashback
   262	        FROM users u
   263	        LEFT JOIN referral_codes rc ON rc.user_id = u.id
   264	        ORDER BY u.username ASC
   265	        LIMIT 1000
   266	      `).all<any>();
   267	
   268	      return new Response(JSON.stringify({ success: true, users: users.results || [], settings: settingsRows.results || [] }), { headers: JSON_HEADERS });
   269	    }
   270	
   271	    return new Response(JSON.stringify({ success: false, error: 'Tab inválida' }), { status: 400, headers: JSON_HEADERS });
   272	  } catch (error: any) {
   273	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
   274	  }
   275	};
   276	
   277	export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
   278	  try {
   279	    const session = await getAdminSession(request, env);
   280	    if (!session) {
   281	      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
   282	    }
   283	
   284	    await ensureReferralTables(env);
   285	
   286	    const body = await request.json<any>().catch(() => ({}));
   287	    if (body.action !== 'link_manual') {
   288	      return new Response(JSON.stringify({ success: false, error: 'Ação inválida' }), { status: 400, headers: JSON_HEADERS });
   289	    }
   290	
   291	    const referrerId = String(body.referrer_id || '');
   292	    const referredId = String(body.referred_id || '');
   293	    if (!referrerId || !referredId) {
   294	      return new Response(JSON.stringify({ success: false, error: 'IDs obrigatórios' }), { status: 400, headers: JSON_HEADERS });
   295	    }
   296	    if (referrerId === referredId) {
   297	      return new Response(JSON.stringify({ success: false, error: 'Um usuário não pode indicar a si mesmo' }), { status: 400, headers: JSON_HEADERS });
   298	    }
   299	
   300	    const existing = await env.DB.prepare('SELECT id FROM referrals WHERE referred_id = ? LIMIT 1').bind(referredId).first();
   301	    if (existing) {
   302	      return new Response(JSON.stringify({ success: false, error: 'Este usuário já possui um indicador vinculado' }), { status: 409, headers: JSON_HEADERS });
   303	    }
   304	
   305	    await env.DB.prepare(
   306	      `INSERT INTO referrals (id, referrer_id, referred_id, status, created_at)
   307	       VALUES (?, ?, ?, 'active', datetime('now'))`
   308	    ).bind(crypto.randomUUID(), referrerId, referredId).run();
   309	    await env.DB.prepare('UPDATE users SET referred_by = ? WHERE id = ?').bind(referrerId, referredId).run();
   310	
   311	    await logAdminAction(env, session.user_id, 'link_referral_manual', { referrer_id: referrerId, referred_id: referredId });
   312	
   313	    return new Response(JSON.stringify({ success: true, message: 'Vínculo criado com sucesso' }), { headers: JSON_HEADERS });
   314	  } catch (error: any) {
   315	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
   316	  }
   317	};
   318	
   319	export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
   320	  try {
   321	    const session = await getAdminSession(request, env);
   322	    if (!session) {
   323	      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
   324	    }
   325	
   326	    await ensureReferralTables(env);
   327	
   328	    const body = await request.json<any>().catch(() => ({}));
   329	    const action = body.action;
   330	
   331	    if (action === 'update_global_settings') {
   332	      const updates = [
   333	        ['referral_percentage', body.referral_percentage],
   334	        ['cashback_percentage', body.cashback_percentage],
   335	        ['referral_enabled', body.referral_enabled],
   336	        ['cashback_enabled', body.cashback_enabled],
   337	      ].filter(([, value]) => value !== undefined);
   338	
   339	      for (const [key, value] of updates) {
   340	        await env.DB.prepare(
   341	          `INSERT OR REPLACE INTO referral_settings (key, value, description, updated_at)
   342	           VALUES (?, ?, COALESCE((SELECT description FROM referral_settings WHERE key = ?), ''), datetime('now'))`
   343	        ).bind(key, String(value), key).run();
   344	      }
   345	
   346	      await logAdminAction(env, session.user_id, 'update_referral_global_settings', Object.fromEntries(updates));
   347	      return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
   348	    }
   349	
   350	    if (action === 'update_user_settings') {
   351	      const userId = String(body.userId || body.user_id || '');
   352	      if (!userId) {
   353	        return new Response(JSON.stringify({ success: false, error: 'userId é obrigatório' }), { status: 400, headers: JSON_HEADERS });
   354	      }
   355	
   356	      await env.DB.prepare(`
   357	        UPDATE users
   358	        SET referral_percentage = ?, cashback_percentage = ?
   359	        WHERE id = ?
   360	      `).bind(
   361	        body.referral_percentage === null || body.referral_percentage === undefined || body.referral_percentage === '' ? null : Number(body.referral_percentage),
   362	        body.cashback_percentage === null || body.cashback_percentage === undefined || body.cashback_percentage === '' ? null : Number(body.cashback_percentage),
   363	        userId,
   364	      ).run();
   365	
   366	      await logAdminAction(env, session.user_id, 'update_user_referral_settings', {
   367	        user_id: userId,
   368	        referral_percentage: body.referral_percentage,
   369	        cashback_percentage: body.cashback_percentage,
   370	      });
   371	
   372	      return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
   373	    }
   374	
   375	    return new Response(JSON.stringify({ success: false, error: 'Ação inválida' }), { status: 400, headers: JSON_HEADERS });
   376	  } catch (error: any) {
   377	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
   378	  }
   379	};
   380	
   381	export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
   382	  try {
   383	    const session = await getAdminSession(request, env);
   384	    if (!session) {
   385	      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: JSON_HEADERS });
   386	    }
   387	
   388	    const url = new URL(request.url);
   389	    const clearType = url.searchParams.get('clear');
   390	
   391	    if (clearType === 'earnings') {
   392	      await env.DB.prepare('DELETE FROM referral_earnings').run();
   393	      await env.DB.prepare('DELETE FROM cashback_earnings').run();
   394	      await logAdminAction(env, session.user_id, 'clear_referral_earnings', {});
   395	      return new Response(JSON.stringify({ success: true, message: 'Ganhos limpos' }), { headers: JSON_HEADERS });
   396	    }
   397	
   398	    if (clearType === 'referrals') {
   399	      await env.DB.prepare('DELETE FROM referrals').run();
   400	      await logAdminAction(env, session.user_id, 'clear_referrals', {});
   401	      return new Response(JSON.stringify({ success: true, message: 'Indicações limpas' }), { headers: JSON_HEADERS });
   402	    }
   403	
   404	    return new Response(JSON.stringify({ success: false, error: 'Tipo de limpeza inválido' }), { status: 400, headers: JSON_HEADERS });
   405	  } catch (error: any) {
   406	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: JSON_HEADERS });
   407	  }
   408	};
   409	
   410	export const onRequestOptions: PagesFunction = async () => {
   411	  return new Response(null, { headers: JSON_HEADERS });
   412	};
   413	