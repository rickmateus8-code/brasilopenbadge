/**
 * /api/admin/pricing — Gestão de preços dos documentos
 *
 * GET  → Lista todos os preços (admin)
 * POST → Upsert de um único preço (admin)
 * PUT  → Atualização em lote de preços (admin)
 */
import type { Env } from '../../types';

// Dados iniciais de preços — usados quando a tabela está vazia
const DEFAULT_PRICING = [
  { document_type: 'atestado',           display_name: 'Atestado Médico',          price: 500  },
  { document_type: 'cnh',                display_name: 'CNH Digital',               price: 1000 },
  { document_type: 'cha',                display_name: 'CHA Náutica',               price: 1000 },
  { document_type: 'toxicologico',       display_name: 'Exame Toxicológico',        price: 800  },
  { document_type: 'toxicria',           display_name: 'Laudo Toxicológico Sodré',  price: 800  },
  { document_type: 'historico-sp',       display_name: 'Histórico Escolar SP',      price: 600  },
  { document_type: 'historico-uninter',  display_name: 'Histórico UNINTER',         price: 600  },
  { document_type: 'receita',            display_name: 'Receituário Médico',        price: 400  },
];

async function ensurePricingTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS document_pricing (
        document_type TEXT PRIMARY KEY,
        display_name  TEXT NOT NULL,
        price         INTEGER NOT NULL DEFAULT 0,
        is_active     INTEGER NOT NULL DEFAULT 1,
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Inserir defaults apenas se a tabela estiver vazia
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM document_pricing'
    ).first<{ cnt: number }>();

    if (!count || count.cnt === 0) {
      for (const item of DEFAULT_PRICING) {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO document_pricing (document_type, display_name, price, is_active, updated_at)
           VALUES (?, ?, ?, 1, datetime('now'))`
        ).bind(item.document_type, item.display_name, item.price).run();
      }
    }
  } catch (_) { /* tabela pode já existir */ }
}

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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    await ensurePricingTable(env);

    const pricing = await env.DB.prepare(
      'SELECT document_type, display_name, price, is_active, updated_at FROM document_pricing ORDER BY display_name'
    ).all<any>();

    return new Response(JSON.stringify({
      success: true,
      pricing: pricing.results || []
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const { document_type, price, display_name, is_active } = body;

    if (!document_type || price === undefined) {
      return new Response(JSON.stringify({ success: false, error: 'document_type e price são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    const priceInt = Math.round(Number(price));
    if (isNaN(priceInt) || priceInt < 0) {
      return new Response(JSON.stringify({ success: false, error: 'Preço inválido' }), { status: 400, headers: corsHeaders });
    }

    await ensurePricingTable(env);

    // Upsert pricing — inclui display_name para permitir renomear documentos
    await env.DB.prepare(
      `INSERT INTO document_pricing (document_type, display_name, price, is_active, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(document_type) DO UPDATE SET
         display_name = excluded.display_name,
         price        = excluded.price,
         is_active    = excluded.is_active,
         updated_at   = datetime('now')`
    ).bind(document_type, display_name || document_type, priceInt, is_active !== false ? 1 : 0).run();

    // Log action
    try {
      const logId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
      ).bind(logId, admin.id, 'update_pricing', 'pricing', document_type, JSON.stringify({ price: priceInt, display_name })).run();
    } catch (_) {}

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await getAuthAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as any;
    const { prices } = body; // Array of { document_type, price, is_active }

    if (!prices || !Array.isArray(prices)) {
      return new Response(JSON.stringify({ success: false, error: 'Formato inválido: envie { prices: [...] }' }), { status: 400, headers: corsHeaders });
    }

    await ensurePricingTable(env);

    let updated = 0;
    for (const p of prices) {
      if (!p.document_type) continue;
      const priceInt = Math.round(Number(p.price));
      if (isNaN(priceInt) || priceInt < 0) continue;

      // Upsert completo — inclui display_name para permitir renomear documentos
      await env.DB.prepare(
        `INSERT INTO document_pricing (document_type, display_name, price, is_active, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(document_type) DO UPDATE SET
           display_name = excluded.display_name,
           price        = excluded.price,
           is_active    = excluded.is_active,
           updated_at   = datetime('now')`
      ).bind(
        p.document_type,
        p.display_name || p.document_type,
        priceInt,
        p.is_active !== false ? 1 : 0
      ).run();
      updated++;
    }

    // Log the action
    try {
      const logId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO admin_logs (id, admin_id, action, target_type, details, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
      ).bind(logId, admin.id, 'update_pricing_bulk', 'pricing', JSON.stringify({ count: updated })).run();
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, message: `${updated} preço(s) atualizado(s) com sucesso!` }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
