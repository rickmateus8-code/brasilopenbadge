     1	import type { Env } from '../../../../types';
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
    17	async function getAuthAdmin(request: Request, env: Env) {
    18	  const token = getSessionToken(request);
    19	  if (!token) return null;
    20	  const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first<{ user_id: string }>();
    21	  if (!session) return null;
    22	  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1 LIMIT 1').bind(session.user_id).first<any>();
    23	  return user?.role === 'admin' ? user : null;
    24	}
    25	
    26	function parseData(value: any) {
    27	  if (!value) return {};
    28	  if (typeof value === 'object') return value;
    29	  try { return JSON.parse(value); } catch { return {}; }
    30	}
    31	
    32	export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
    33	  try {
    34	    const admin = await getAuthAdmin(request, env);
    35	    if (!admin) {
    36	      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    37	    }
    38	
    39	    const userId = String(params.id || '');
    40	    if (!userId) {
    41	      return new Response(JSON.stringify({ success: false, error: 'Invalid user ID' }), { status: 400, headers: corsHeaders });
    42	    }
    43	
    44	    const attestations = await env.DB.prepare(`
    45	      SELECT id, 'atestado' AS type, paciente AS nome, status, codigo_qr, created_at, data_emissao
    46	      FROM attestations WHERE user_id = ?
    47	      ORDER BY created_at DESC LIMIT 20
    48	    `).bind(userId).all<any>();
    49	
    50	    const receitas = await env.DB.prepare(`
    51	      SELECT id, 'receita' AS type, paciente AS nome, status, codigo_qr, created_at, data_emissao
    52	      FROM receitas WHERE user_id = ?
    53	      ORDER BY created_at DESC LIMIT 20
    54	    `).bind(userId).all<any>();
    55	
    56	    const documents = await env.DB.prepare(`
    57	      SELECT id, type, data, status, codigo_qr, created_at
    58	      FROM documents WHERE user_id = ?
    59	      ORDER BY created_at DESC LIMIT 40
    60	    `).bind(userId).all<any>();
    61	
    62	    const transactions = await env.DB.prepare(`
    63	      SELECT id, type, amount, description, created_at, document_type, document_id
    64	      FROM transactions WHERE user_id = ?
    65	      ORDER BY created_at DESC LIMIT 30
    66	    `).bind(userId).all<any>();
    67	
    68	    const referralsAsReferrer = await env.DB.prepare(`
    69	      SELECT r.id, r.status, r.created_at, u.username AS referred_username,
    70	             COALESCE((SELECT SUM(earned_amount) FROM referral_earnings re WHERE re.referrer_id = r.referrer_id AND re.referred_id = r.referred_id), 0) AS total_earned
    71	      FROM referrals r
    72	      JOIN users u ON u.id = r.referred_id
    73	      WHERE r.referrer_id = ?
    74	      ORDER BY r.created_at DESC
    75	      LIMIT 20
    76	    `).bind(userId).all<any>();
    77	
    78	    const referralsAsReferred = await env.DB.prepare(`
    79	      SELECT r.id, r.status, r.created_at, u.username AS referrer_username
    80	      FROM referrals r
    81	      JOIN users u ON u.id = r.referrer_id
    82	      WHERE r.referred_id = ?
    83	      ORDER BY r.created_at DESC
    84	      LIMIT 20
    85	    `).bind(userId).all<any>();
    86	
    87	    const documentHistory = [
    88	      ...(attestations.results || []),
    89	      ...(receitas.results || []),
    90	      ...((documents.results || []).map((row: any) => {
    91	        const data = parseData(row.data);
    92	        return {
    93	          id: row.id,
    94	          type: row.type,
    95	          nome: data.nome || data.nomeCompleto || data.paciente || '—',
    96	          status: row.status,
    97	          codigo_qr: row.codigo_qr,
    98	          created_at: row.created_at,
    99	          data_emissao: data.dataEmissao || data.data_emissao || data.emissao || data.data_expedicao_historico || row.created_at,
   100	        };
   101	      })),
   102	    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
   103	
   104	    return new Response(JSON.stringify({
   105	      success: true,
   106	      history: documentHistory,
   107	      details: {
   108	        documents: documentHistory,
   109	        transactions: transactions.results || [],
   110	        referrals: {
   111	          as_referrer: referralsAsReferrer.results || [],
   112	          as_referred: referralsAsReferred.results || [],
   113	        },
   114	        summary: {
   115	          total_documents: documentHistory.length,
   116	          total_transactions: (transactions.results || []).length,
   117	          total_referrals: (referralsAsReferrer.results || []).length,
   118	        },
   119	      },
   120	    }), { headers: corsHeaders });
   121	  } catch (error: any) {
   122	    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro interno' }), { status: 500, headers: corsHeaders });
   123	  }
   124	};
   125	
   126	export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });
   127	