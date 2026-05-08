/**
 * /api/verificar — GET
 * Verifica se um código de CNH existe no banco e retorna dados públicos
 */
interface Env {
  DB: D1Database;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: CORS });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id') || url.searchParams.get('codigo') || '';

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'Código não informado' }), {
        status: 400, headers: CORS,
      });
    }

    const doc = await context.env.DB.prepare(
      `SELECT id, nome, cpf, categoria, status, created_at, codigo_validacao, codigo_qr
       FROM documents WHERE type = 'cnh'
       AND (codigo_validacao = ? OR codigo_qr = ? OR id = ?)
       LIMIT 1`
    ).bind(id, id, id).first() as any;

    if (!doc) {
      return new Response(JSON.stringify({ success: false, message: 'Documento não encontrado' }), {
        status: 404, headers: CORS,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      valido: doc.status === 'emitido',
      nome: doc.nome || '',
      categoria: doc.categoria || '',
      emitidoEm: doc.created_at || '',
      codigo: doc.codigo_validacao || doc.codigo_qr || doc.id,
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: 'Erro interno' }), {
      status: 500, headers: CORS,
    });
  }
};
