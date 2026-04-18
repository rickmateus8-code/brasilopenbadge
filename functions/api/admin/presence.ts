     1	import type { Env } from '../../types';
     2	
     3	const corsHeaders = {
     4	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     5	  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    17	async function getAuthAdmin(request: Request, env: Env): Promise<any | null> {
    18	  const token = getSessionToken(request);
    19	  if (!token) return null;
    20	  const session = await env.DB.prepare(
    21	    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    22	  ).bind(token).first<any>();
    23	  if (!session) return null;
    24	  const user = await env.DB.prepare(
    25	    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
    26	  ).bind(session.user_id).first<any>();
    27	  return user?.role === 'admin' ? user : null;
    28	}
    29	
    30	async function ensurePresenceTables(env: Env) {
    31	  await env.DB.prepare(`
    32	    CREATE TABLE IF NOT EXISTS user_presence (
    33	      user_id TEXT PRIMARY KEY,
    34	      current_page TEXT DEFAULT '/dashboard',
    35	      current_action TEXT DEFAULT 'navegando',
    36	      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    37	      is_online INTEGER NOT NULL DEFAULT 0,
    38	      session_id TEXT,
    39	      session_started_at TEXT,
    40	      first_seen TEXT,
    41	      current_page_started_at TEXT,
    42	      current_activity_id TEXT,
    43	      ip_address TEXT,
    44	      user_agent TEXT,
    45	      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    46	    )
    47	  `).run();
    48	
    49	  await env.DB.prepare(`
    50	    CREATE TABLE IF NOT EXISTS user_presence_activity (
    51	      id TEXT PRIMARY KEY,
    52	      user_id TEXT NOT NULL,
    53	      session_id TEXT,
    54	      page_path TEXT NOT NULL,
    55	      action TEXT,
    56	      started_at TEXT NOT NULL,
    57	      ended_at TEXT,
    58	      duration_seconds INTEGER NOT NULL DEFAULT 0,
    59	      activity_meta TEXT,
    60	      created_at TEXT NOT NULL DEFAULT (datetime('now')),
    61	      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    62	    )
    63	  `).run();
    64	
    65	  const alterStatements = [
    66	    'ALTER TABLE user_presence ADD COLUMN session_id TEXT',
    67	    'ALTER TABLE user_presence ADD COLUMN session_started_at TEXT',
    68	    'ALTER TABLE user_presence ADD COLUMN first_seen TEXT',
    69	    'ALTER TABLE user_presence ADD COLUMN current_page_started_at TEXT',
    70	    'ALTER TABLE user_presence ADD COLUMN current_activity_id TEXT',
    71	    'ALTER TABLE user_presence ADD COLUMN ip_address TEXT',
    72	    'ALTER TABLE user_presence ADD COLUMN user_agent TEXT',
    73	  ];
    74	  for (const sql of alterStatements) {
    75	    try { await env.DB.prepare(sql).run(); } catch {}
    76	  }
    77	  try { await env.DB.prepare('ALTER TABLE users ADD COLUMN profile_photo TEXT').run(); } catch {}
    78	
    79	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen)').run();
    80	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online)').run();
    81	  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_activity_user_started ON user_presence_activity(user_id, started_at DESC)').run();
    82	}
    83	
    84	export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    85	  try {
    86	    const admin = await getAuthAdmin(request, env);
    87	    if (!admin) {
    88	      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    89	    }
    90	
    91	    await ensurePresenceTables(env);
    92	
    93	    const staleBefore = new Date(Date.now() - 75 * 1000).toISOString();
    94	    await env.DB.prepare(
    95	      'UPDATE user_presence SET is_online = 0 WHERE last_seen < ?'
    96	    ).bind(staleBefore).run();
    97	
    98	    const usersResult = await env.DB.prepare(`
    99	      SELECT
   100	        u.id AS user_id,
   101	        u.username,
   102	        u.email,
   103	        u.role,
   104	        u.balance,
   105	        u.profile_photo,
   106	        u.created_at AS user_created_at,
   107	        COALESCE(up.is_online, 0) AS is_online,
   108	        COALESCE(up.current_page, '') AS current_page,
   109	        COALESCE(up.current_action, '') AS current_action,
   110	        up.last_seen,
   111	        up.first_seen,
   112	        up.session_id,
   113	        up.session_started_at,
   114	        up.current_page_started_at,
   115	        up.current_activity_id,
   116	        up.ip_address,
   117	        up.user_agent
   118	      FROM users u
   119	      LEFT JOIN user_presence up ON CAST(u.id AS TEXT) = CAST(up.user_id AS TEXT)
   120	      WHERE u.is_active = 1
   121	      ORDER BY COALESCE(up.is_online, 0) DESC, COALESCE(up.last_seen, u.created_at) DESC
   122	    `).all<any>();
   123	
   124	    const activityResult = await env.DB.prepare(`
   125	      SELECT id, user_id, session_id, page_path, action, started_at, ended_at, duration_seconds, activity_meta
   126	      FROM user_presence_activity
   127	      ORDER BY started_at DESC
   128	      LIMIT 2000
   129	    `).all<any>();
   130	
   131	    const now = Date.now();
   132	    const activityByUser = new Map<string, any[]>();
   133	
   134	    for (const row of activityResult.results || []) {
   135	      const endTs = row.ended_at ? new Date(row.ended_at).getTime() : now;
   136	      const startTs = row.started_at ? new Date(row.started_at).getTime() : now;
   137	      const computedDuration = Math.max(0, Math.floor((endTs - startTs) / 1000));
   138	      const item = {
   139	        ...row,
   140	        ended_at: row.ended_at || null,
   141	        duration_seconds: row.duration_seconds ? Number(row.duration_seconds) : computedDuration,
   142	        activity_meta: row.activity_meta ? (() => { try { return JSON.parse(row.activity_meta); } catch { return null; } })() : null,
   143	      };
   144	      const bucket = activityByUser.get(String(row.user_id)) || [];
   145	      if (bucket.length < 20) {
   146	        bucket.push(item);
   147	        activityByUser.set(String(row.user_id), bucket);
   148	      }
   149	    }
   150	
   151	    const results = (usersResult.results || []).map((row: any) => {
   152	      const timeline = (activityByUser.get(String(row.user_id)) || []).sort((a, b) =>
   153	        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
   154	      );
   155	
   156	      const totalsMap = new Map<string, number>();
   157	      for (const item of timeline) {
   158	        totalsMap.set(item.page_path, (totalsMap.get(item.page_path) || 0) + Number(item.duration_seconds || 0));
   159	      }
   160	
   161	      const page_totals = Array.from(totalsMap.entries())
   162	        .map(([page, duration_seconds]) => ({ page, duration_seconds }))
   163	        .sort((a, b) => b.duration_seconds - a.duration_seconds);
   164	
   165	      const sessionStartedAt = row.session_started_at || row.first_seen || row.last_seen || null;
   166	      const pageStartedAt = row.current_page_started_at || sessionStartedAt || row.last_seen || null;
   167	      const sessionDurationSeconds = sessionStartedAt ? Math.max(0, Math.floor((now - new Date(sessionStartedAt).getTime()) / 1000)) : 0;
   168	      const currentPageDurationSeconds = pageStartedAt ? Math.max(0, Math.floor((now - new Date(pageStartedAt).getTime()) / 1000)) : 0;
   169	
   170	      return {
   171	        ...row,
   172	        timeline,
   173	        page_totals,
   174	        total_session_seconds: sessionDurationSeconds,
   175	        current_page_duration_seconds: currentPageDurationSeconds,
   176	      };
   177	    });
   178	
   179	    const onlineCount = results.filter((item: any) => item.is_online === 1).length;
   180	
   181	    return new Response(JSON.stringify({
   182	      success: true,
   183	      presence: results,
   184	      online_count: onlineCount,
   185	      offline_count: results.length - onlineCount,
   186	      total_users: results.length,
   187	    }), { headers: corsHeaders });
   188	  } catch (err: any) {
   189	    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   190	  }
   191	};
   192	
   193	export const onRequestOptions: PagesFunction = async () => {
   194	  return new Response(null, { headers: corsHeaders });
   195	};
   196	