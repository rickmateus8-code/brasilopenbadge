     1	import type { Env } from '../types';
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
    17	async function getAuthUser(env: Env, request: Request) {
    18	  const token = getSessionToken(request);
    19	  if (!token) return null;
    20	
    21	  const session = await env.DB.prepare(
    22	    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1'
    23	  ).bind(token).first<{ user_id: string }>();
    24	
    25	  if (!session) return null;
    26	
    27	  return env.DB.prepare(
    28	    'SELECT id, username, role, balance, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1'
    29	  ).bind(session.user_id).first<any>();
    30	}
    31	
    32	async function ensurePresenceTables(env: Env) {
    33	  await env.DB.prepare(`
    34	    CREATE TABLE IF NOT EXISTS user_presence (
    35	      user_id TEXT PRIMARY KEY,
    36	      current_page TEXT DEFAULT '/dashboard',
    37	      current_action TEXT DEFAULT 'navegando',
    38	      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    39	      is_online INTEGER NOT NULL DEFAULT 0,
    40	      session_id TEXT,
    41	      session_started_at TEXT,
    42	      first_seen TEXT,
    43	      current_page_started_at TEXT,
    44	      current_activity_id TEXT,
    45	      ip_address TEXT,
    46	      user_agent TEXT,
    47	      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    48	    )
    49	  `).run();
    50	
    51	  await env.DB.prepare(`
    52	    CREATE TABLE IF NOT EXISTS user_presence_activity (
    53	      id TEXT PRIMARY KEY,
    54	      user_id TEXT NOT NULL,
    55	      session_id TEXT,
    56	      page_path TEXT NOT NULL,
    57	      action TEXT,
    58	      started_at TEXT NOT NULL,
    59	      ended_at TEXT,
    60	      duration_seconds INTEGER NOT NULL DEFAULT 0,
    61	      activity_meta TEXT,
    62	      created_at TEXT NOT NULL DEFAULT (datetime('now')),
    63	      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    64	    )
    65	  `).run();
    66	
    67	  const alterStatements = [
    68	    'ALTER TABLE user_presence ADD COLUMN session_id TEXT',
    69	    'ALTER TABLE user_presence ADD COLUMN session_started_at TEXT',
    70	    'ALTER TABLE user_presence ADD COLUMN first_seen TEXT',
    71	    'ALTER TABLE user_presence ADD COLUMN current_page_started_at TEXT',
    72	    'ALTER TABLE user_presence ADD COLUMN current_activity_id TEXT',
    73	    'ALTER TABLE user_presence ADD COLUMN ip_address TEXT',
    74	    'ALTER TABLE user_presence ADD COLUMN user_agent TEXT',
    75	  ];
    76	
    77	  for (const sql of alterStatements) {
    78	    try { await env.DB.prepare(sql).run(); } catch {}
    79	  }
    80	
    81	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen)').run();
    82	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online)').run();
    83	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_activity_user_started ON user_presence_activity(user_id, started_at DESC)').run();
    84	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_activity_session ON user_presence_activity(session_id)').run();
    85	}
    86	
    87	export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    88	  try {
    89	    const user = await getAuthUser(env, request);
    90	    if (!user) {
    91	      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { status: 401, headers: corsHeaders });
    92	    }
    93	
    94	    await ensurePresenceTables(env);
    95	
    96	    const body = await request.json<any>().catch(() => ({}));
    97	    const now = typeof body?.timestamp === 'string' && body.timestamp ? body.timestamp : new Date().toISOString();
    98	    const currentPage = typeof body?.current_page === 'string' && body.current_page ? body.current_page : '/dashboard';
    99	    const currentAction = typeof body?.current_action === 'string' && body.current_action ? body.current_action : 'navegando';
   100	    const sessionId = typeof body?.session_id === 'string' && body.session_id ? body.session_id : crypto.randomUUID();
   101	    const activityMeta = body?.meta ? JSON.stringify(body.meta) : null;
   102	    const userAgent = request.headers.get('User-Agent') || null;
   103	    const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || null;
   104	
   105	    const existing = await env.DB.prepare(
   106	      'SELECT * FROM user_presence WHERE user_id = ? LIMIT 1'
   107	    ).bind(user.id).first<any>();
   108	
   109	    const lastSeenTs = existing?.last_seen ? new Date(existing.last_seen).getTime() : 0;
   110	    const timedOut = !lastSeenTs || (Date.now() - lastSeenTs) > 5 * 60 * 1000;
   111	    const isNewSession = !existing || timedOut || existing.session_id !== sessionId;
   112	    const pageChanged = !existing || existing.current_page !== currentPage;
   113	    const actionChanged = !existing || existing.current_action !== currentAction;
   114	    const shouldRotateActivity = isNewSession || pageChanged || actionChanged;
   115	
   116	    if (existing?.current_activity_id) {
   117	      await env.DB.prepare(`
   118	        UPDATE user_presence_activity
   119	        SET ended_at = ?,
   120	            duration_seconds = MAX(0, CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER))
   121	        WHERE id = ?
   122	      `).bind(now, now, existing.current_activity_id).run();
   123	    }
   124	
   125	    let currentActivityId = existing?.current_activity_id || null;
   126	    let pageStartedAt = existing?.current_page_started_at || existing?.session_started_at || now;
   127	    const sessionStartedAt = isNewSession ? now : (existing?.session_started_at || now);
   128	    const firstSeen = isNewSession ? now : (existing?.first_seen || existing?.session_started_at || now);
   129	
   130	    if (shouldRotateActivity) {
   131	      currentActivityId = crypto.randomUUID();
   132	      pageStartedAt = now;
   133	
   134	      await env.DB.prepare(`
   135	        INSERT INTO user_presence_activity (
   136	          id, user_id, session_id, page_path, action, started_at, ended_at, duration_seconds, activity_meta, created_at
   137	        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
   138	      `).bind(
   139	        currentActivityId,
   140	        user.id,
   141	        sessionId,
   142	        currentPage,
   143	        currentAction,
   144	        now,
   145	        now,
   146	        activityMeta,
   147	        now,
   148	      ).run();
   149	    } else if (currentActivityId) {
   150	      await env.DB.prepare(`
   151	        UPDATE user_presence_activity
   152	        SET ended_at = ?,
   153	            duration_seconds = MAX(0, CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER)),
   154	            activity_meta = COALESCE(?, activity_meta)
   155	        WHERE id = ?
   156	      `).bind(now, now, activityMeta, currentActivityId).run();
   157	    }
   158	
   159	    await env.DB.prepare(`
   160	      INSERT INTO user_presence (
   161	        user_id, current_page, current_action, last_seen, is_online,
   162	        session_id, session_started_at, first_seen, current_page_started_at,
   163	        current_activity_id, ip_address, user_agent
   164	      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
   165	      ON CONFLICT(user_id) DO UPDATE SET
   166	        current_page = excluded.current_page,
   167	        current_action = excluded.current_action,
   168	        last_seen = excluded.last_seen,
   169	        is_online = 1,
   170	        session_id = excluded.session_id,
   171	        session_started_at = excluded.session_started_at,
   172	        first_seen = excluded.first_seen,
   173	        current_page_started_at = excluded.current_page_started_at,
   174	        current_activity_id = excluded.current_activity_id,
   175	        ip_address = COALESCE(excluded.ip_address, user_presence.ip_address),
   176	        user_agent = COALESCE(excluded.user_agent, user_presence.user_agent)
   177	    `).bind(
   178	      user.id,
   179	      currentPage,
   180	      currentAction,
   181	      now,
   182	      sessionId,
   183	      sessionStartedAt,
   184	      firstSeen,
   185	      pageStartedAt,
   186	      currentActivityId,
   187	      ipAddress,
   188	      userAgent,
   189	    ).run();
   190	
   191	    const balanceRow = await env.DB.prepare(
   192	      'SELECT balance FROM users WHERE id = ? LIMIT 1'
   193	    ).bind(user.id).first<{ balance: number }>();
   194	
   195	    return new Response(JSON.stringify({
   196	      success: true,
   197	      balance: balanceRow?.balance ?? 0,
   198	      session_id: sessionId,
   199	    }), { headers: corsHeaders });
   200	  } catch (err: any) {
   201	    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   202	  }
   203	};
   204	
   205	export const onRequestOptions: PagesFunction = async () => {
   206	  return new Response(null, { headers: corsHeaders });
   207	};
   208	