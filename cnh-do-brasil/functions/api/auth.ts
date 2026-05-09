/**
 * /api/auth — POST
 * Proxy de autenticação para o DocMaster validate-login
 * Normaliza os dados para o formato esperado pelo frontend do clone
 */
interface Env {
  DB: D1Database;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: CORS });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { cpf: string; senha: string };
    const { cpf, senha } = body;

    if (!cpf || !senha) {
      return new Response(JSON.stringify({ success: false, message: 'CPF e senha são obrigatórios' }), {
        status: 400, headers: CORS,
      });
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    // Buscar direto no D1 (mesmo banco do DocMaster)
    const doc = await context.env.DB.prepare(
      `SELECT * FROM documents WHERE type = 'cnh' AND status = 'emitido'
       AND (cpf = ? OR cpf = ?) AND senha = ?
       ORDER BY created_at DESC LIMIT 1`
    ).bind(formattedCpf, cleanCpf, senha).first() as any;

    if (!doc) {
      return new Response(JSON.stringify({ success: false, message: 'CPF ou senha inválidos' }), {
        status: 401, headers: CORS,
      });
    }

    // Parse do JSON de dados
    let d: any = {};
    try { d = JSON.parse(doc.data || '{}'); } catch {}

    const ufEmissao = (d.ufEmissao || d.uf_emissao || d.estado || 'SP').toUpperCase();
    const codigoValidacao = doc.codigo_validacao || doc.codigo_qr || doc.id || '';

    const user = {
      nome: (doc.nome || d.nome || d.nomeCompleto || '').toUpperCase(),
      cpf: formattedCpf,
      sexo: d.sexo || 'M',
      categoria: doc.categoria || d.categoria || 'AB',
      uf: ufEmissao,
      ufEmissao,
      validade: d.validade || d.dataValidade || '-',
      emissao: d.dataEmissao || d.emissao || '',
      rg: d.rg || d.identidade || '',
      orgaoEmissor: d.orgaoEmissor || d.orgao_emissor || 'SSP',
      ufRG: (d.ufRG || d.ufRg || d.uf_rg || 'SP').toUpperCase(),
      dataNascimento: d.dataNascimento || d.data_nascimento || '',
      localNascimento: d.localNascimento || d.local_nascimento || '',
      ufNascimento: (d.ufNascimento || d.uf_nascimento || '').toUpperCase(),
      nacionalidade: d.nacionalidade || 'BRASILEIRA',
      nomeMae: d.nomeMae || d.filiacaoMae || d.filiacao_mae || d.mae || '',
      nomePai: d.nomePai || d.filiacaoPai || d.filiacao_pai || d.pai || '',
      registro: d.registro || '',
      espelho: d.espelho || d.numeroFormulario || d.numero_formulario || '',
      renach: d.espelho || d.numeroFormulario || '',
      primeiraHabilitacao: d.primeiraHabilitacao || d.primeira_habilitacao || '',
      localEmissao: d.localEmissao || d.local_emissao || '',
      tipo: d.tipo || 'Definitiva',
      observacoes: d.observacoes || '',
      fotoUrl: d.fotoUrl || d.foto || '',
      assinaturaUrl: d.assinaturaUrl || d.assinatura || '',
      assDigital1: d.assDigital1 || '',
      assDigital2: d.assDigital2 || '',
      codigoValidacao,
      validationUrl: `https://carteira-digital-transito-vio.digital/verificar?id=${codigoValidacao}`,
      pdfUrl: d.pdfUrl || '',
      historico: [{
        data: doc.created_at || '',
        numero: d.espelho || d.registro || doc.id || '',
      }],
    };

    return new Response(JSON.stringify({ success: true, user }), { status: 200, headers: CORS });

  } catch (err: any) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Erro interno do servidor' }), {
      status: 500, headers: CORS,
    });
  }
};
