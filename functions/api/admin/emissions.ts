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
    30	function safeJsonParse(value: any) {
    31	  if (!value) return {};
    32	  if (typeof value === 'object') return value;
    33	  try { return JSON.parse(value); } catch { return {}; }
    34	}
    35	
    36	function getDocumentName(type: string, data: any, fallback?: string) {
    37	  if (fallback) return fallback;
    38	  return data.nome || data.nomeCompleto || data.paciente || data.nome_paciente || '—';
    39	}
    40	
    41	function getDocumentEmissionDate(type: string, row: any, data: any) {
    42	  if (type === 'atestado' || type === 'receita') {
    43	    return row.data_emissao || row.created_at;
    44	  }
    45	
    46	  return data.dataEmissao || data.data_emissao || data.emissao || data.data_expedicao_historico || row.created_at;
    47	}
    48	
    49	export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    50	  try {
    51	    const admin = await getAuthAdmin(request, env);
    52	    if (!admin) {
    53	      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    54	    }
    55	
    56	    const url = new URL(request.url);
    57	    const typeFilter = url.searchParams.get('type') || 'all';
    58	    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10) || 500, 2000);
    59	
    60	    const emissions: any[] = [];
    61	
    62	    if (typeFilter === 'all' || typeFilter === 'atestado') {
    63	      const result = await env.DB.prepare(`
    64	        SELECT a.id, a.user_id, a.paciente, a.codigo_qr, a.status, a.created_at, a.data_emissao,
    65	               u.username, u.email
    66	        FROM attestations a
    67	        LEFT JOIN users u ON CAST(a.user_id AS TEXT) = CAST(u.id AS TEXT)
    68	        ORDER BY COALESCE(a.data_emissao, a.created_at) DESC
    69	        LIMIT ?
    70	      `).bind(limit).all<any>();
    71	
    72	      for (const row of result.results || []) {
    73	        emissions.push({
    74	          id: row.id,
    75	          emission_id: row.id,
    76	          user_id: row.user_id,
    77	          username: row.username || '—',
    78	          email: row.email || '',
    79	          nome: row.paciente || '—',
    80	          type: 'atestado',
    81	          status: row.status || 'emitido',
    82	          codigo_qr: row.codigo_qr || '',
    83	          created_at: row.created_at,
    84	          emission_date: row.data_emissao || row.created_at,
    85	          table_source: 'attestations',
    86	          preview_endpoint: `/api/admin/emissions/${row.id}?source=attestations`,
    87	          edit_path: `/atestado/editar/${row.id}?admin=1`,
    88	        });
    89	      }
    90	    }
    91	
    92	    if (typeFilter === 'all' || typeFilter === 'receita') {
    93	      const result = await env.DB.prepare(`
    94	        SELECT r.id, r.user_id, r.paciente, r.codigo_qr, r.status, r.created_at, r.data_emissao,
    95	               u.username, u.email
    96	        FROM receitas r
    97	        LEFT JOIN users u ON CAST(r.user_id AS TEXT) = CAST(u.id AS TEXT)
    98	        ORDER BY COALESCE(r.data_emissao, r.created_at) DESC
    99	        LIMIT ?
   100	      `).bind(limit).all<any>();
   101	
   102	      for (const row of result.results || []) {
   103	        emissions.push({
   104	          id: row.id,
   105	          emission_id: row.id,
   106	          user_id: row.user_id,
   107	          username: row.username || '—',
   108	          email: row.email || '',
   109	          nome: row.paciente || '—',
   110	          type: 'receita',
   111	          status: row.status || 'emitido',
   112	          codigo_qr: row.codigo_qr || '',
   113	          created_at: row.created_at,
   114	          emission_date: row.data_emissao || row.created_at,
   115	          table_source: 'receitas',
   116	          preview_endpoint: `/api/admin/emissions/${row.id}?source=receitas`,
   117	          edit_path: `/receita/editar/${row.id}?admin=1`,
   118	        });
   119	      }
   120	    }
   121	
   122	    const documentTypes = ['cnh', 'cha', 'toxicologico', 'toxicria', 'laudocria', 'historico-sp', 'historico-uninter'];
   123	    if (typeFilter === 'all' || documentTypes.includes(typeFilter)) {
   124	      let sql = `
   125	        SELECT d.id, d.user_id, d.type, d.data, d.codigo_qr, d.status, d.created_at,
   126	               u.username, u.email
   127	        FROM documents d
   128	        LEFT JOIN users u ON CAST(d.user_id AS TEXT) = CAST(u.id AS TEXT)
   129	      `;
   130	
   131	      const bindings: any[] = [];
   132	      if (typeFilter !== 'all') {
   133	        sql += ' WHERE d.type = ?';
   134	        bindings.push(typeFilter);
   135	      }
   136	      sql += ' ORDER BY d.created_at DESC LIMIT ?';
   137	      bindings.push(limit);
   138	
   139	      const result = await env.DB.prepare(sql).bind(...bindings).all<any>();
   140	      for (const row of result.results || []) {
   141	        const data = safeJsonParse(row.data);
   142	        emissions.push({
   143	          id: row.id,
   144	          emission_id: row.id,
   145	          user_id: row.user_id,
   146	          username: row.username || '—',
   147	          email: row.email || '',
   148	          nome: getDocumentName(row.type, data),
   149	          type: row.type,
   150	          status: row.status || 'emitido',
   151	          codigo_qr: row.codigo_qr || '',
   152	          created_at: row.created_at,
   153	          emission_date: getDocumentEmissionDate(row.type, row, data),
   154	          table_source: 'documents',
   155	          preview_endpoint: `/api/admin/emissions/${row.id}?source=documents`,
   156	          edit_path: `/${row.type}/editar/${row.id}?admin=1`,
   157	        });
   158	      }
   159	    }
   160	
   161	    emissions.sort((a, b) => new Date(b.created_at || b.emission_date || 0).getTime() - new Date(a.created_at || a.emission_date || 0).getTime());
   162	
   163	    return new Response(JSON.stringify({
   164	      success: true,
   165	      emissions: emissions.slice(0, limit),
   166	      total: emissions.length,
   167	    }), { headers: corsHeaders });
   168	  } catch (err: any) {
   169	    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   170	  }
   171	};
   172	
   173	export const onRequestOptions: PagesFunction = async () => {
   174	  return new Response(null, { headers: corsHeaders });
   175	};
   176	