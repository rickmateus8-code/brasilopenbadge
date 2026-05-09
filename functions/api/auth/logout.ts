import type { Env } from '../../types';

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const headers = new Headers(corsHeaders);
    headers.set('Set-Cookie', 'docmaster_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, { headers: getCorsHeaders(request.headers.get('Origin')) });
};
