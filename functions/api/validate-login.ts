/**
 * /api/validate-login — POST
 * Valida credenciais CPF + senha contra documentos CNH emitidos
 * Usado pelo site clone (cnh-digital) para autenticação
 */
interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await context.request.json<{ cpf: string; senha: string }>();
    const { cpf, senha } = body;

    if (!cpf || !senha) {
      return new Response(JSON.stringify({ error: 'CPF e senha são obrigatórios.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Clean CPF (remove formatting)
    const cleanCPF = cpf.replace(/\D/g, '');

    // Search for CNH document matching CPF
    const doc = await context.env.DB.prepare(
      `SELECT * FROM documents WHERE type = 'cnh' AND status = 'emitido' AND (
        cpf = ? OR cpf = ? OR cpf LIKE ? OR cpf LIKE ?
      ) ORDER BY created_at DESC LIMIT 1`
    ).bind(
      cleanCPF,
      formatCPFWithDots(cleanCPF),
      `%${cleanCPF}%`,
      `%${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9)}%`
    ).first();

    if (!doc) {
      return new Response(JSON.stringify({ error: 'CPF não encontrado no sistema.' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Validate password
    const docSenha = (doc as any).senha || '';
    if (docSenha !== senha) {
      return new Response(JSON.stringify({ error: 'Senha incorreta.' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse document data
    let docData: any = {};
    if (doc.data) {
      try {
        docData = JSON.parse(doc.data as string);
      } catch {
        docData = {};
      }
    }

    // Return CNH data for display
    const response = {
      data: {
        nome: (doc as any).nome || docData.nome || docData.nomeCompleto || '',
        cpf: (doc as any).cpf || docData.cpf || '',
        rg: docData.rg || docData.identidade || '',
        orgao_emissor: docData.orgaoEmissor || docData.orgao_emissor || 'SSP',
        uf_rg: docData.ufRg || docData.uf_rg || '',
        data_nascimento: docData.dataNascimento || docData.data_nascimento || '',
        registro: docData.registro || '',
        espelho: docData.espelho || '',
        categoria: (doc as any).categoria || docData.categoria || docData.cat || '',
        local_emissao: docData.localEmissao || docData.local_emissao || '',
        uf_emissao: docData.ufEmissao || docData.uf_emissao || '',
        emissao: docData.emissao || docData.dataEmissao || '',
        foto: docData.foto || '',
        status: (doc as any).status || 'emitido',
        created_at: (doc as any).created_at || '',
        filiacao_mae: docData.filiacaoMae || docData.filiacao_mae || docData.mae || '',
        filiacao_pai: docData.filiacaoPai || docData.filiacao_pai || docData.pai || '',
        nacionalidade: docData.nacionalidade || 'BRASILEIRO(A)',
        validade: docData.validade || docData.dataValidade || '',
        primeira_habilitacao: docData.primeiraHabilitacao || docData.primeira_habilitacao || '',
        numero_formulario: docData.espelho || docData.numeroFormulario || '',
        acc: docData.acc || 'D',
        senha: docSenha,
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

function formatCPFWithDots(digits: string): string {
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
