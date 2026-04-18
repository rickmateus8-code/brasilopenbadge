     1	import type { Env } from '../../types';
     2	
     3	const corsHeaders = {
     4	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     5	  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    17	async function getAdminUser(request: Request, env: Env): Promise<any | null> {
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
    30	function generateId() {
    31	  return crypto.randomUUID();
    32	}
    33	
    34	async function hashPassword(password: string) {
    35	  const encoder = new TextEncoder();
    36	  const data = encoder.encode(password + 'docmaster_salt_2024');
    37	  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    38	  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    39	}
    40	
    41	async function ensureUserColumns(env: Env) {
    42	  const alters = [
    43	    'ALTER TABLE users ADD COLUMN plain_password TEXT',
    44	    'ALTER TABLE users ADD COLUMN display_name TEXT',
    45	    'ALTER TABLE users ADD COLUMN profile_photo TEXT',
    46	    'ALTER TABLE users ADD COLUMN referral_percentage REAL',
    47	    'ALTER TABLE users ADD COLUMN cashback_percentage REAL',
    48	  ];
    49	  for (const sql of alters) {
    50	    try { await env.DB.prepare(sql).run(); } catch {}
    51	  }
    52	}
    53	
    54	async function insertTransaction(env: Env, userId: string, type: 'credit' | 'debit', amount: number, description: string) {
    55	  try {
    56	    await env.DB.prepare(
    57	      `INSERT INTO transactions (id, user_id, type, amount, description, created_at)
    58	       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    59	    ).bind(generateId(), userId, type, amount, description).run();
    60	  } catch {
    61	    await env.DB.prepare(
    62	      'INSERT INTO transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
    63	    ).bind(userId, type, amount, description).run();
    64	  }
    65	}
    66	
    67	async function logAdminAction(env: Env, adminId: string, action: string, targetId: string, details: any) {
    68	  try {
    69	    await env.DB.prepare(
    70	      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
    71	       VALUES (?, ?, ?, 'user', ?, ?, datetime('now'))`
    72	    ).bind(generateId(), adminId, action, targetId, JSON.stringify(details)).run();
    73	  } catch {}
    74	}
    75	
    76	export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    77	  const admin = await getAdminUser(request, env);
    78	  if (!admin) {
    79	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
    80	  }
    81	
    82	  await ensureUserColumns(env);
    83	
    84	  const url = new URL(request.url);
    85	  const showPasswords = url.searchParams.get('show_passwords') === '1';
    86	  if (showPasswords) {
    87	    await logAdminAction(env, admin.id, 'view_passwords', 'all', { admin: admin.username });
    88	  }
    89	
    90	  const fields = [
    91	    'u.id',
    92	    'u.username',
    93	    'u.email',
    94	    'u.display_name',
    95	    'u.role',
    96	    'u.balance',
    97	    'u.is_active',
    98	    'u.created_at',
    99	    'u.profile_photo',
   100	    'u.referral_percentage',
   101	    'u.cashback_percentage',
   102	  ];
   103	  if (showPasswords) fields.push('u.plain_password');
   104	
   105	  const result = await env.DB.prepare(`
   106	    SELECT ${fields.join(', ')}
   107	    FROM users u
   108	    ORDER BY u.created_at DESC
   109	  `).all<any>();
   110	
   111	  const users = (result.results || []).map((user: any) => ({
   112	    ...user,
   113	    balance: Number(user.balance || 0),
   114	    is_active: Number(user.is_active || 0),
   115	  }));
   116	
   117	  return new Response(JSON.stringify({ success: true, users }), { headers: corsHeaders });
   118	};
   119	
   120	export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
   121	  const admin = await getAdminUser(request, env);
   122	  if (!admin) {
   123	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
   124	  }
   125	
   126	  try {
   127	    await ensureUserColumns(env);
   128	    const body = await request.json<any>();
   129	    const username = String(body.username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
   130	    const password = String(body.password || '');
   131	    const email = String(body.email || '').trim();
   132	    const displayName = String(body.display_name || username).trim();
   133	    const role = body.role === 'admin' ? 'admin' : 'user';
   134	    const balance = Number(body.balance || 0);
   135	
   136	    if (!username || !password) {
   137	      return new Response(JSON.stringify({ success: false, error: 'Username e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
   138	    }
   139	
   140	    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(username).first();
   141	    if (existing) {
   142	      return new Response(JSON.stringify({ success: false, error: 'Username já existe' }), { status: 409, headers: corsHeaders });
   143	    }
   144	
   145	    const id = generateId();
   146	    const passwordHash = await hashPassword(password);
   147	    await env.DB.prepare(`
   148	      INSERT INTO users (id, username, email, display_name, password_hash, plain_password, role, balance, is_active, created_at, updated_at)
   149	      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
   150	    `).bind(id, username, email, displayName, passwordHash, password, role, balance).run();
   151	
   152	    await logAdminAction(env, admin.id, 'create_user', id, { username, email, role, balance });
   153	    return new Response(JSON.stringify({ success: true, userId: id }), { status: 201, headers: corsHeaders });
   154	  } catch (error: any) {
   155	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   156	  }
   157	};
   158	
   159	export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
   160	  const admin = await getAdminUser(request, env);
   161	  if (!admin) {
   162	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
   163	  }
   164	
   165	  try {
   166	    await ensureUserColumns(env);
   167	    const body = await request.json<any>();
   168	    const userId = String(body.user_id || body.userId || '');
   169	    if (!userId) {
   170	      return new Response(JSON.stringify({ success: false, error: 'user_id é obrigatório' }), { status: 400, headers: corsHeaders });
   171	    }
   172	
   173	    const user = await env.DB.prepare('SELECT id, username, balance, role, is_active FROM users WHERE id = ? LIMIT 1').bind(userId).first<any>();
   174	    if (!user) {
   175	      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
   176	    }
   177	
   178	    const changes: Record<string, any> = {};
   179	
   180	    if (body.new_password) {
   181	      const passwordHash = await hashPassword(String(body.new_password));
   182	      await env.DB.prepare('UPDATE users SET password_hash = ?, plain_password = ?, updated_at = datetime("now") WHERE id = ?')
   183	        .bind(passwordHash, String(body.new_password), userId).run();
   184	      changes.password = 'updated';
   185	    }
   186	
   187	    if (body.display_name !== undefined) {
   188	      await env.DB.prepare('UPDATE users SET display_name = ?, updated_at = datetime("now") WHERE id = ?')
   189	        .bind(String(body.display_name || ''), userId).run();
   190	      changes.display_name = body.display_name;
   191	    }
   192	
   193	    if (body.email !== undefined) {
   194	      await env.DB.prepare('UPDATE users SET email = ?, updated_at = datetime("now") WHERE id = ?')
   195	        .bind(String(body.email || ''), userId).run();
   196	      changes.email = body.email;
   197	    }
   198	
   199	    if (body.role !== undefined) {
   200	      const role = body.role === 'admin' ? 'admin' : 'user';
   201	      await env.DB.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?').bind(role, userId).run();
   202	      changes.role = role;
   203	    }
   204	
   205	    if (body.is_active !== undefined) {
   206	      const isActive = body.is_active ? 1 : 0;
   207	      await env.DB.prepare('UPDATE users SET is_active = ?, updated_at = datetime("now") WHERE id = ?').bind(isActive, userId).run();
   208	      changes.is_active = isActive;
   209	    }
   210	
   211	    if (body.balance !== undefined) {
   212	      const fixedBalance = Number(body.balance || 0);
   213	      if (fixedBalance < 0) {
   214	        return new Response(JSON.stringify({ success: false, error: 'Saldo inválido' }), { status: 400, headers: corsHeaders });
   215	      }
   216	      await env.DB.prepare('UPDATE users SET balance = ?, updated_at = datetime("now") WHERE id = ?').bind(fixedBalance, userId).run();
   217	      changes.balance = { mode: 'fixed', value: fixedBalance };
   218	    }
   219	
   220	    const adjustment = Number(body.balance_adjustment || 0);
   221	    if (body.balance_adjustment !== undefined && Number.isFinite(adjustment) && adjustment !== 0) {
   222	      const currentBalance = Number(user.balance || 0);
   223	      const nextBalance = currentBalance + adjustment;
   224	      if (nextBalance < 0) {
   225	        return new Response(JSON.stringify({ success: false, error: 'Saldo insuficiente para débito manual' }), { status: 400, headers: corsHeaders });
   226	      }
   227	
   228	      await env.DB.prepare('UPDATE users SET balance = ?, updated_at = datetime("now") WHERE id = ?').bind(nextBalance, userId).run();
   229	      const type = adjustment > 0 ? 'credit' : 'debit';
   230	      const description = adjustment > 0 ? 'Crédito manual pelo administrador' : 'Débito manual pelo administrador';
   231	      await insertTransaction(env, userId, type, Math.abs(adjustment), description);
   232	      changes.balance_adjustment = { old: currentBalance, amount: adjustment, new: nextBalance };
   233	    }
   234	
   235	    await logAdminAction(env, admin.id, 'update_user', userId, { username: user.username, changes });
   236	    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
   237	  } catch (error: any) {
   238	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   239	  }
   240	};
   241	
   242	export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
   243	  const admin = await getAdminUser(request, env);
   244	  if (!admin) {
   245	    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: corsHeaders });
   246	  }
   247	
   248	  try {
   249	    const url = new URL(request.url);
   250	    const userId = String(url.searchParams.get('user_id') || '');
   251	    if (!userId) {
   252	      return new Response(JSON.stringify({ success: false, error: 'user_id é obrigatório' }), { status: 400, headers: corsHeaders });
   253	    }
   254	
   255	    const user = await env.DB.prepare('SELECT id, username FROM users WHERE id = ? LIMIT 1').bind(userId).first<any>();
   256	    if (!user) {
   257	      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders });
   258	    }
   259	
   260	    if (String(user.id) === String(admin.id)) {
   261	      return new Response(JSON.stringify({ success: false, error: 'Não é possível excluir o próprio usuário admin' }), { status: 400, headers: corsHeaders });
   262	    }
   263	
   264	    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
   265	    await logAdminAction(env, admin.id, 'delete_user_legacy', userId, { username: user.username });
   266	
   267	    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
   268	  } catch (error: any) {
   269	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   270	  }
   271	};
   272	
   273	export const onRequestOptions: PagesFunction = async () => {
   274	  return new Response(null, { headers: corsHeaders });
   275	};
   276	