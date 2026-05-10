import type { Env } from "../../types";

/**
 * judicial/oab.ts — Serviço de Consulta CNA OAB com Cache Híbrido e R2
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const OAB_API_URL = "https://cna.oab.org.br/api/advocates/search";
const RECAPTCHA_SITE_KEY = "6LecMcgsAAAAAPZLGrS_nBBb3IzfpDFQykLZbKQ6";

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const oab = url.searchParams.get("oab");
  const uf = url.searchParams.get("uf");
  const nome = url.searchParams.get("nome");

  if (!oab && !nome) {
    return new Response(JSON.stringify({ error: "OAB ou Nome é obrigatório" }), { status: 400, headers: CORS_HEADERS });
  }

  try {
    // 1. Verificar Cache Local (D1)
    let query = "SELECT * FROM oab_cache WHERE ";
    let params: string[] = [];

    if (oab && uf) {
      query += "oab = ? AND uf = ?";
      params = [oab, uf];
    } else {
      query += "LOWER(nome) = LOWER(?)";
      params = [nome || ""];
    }

    const cached = await env.DB.prepare(query).bind(...params).first<any>();

    if (cached) {
      // Mapear campos do cache para o formato da API
      const data = cached.json_data ? JSON.parse(cached.json_data) : cached;
      let photoB64 = null;

      // Se tivermos a URL do R2, converter para Base64 para o PDF engine
      if (cached.foto_r2_url) {
        try {
          const imgRes = await fetch(cached.foto_r2_url);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            photoB64 = `data:image/jpeg;base64,${base64}`;
          }
        } catch (e) {
          console.error("Erro ao converter R2 para B64:", e);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        source: "cache", 
        data: { ...data, photo: photoB64 || data.photo } 
      }), { headers: CORS_HEADERS });
    }

    // 2. Não há cache -> Iniciar Bypass com noCaptcha Ai (Mais barato/Viável)
    if (!env.NOCAPTCHA_API_KEY) {
      return new Response(JSON.stringify({ error: "Serviço de Captcha não configurado" }), { status: 500, headers: CORS_HEADERS });
    }

    console.log(`[*] Iniciando busca live para: ${oab || nome} via noCaptcha Ai`);

    // Solicitar Resolução ao noCaptcha Ai
    // Documentação: https://nocaptchaai.com/docs
    const captchaRes = await fetch("https://api.nocaptchaai.com/api/solve", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": env.NOCAPTCHA_API_KEY 
      },
      body: JSON.stringify({
        method: "userrecaptcha",
        sitekey: RECAPTCHA_SITE_KEY,
        url: "https://cna.oab.org.br/",
        version: "v2_enterprise",
        enterprise: 1
      })
    });

    const captchaData = await captchaRes.json() as any;
    if (captchaData.status === "error" || !captchaData.id) {
      throw new Error(`Falha no noCaptcha Ai: ${captchaData.message || "Erro desconhecido"}`);
    }

    // Polling para obter o resultado
    let token = "";
    const taskId = captchaData.id;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://api.nocaptchaai.com/api/status?id=${taskId}`, {
        method: "GET",
        headers: { "apikey": env.NOCAPTCHA_API_KEY }
      });
      const statusData = await statusRes.json() as any;
      
      if (statusData.status === "ready" || statusData.status === "solved") {
        token = statusData.solution || statusData.gRecaptchaResponse;
        break;
      }
      if (statusData.status === "error") throw new Error("Erro na resolução do noCaptcha Ai");
    }

    if (!token) throw new Error("Timeout na resolução do noCaptcha Ai");

    // 3. Consultar API Oficial da OAB
    const oabRes = await fetch(OAB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Captcha-Token": token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        name: nome || "",
        oabNumber: oab || "",
        seccional: uf || "",
        tipoInscricao: "1"
      })
    });

    const oabData = await oabRes.json() as any;
    const advocate = oabData.items?.[0] || oabData.data?.[0];

    if (!advocate) {
      return new Response(JSON.stringify({ success: false, error: "Advogado não encontrado na OAB" }), { headers: CORS_HEADERS });
    }

    // 4. Tratar Foto e R2
    let fotoPublicUrl = null;
    if (advocate.photo) {
      try {
        const photoKey = `oab_${advocate.oabNumber.replace(/\D/g, "")}_${advocate.seccional}.jpg`;
        let photoBuffer: ArrayBuffer;

        if (advocate.photo.startsWith("data:image")) {
          const base64Data = advocate.photo.split(",")[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          photoBuffer = bytes.buffer;
        } else {
          const imgRes = await fetch(advocate.photo);
          photoBuffer = await imgRes.arrayBuffer();
        }

        await env.ADV_PHOTOS_BUCKET.put(photoKey, photoBuffer, {
          httpMetadata: { contentType: "image/jpeg" }
        });
        
        fotoPublicUrl = `https://fotos.docmaster.store/${photoKey}`;
      } catch (e) {
        console.error("Erro ao salvar no R2:", e);
      }
    }

    // 5. Salvar no D1
    const cacheId = `OAB-${advocate.seccional}-${advocate.oabNumber}`;
    
    await env.DB.prepare(
      "INSERT INTO oab_cache (id, oab, uf, nome, tipo_inscricao, situacao, data_inscricao, foto_r2_url, json_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      cacheId,
      advocate.oabNumber,
      advocate.seccional,
      advocate.name,
      advocate.type || "Advogado",
      advocate.status || "Regular",
      advocate.date || "",
      fotoPublicUrl,
      JSON.stringify(advocate)
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      source: "live", 
      data: { ...advocate, photo: fotoPublicUrl } 
    }), { headers: CORS_HEADERS });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: CORS_HEADERS });
  }
};
