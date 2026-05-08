interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (context.request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const id = context.params.id as string;

  try {
    // Search in documents table by validation_id or codigo_qr
    let doc = await context.env.DB.prepare(
      `SELECT * FROM documents WHERE validation_id = ? OR codigo_qr = ? OR id = ? LIMIT 1`
    ).bind(id, id, id).first();

    if (!doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the data field
    let docData: any = {};
    if (doc.data) {
      try {
        docData = JSON.parse(doc.data as string);
      } catch (e) {
        docData = {};
      }
    }

    // Return the relevant fields for validation display
    const response = {
      data: {
        // Campos CNH/Gerais
        nome: doc.nome || docData.nome || '',
        cpf: doc.cpf || docData.cpf || '',
        rg: docData.rg || '',
        orgao_emissor: docData.orgaoEmissor || docData.orgao_emissor || '',
        uf_rg: docData.ufRg || docData.uf_rg || '',
        data_nascimento: docData.dataNascimento || docData.data_nascimento || '',
        registro: docData.registro || '',
        espelho: docData.espelho || '',
        categoria: doc.categoria || docData.categoria || '',
        local_emissao: docData.localEmissao || docData.local_emissao || '',
        uf_emissao: docData.ufEmissao || docData.uf_emissao || '',
        emissao: docData.emissao || '',
        foto: docData.foto || '',
        
        // Campos Petição / Processo
        credor: docData.credor || doc.nome || '',
        advogado: docData.advogado || '',
        contra: docData.contra || '',
        valor: docData.valor || '',
        processo: docData.processo || doc.codigo_qr || '',
        data_documento: docData.data || '',
        alvara_numero: docData.alvara_numero || '',
        telefone: docData.telefone || '',

        status: doc.status || 'emitido',
        created_at: doc.created_at || '',
        type: doc.type || ''
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
