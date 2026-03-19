/**
 * Cloudflare Pages Function — Proxy para a API do CFM
 * Rota: GET /api/cfm/buscar?uf=BA&nome=DIMITRI&crm=14180
 *
 * A API do CFM (portal.cfm.org.br) bloqueia chamadas diretas do browser por CORS.
 * Este Worker faz a requisição server-side e repassa o resultado ao cliente.
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const uf = url.searchParams.get("uf") || "";
  const nome = url.searchParams.get("nome") || "";
  const crm = url.searchParams.get("crm") || "";

  // Validação mínima
  if (!uf && !nome && !crm) {
    return new Response(
      JSON.stringify({ status: "erro", dados: "Informe ao menos UF, nome ou CRM." }),
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    // 1. Buscar municípios se apenas UF for fornecida (sem nome/CRM)
    if (uf && !nome && !crm) {
      const municipiosUrl = `https://portal.cfm.org.br/api_rest_php/api/v2/medicos/listar_municipios/${uf}`;
      const res = await fetch(municipiosUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AtestadosIDAB/1.0)",
          "Accept": "application/json",
          "Referer": "https://portal.cfm.org.br/busca-medicos",
        },
      });

      if (!res.ok) throw new Error(`CFM API HTTP ${res.status}`);
      const data = await res.json() as any;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    // 2. Busca de médicos por nome ou CRM
    // A API do CFM usa POST com form-data para a busca principal
    const formData = new FormData();
    if (uf) formData.append("uf", uf);
    if (nome) formData.append("nome", nome.toUpperCase());
    if (crm) formData.append("crm", crm.replace(/\D/g, ""));
    formData.append("pagina", "1");
    formData.append("tipoSituacao", "A"); // Apenas ativos

    const searchUrl = "https://portal.cfm.org.br/api_rest_php/api/v2/medicos/buscar";
    const res = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AtestadosIDAB/1.0)",
        "Accept": "application/json",
        "Referer": "https://portal.cfm.org.br/busca-medicos",
        "Origin": "https://portal.cfm.org.br",
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`CFM API HTTP ${res.status}`);

    const text = await res.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      // Se não for JSON, tentar extrair dados da resposta HTML
      data = { status: "erro", dados: "Resposta inválida do CFM. Use os campos manuais." };
    }

    // Normalizar resposta
    if (data.status === "sucesso" && Array.isArray(data.dados)) {
      const medicos = data.dados.map((m: any) => ({
        nome: (m.nome || m.NOME || "").toUpperCase(),
        crm: m.crm || m.CRM || m.numero_crm || "",
        uf: m.uf_local || m.uf || m.UF || uf,
        especialidade: m.especialidade || m.ESPECIALIDADE || "",
        municipio: m.municipio || m.MUNICIPIO || m.cidade || "",
        situacao: m.situacao || m.SITUACAO || "ATIVO",
      }));
      return new Response(
        JSON.stringify({ status: "sucesso", dados: medicos }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: "erro",
        dados: `Erro ao consultar o CFM: ${err.message}. Preencha os dados manualmente.`,
      }),
      { status: 502, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
};
