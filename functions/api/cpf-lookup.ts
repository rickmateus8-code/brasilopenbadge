/**
 * Cloudflare Pages Function — Proxy para consulta de CPF via BrasilAPI
 * Rota: GET /api/cpf-lookup?cpf=00000000000
 *
 * Retorna dados do paciente: nome, data_nascimento, sexo, nome_mae
 * Requer autenticação de sessão (apenas usuários logados podem consultar).
 */

interface Env {
  DB: D1Database;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

async function getAuthUser(request: Request, env: Env): Promise<any | null> {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/session_token=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(token).first<{ user_id: number }>();
  if (!session) return null;
  return session;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Verificar autenticação
  const user = await getAuthUser(request, env);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Não autenticado." }),
      { status: 401, headers: corsHeaders() }
    );
  }

  const url = new URL(request.url);
  const cpfRaw = url.searchParams.get("cpf") || "";
  const cpf = cpfRaw.replace(/\D/g, "");

  if (cpf.length !== 11) {
    return new Response(
      JSON.stringify({ success: false, error: "CPF inválido. Informe 11 dígitos." }),
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    // Tentar BrasilAPI (gratuita, sem autenticação, dados públicos da Receita Federal)
    const brasilApiUrl = `https://brasilapi.com.br/api/cpf/v1/${cpf}`;
    const res = await fetch(brasilApiUrl, {
      headers: {
        "User-Agent": "DocMaster/1.0",
        "Accept": "application/json",
      },
      // Timeout de 8 segundos
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // BrasilAPI retorna 404 quando CPF não encontrado
      if (res.status === 404) {
        return new Response(
          JSON.stringify({ success: false, error: "CPF não encontrado na base de dados." }),
          { status: 404, headers: corsHeaders() }
        );
      }
      throw new Error(`BrasilAPI HTTP ${res.status}`);
    }

    const data = await res.json() as any;

    // Normalizar dados retornados pela BrasilAPI
    // Campos esperados: nome, data_nascimento, sexo, nome_mae
    const nome = (data.nome || data.name || "").toUpperCase().trim();
    const dataNasc = data.data_nascimento || data.nascimento || "";
    const sexo = (data.sexo || data.genero || "").toUpperCase();
    const nomeMae = (data.nome_mae || data.mae || "").toUpperCase().trim();

    // Converter data de nascimento para DD/MM/AAAA se vier em YYYY-MM-DD
    let nascimentoFormatado = dataNasc;
    if (dataNasc && dataNasc.includes("-") && dataNasc.length >= 10) {
      const parts = dataNasc.substring(0, 10).split("-");
      if (parts.length === 3) {
        nascimentoFormatado = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // Normalizar sexo para MALE/FEMALE
    let sexoNormalizado = "FEMALE";
    if (sexo === "M" || sexo === "MASCULINO" || sexo === "MALE") {
      sexoNormalizado = "MALE";
    } else if (sexo === "F" || sexo === "FEMININO" || sexo === "FEMALE") {
      sexoNormalizado = "FEMALE";
    }

    if (!nome) {
      return new Response(
        JSON.stringify({ success: false, error: "Dados incompletos retornados pela API. Preencha manualmente." }),
        { status: 422, headers: corsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome,
          nascimento: nascimentoFormatado,
          sexo: sexoNormalizado,
          nomeMae,
        },
      }),
      { headers: corsHeaders() }
    );
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return new Response(
      JSON.stringify({
        success: false,
        error: isTimeout
          ? "Timeout ao consultar CPF. Preencha os dados manualmente."
          : "Erro ao consultar CPF. Preencha os dados manualmente.",
      }),
      { status: 502, headers: corsHeaders() }
    );
  }
};
