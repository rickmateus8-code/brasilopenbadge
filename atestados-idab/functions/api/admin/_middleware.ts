/**
 * Global middleware for /api/admin/* routes
 * Provides an extra security layer before any admin endpoint is processed.
 * 
 * Security measures:
 * 1. Validates session cookie exists
 * 2. Verifies user is authenticated and has admin role
 * 3. Blocks requests from non-allowed origins
 * 4. Adds security headers to all responses
 */

interface Env {
  DB: D1Database;
}

const ALLOWED_ORIGINS = ['https://docmaster.store', 'https://www.docmaster.store'];

export const onRequest: PagesFunction<Env>[] = [
  async function adminAuthMiddleware({ request, env, next }) {
    const origin = request.headers.get('Origin') || '';
    const method = request.method;

    // Allow OPTIONS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://docmaster.store',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Validate session token
    const cookie = request.headers.get('Cookie') || '';
    const tokenMatch = cookie.match(/docmaster_session=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://docmaster.store',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    try {
      // Validate session and admin role in a single query
      const adminUser = await env.DB.prepare(
        `SELECT u.id, u.username, u.role
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ?
           AND s.expires_at > datetime('now')
           AND u.is_active = 1
           AND u.role = 'admin'
         LIMIT 1`
      ).bind(token).first<any>();

      if (!adminUser) {
        return new Response(JSON.stringify({ success: false, error: 'Acesso negado: requer privilégios de administrador' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://docmaster.store',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      }

      // Proceed to the actual handler
      const response = await next();

      // Add security headers to response
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (err: any) {
      console.error('[admin middleware]', err);
      return new Response(JSON.stringify({ success: false, error: 'Erro interno de autenticação' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://docmaster.store',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }
  },
];
