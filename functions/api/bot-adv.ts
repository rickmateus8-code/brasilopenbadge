interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  // 1. consultar_cpf_automatico
  if (action === "consultar_cpf_automatico") {
    const cpf = url.searchParams.get("cpf")?.replace(/\D/g, "");
    if (!cpf || cpf.length !== 11) {
      return new Response(JSON.stringify({ success: false, error: "CPF inválido" }), { headers: CORS_HEADERS });
    }

    // Tenta usar o serviço interno de CPF lookup (Snoop Intelligence)
    // Nota: Como estamos dentro de um Worker, podemos fazer um sub-fetch se necessário, 
    // mas por simplicidade e para o "clone" ser funcional, vamos simular ou chamar o serviço.
    try {
      // Simulando retorno do Supremo (Telefones + Nome)
      // Em produção, isso integraria com a Snoop Intelligence API (como em functions/api/cpf-lookup.ts)
      return new Response(JSON.stringify({
        success: true,
        telefones: ["(27) 9****-**48", "(27) 3****-**00"],
        dados: {
          nome: "CARREGANDO DADOS DO CREDOR...",
          nascimento: "01/01/1980"
        }
      }), { headers: CORS_HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Erro na consulta" }), { headers: CORS_HEADERS });
    }
  }

  // 2. verificar_whatsapp
  if (action === "verificar_whatsapp") {
    const telefone = url.searchParams.get("telefone")?.replace(/\D/g, "");
    if (!telefone) {
      return new Response(JSON.stringify({ success: false, error: "Telefone inválido" }), { headers: CORS_HEADERS });
    }
    // Simula verificação
    return new Response(JSON.stringify({
      success: true,
      status: "existe"
    }), { headers: CORS_HEADERS });
  }

  // 3. gerar_alvara (Simula o download do PDF baseado no layout peticaocria)
  if (action === "gerar_alvara") {
    const processo = url.searchParams.get("processo");
    // Aqui, no clone, o frontend geralmente lida com a geração via usePDFExport.
    // Mas para o endpoint ser funcional como um clone, retornamos uma instrução de sucesso.
    return new Response(JSON.stringify({
      success: true,
      url: `/api/documents/${processo}`
    }), { headers: CORS_HEADERS });
  }

  // 4. baixar_doc
  if (action === "baixar_doc") {
    return new Response(JSON.stringify({
      success: true,
      msg: "Iniciando download do documento..."
    }), { headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: CORS_HEADERS });
};
