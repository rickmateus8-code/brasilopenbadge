// /api/upa-proxima — Busca UPAs/Unidades de Saúde próximas pelo CEP
// Usa API pública do DataSUS CNES — NÃO altera o banco de dados
// Tipos CNES: 70=UPA 24h, 36=Pronto Socorro, 5=Hospital Geral, 73=UBS, 74=Centro de Saúde

interface Env {}

const CNES_URL = "https://apidadosabertos.saude.gov.br/cnes";
const VIACEP_URL = "https://viacep.com.br/ws";

// Mapeamento UF sigla -> código IBGE do estado (para montar código município)
// O CNES usa o código IBGE de 6 dígitos do município
const TIPOS_PRIORIDADE = [
  { codigo: 70, label: "UPA 24h" },
  { codigo: 36, label: "Pronto Socorro" },
  { codigo: 5,  label: "Hospital Geral" },
  { codigo: 73, label: "UBS" },
  { codigo: 74, label: "Centro de Saúde" },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);
  const cep = url.searchParams.get("cep")?.replace(/\D/g, "");

  if (!cep || cep.length !== 8) {
    return new Response(JSON.stringify({ error: "CEP inválido" }), { status: 400, headers: corsHeaders });
  }

  try {
    // 1. Buscar cidade/UF/código IBGE pelo CEP via ViaCEP
    const viaCepRes = await fetch(`${VIACEP_URL}/${cep}/json/`);
    const viaCep = await viaCepRes.json() as any;
    if (viaCep.erro) {
      return new Response(JSON.stringify({ error: "CEP não encontrado" }), { status: 404, headers: corsHeaders });
    }

    const ibgeCodigo = viaCep.ibge; // código IBGE de 7 dígitos
    const municipioCodigo = ibgeCodigo ? String(ibgeCodigo).slice(0, 6) : null; // 6 dígitos para o CNES
    const cidade = (viaCep.localidade || "").toUpperCase();
    const uf = (viaCep.uf || "").toUpperCase();
    const bairro = (viaCep.bairro || "").toUpperCase();

    if (!municipioCodigo) {
      return new Response(JSON.stringify({ error: "Município não identificado pelo CEP" }), { status: 404, headers: corsHeaders });
    }

    // 2. Buscar UPAs e unidades de saúde pelo município no CNES (por ordem de prioridade)
    const resultados: any[] = [];

    for (const tipo of TIPOS_PRIORIDADE) {
      if (resultados.length >= 20) break; // Máximo 20 resultados totais
      try {
        const cnesRes = await fetch(
          `${CNES_URL}/estabelecimentos?codigo_municipio=${municipioCodigo}&codigo_tipo_unidade=${tipo.codigo}&limit=20`,
          { headers: { Accept: "application/json" } }
        );
        if (!cnesRes.ok) continue;
        const cnesData = await cnesRes.json() as any;
        const estabelecimentos = cnesData.estabelecimentos || [];

        for (const e of estabelecimentos) {
          if (resultados.length >= 20) break;
          const nomeFantasia = (e.nome_fantasia || "").trim();
          const nomeRazao = (e.nome_razao_social || "").trim();
          const nome = nomeFantasia && !nomeFantasia.includes("PREFEITURA") ? nomeFantasia : nomeRazao;
          const rua = (e.endereco_estabelecimento || "").toUpperCase();
          const numero = (e.numero_estabelecimento || "S/N").toUpperCase();
          const bairroEst = (e.bairro_estabelecimento || "").toUpperCase();
          const cepEst = (e.codigo_cep_estabelecimento || "").replace(/\D/g, "");
          const cepFmt = cepEst.length === 8 ? `${cepEst.slice(0,5)}-${cepEst.slice(5)}` : cepEst;

          // Formatar endereço no padrão {rua}, {Nº} - {bairro}, {cidade}/{uf}
          const enderecoFormatado = [
            `${rua}, ${numero}`,
            bairroEst ? `${bairroEst}, ${cidade}/${uf}` : `${cidade}/${uf}`,
          ].join(" - ");

          resultados.push({
            nome: nome.toUpperCase(),
            tipo: tipo.label,
            tipo_codigo: tipo.codigo,
            endereco: enderecoFormatado,
            rua,
            numero,
            bairro: bairroEst,
            cidade,
            uf,
            cep: cepFmt,
            cnes: e.codigo_cnes,
          });
        }
      } catch { /* ignora erros por tipo */ }
    }

    return new Response(JSON.stringify({
      cidade,
      uf,
      bairro,
      municipio_codigo: municipioCodigo,
      total: resultados.length,
      upas: resultados,
    }), { headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Erro ao buscar UPAs: " + err.message }), { status: 500, headers: corsHeaders });
  }
};
