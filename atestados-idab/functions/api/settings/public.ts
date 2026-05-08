/**
 * GET /api/settings/public — Configurações públicas do sistema
 *
 * Retorna apenas as configurações seguras para exibição pública
 * (sem autenticação obrigatória). Usado pelo frontend para exibir
 * o WhatsApp de suporte no fallback de PIX.
 */
import type { Env } from '../../types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const whatsapp = await env.DB.prepare(
      `SELECT value FROM system_settings WHERE key = 'support_whatsapp' LIMIT 1`
    ).first<{ value: string }>();

    return new Response(JSON.stringify({
      support_whatsapp: whatsapp?.value || '',
    }), { headers: corsHeaders });
  } catch (_) {
    // Tabela pode não existir ainda — retornar vazio sem erro
    return new Response(JSON.stringify({ support_whatsapp: '' }), { headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
