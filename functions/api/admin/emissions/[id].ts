     1	import type { Env } from '../../../types';
     2	
     3	const corsHeaders = {
     4	  'Access-Control-Allow-Origin': 'https://docmaster.store',
     5	  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
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
    30	async function logAdminAction(env: Env, adminId: string, action: string, targetType: string, targetId: string, details: any) {
    31	  try {
    32	    await env.DB.prepare(`
    33	      INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at)
    34	      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    35	    `).bind(crypto.randomUUID(), adminId, action, targetType, targetId, JSON.stringify(details)).run();
    36	  } catch {}
    37	}
    38	
    39	function resolveSource(source: string | null) {
    40	  if (source === 'attestations') return { table: 'attestations', type: 'atestado', editPath: (id: string) => `/atestado/editar/${id}?admin=1` };
    41	  if (source === 'receitas') return { table: 'receitas', type: 'receita', editPath: (id: string) => `/receita/editar/${id}?admin=1` };
    42	  return { table: 'documents', type: 'document', editPath: (id: string, docType?: string) => `/${docType || 'documents'}/editar/${id}?admin=1` };
    43	}
    44	
    45	function parseData(value: any) {
    46	  if (!value) return {};
    47	  if (typeof value === 'object') return value;
    48	  try { return JSON.parse(value); } catch { return {}; }
    49	}
    50	
    51	export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
    52	  try {
    53	    const admin = await getAuthAdmin(request, env);
    54	    if (!admin) {
    55	      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    56	    }
    57	
    58	    const url = new URL(request.url);
    59	    const source = resolveSource(url.searchParams.get('source'));
    60	    const docId = String(params.id || '');
    61	
    62	    const row = await env.DB.prepare(`SELECT * FROM ${source.table} WHERE id = ? LIMIT 1`).bind(docId).first<any>();
    63	    if (!row) {
    64	      return new Response(JSON.stringify({ success: false, error: 'Documento não encontrado' }), { status: 404, headers: corsHeaders });
    65	    }
    66	
    67	    const docType = row.type || source.type;
    68	    const payload = source.table === 'documents' ? parseData(row.data) : row;
    69	
    70	    return new Response(JSON.stringify({
    71	      success: true,
    72	      source: source.table,
    73	      document_type: docType,
    74	      document: row,
    75	      payload,
    76	      edit_path: source.table === 'documents' ? source.editPath(docId, docType) : source.editPath(docId),
    77	    }), { headers: corsHeaders });
    78	  } catch (err: any) {
    79	    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
    80	  }
    81	};
    82	
    83	export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
    84	  try {
    85	    const admin = await getAuthAdmin(request, env);
    86	    if (!admin) {
    87	      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    88	    }
    89	
    90	    const docId = String(params.id || '');
    91	    const url = new URL(request.url);
    92	    const source = resolveSource(url.searchParams.get('source'));
    93	    const hardDelete = url.searchParams.get('hard') === 'true';
    94	
    95	    const existing = await env.DB.prepare(`SELECT id, status, user_id${source.table === 'documents' ? ', type' : ''} FROM ${source.table} WHERE id = ? LIMIT 1`).bind(docId).first<any>();
    96	    if (!existing) {
    97	      return new Response(JSON.stringify({ success: false, error: 'Documento não encontrado' }), { status: 404, headers: corsHeaders });
    98	    }
    99	
   100	    if (hardDelete) {
   101	      await env.DB.prepare(`DELETE FROM ${source.table} WHERE id = ?`).bind(docId).run();
   102	    } else {
   103	      await env.DB.prepare(`UPDATE ${source.table} SET status = 'cancelado' WHERE id = ?`).bind(docId).run();
   104	    }
   105	
   106	    await logAdminAction(
   107	      env,
   108	      admin.id,
   109	      hardDelete ? 'hard_delete_emission' : 'cancel_emission',
   110	      source.table,
   111	      docId,
   112	      {
   113	        source: source.table,
   114	        hard_delete: hardDelete,
   115	        target_user_id: existing.user_id,
   116	        document_type: existing.type || source.type,
   117	      }
   118	    );
   119	
   120	    return new Response(JSON.stringify({
   121	      success: true,
   122	      message: hardDelete ? 'Documento excluído permanentemente' : 'Documento cancelado com sucesso',
   123	    }), { headers: corsHeaders });
   124	  } catch (err: any) {
   125	    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   126	  }
   127	};
   128	
   129	export const onRequestOptions: PagesFunction = async () => {
   130	  return new Response(null, { headers: corsHeaders });
   131	};
   132	