/**
 * /api/admin/emissions — GET: Lista TODAS as emissões de TODOS os tipos
 * Combina attestations, receitas e documents em uma lista unificada
 */
import type { Env } from '../../types';

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/docmaster_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getAuthAdmin(request: Request, env: Env): Promise<any | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<any>();
  if (!session) return null;
  const user = await env.DB.prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(session.user_id).first<any>();
  if (!user || user.role !== 'admin') return null;
  return user;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://docmaster.store',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '200');

    const allEmissions: any[] = [];

    // 1. Attestations
    if (typeFilter === 'all' || typeFilter === 'atestado') {
      try {
        const atts = await env.DB.prepare(`
          SELECT a.id, a.user_id, a.paciente, a.cpf, a.codigo_qr, a.status, a.created_at, a.data,
                 u.username
          FROM attestations a
          LEFT JOIN users u ON CAST(a.user_id AS TEXT) = CAST(u.id AS TEXT)
          ORDER BY a.created_at DESC
          LIMIT ?
        `).bind(limit).all<any>();
        for (const a of (atts.results || [])) {
          let parsedData: any = {};
          try { if (a.data) parsedData = JSON.parse(a.data); } catch {}
          allEmissions.push({
            id: a.id,
            user_id: a.user_id,
            username: a.username || '—',
            nome: a.paciente || parsedData.paciente || '—',
            type: 'atestado',
            status: a.status || 'emitido',
            codigo_qr: a.codigo_qr || '',
            created_at: a.created_at,
            table_source: 'attestations',
          });
        }
      } catch (e) { console.error('Error loading attestations:', e); }
    }

    // 2. Receitas
    if (typeFilter === 'all' || typeFilter === 'receita') {
      try {
        const recs = await env.DB.prepare(`
          SELECT r.id, r.user_id, r.paciente, r.cpf, r.codigo_qr, r.status, r.created_at, r.data,
                 u.username
          FROM receitas r
          LEFT JOIN users u ON CAST(r.user_id AS TEXT) = CAST(u.id AS TEXT)
          ORDER BY r.created_at DESC
          LIMIT ?
        `).bind(limit).all<any>();
        for (const r of (recs.results || [])) {
          let parsedData: any = {};
          try { if (r.data) parsedData = JSON.parse(r.data); } catch {}
          allEmissions.push({
            id: r.id,
            user_id: r.user_id,
            username: r.username || '—',
            nome: r.paciente || parsedData.paciente || '—',
            type: 'receita',
            status: r.status || 'emitido',
            codigo_qr: r.codigo_qr || '',
            created_at: r.created_at,
            table_source: 'receitas',
          });
        }
      } catch (e) { console.error('Error loading receitas:', e); }
    }

    // 3. Documents (CNH, CHA, Toxicológico, Históricos, Toxicria, Laudocria)
    const docTypes = ['cnh', 'cha', 'toxicologico', 'historico-sp', 'historico-uninter', 'toxicria', 'laudocria'];
    if (typeFilter === 'all' || docTypes.includes(typeFilter)) {
      try {
        let docSql = `
          SELECT d.id, d.user_id, d.type, d.data, d.codigo_qr, d.status, d.created_at,
                 u.username
          FROM documents d
          LEFT JOIN users u ON CAST(d.user_id AS TEXT) = CAST(u.id AS TEXT)
        `;
        if (typeFilter !== 'all') {
          docSql += ` WHERE d.type = ?`;
        }
        docSql += ` ORDER BY d.created_at DESC LIMIT ?`;

        const docs = typeFilter !== 'all'
          ? await env.DB.prepare(docSql).bind(typeFilter, limit).all<any>()
          : await env.DB.prepare(docSql).bind(limit).all<any>();

        for (const d of (docs.results || [])) {
          let parsedData: any = {};
          try { if (d.data) parsedData = JSON.parse(d.data); } catch {}
          allEmissions.push({
            id: d.id,
            user_id: d.user_id,
            username: d.username || '—',
            nome: parsedData.nome || parsedData.paciente || parsedData.nomeCompleto || '—',
            type: d.type,
            status: d.status || 'emitido',
            codigo_qr: d.codigo_qr || '',
            created_at: d.created_at,
            table_source: 'documents',
          });
        }
      } catch (e) { console.error('Error loading documents:', e); }
    }

    // Sort by created_at DESC
    allEmissions.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });

    return new Response(JSON.stringify({
      success: true,
      emissions: allEmissions.slice(0, limit),
      total: allEmissions.length,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
