/**
 * CORS middleware for Cloudflare Pages Functions
 */

export interface CORSOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CORSOptions = {
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: false,
  maxAge: 86400, // 24 hours
};

export function getCORSHeaders(options: CORSOptions = {}): Record<string, string> {
  const opts = { ...defaultOptions, ...options };

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': opts.allowedMethods!.join(', '),
    'Access-Control-Allow-Headers': opts.allowedHeaders!.join(', '),
    'Access-Control-Max-Age': opts.maxAge!.toString(),
  };

  if (opts.allowedOrigins!.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else {
    headers['Access-Control-Allow-Origin'] = opts.allowedOrigins!.join(', ');
  }

  if (opts.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

export function handleCORSPreflight(
  request: Request,
  options: CORSOptions = {}
): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCORSHeaders(options),
    });
  }
  return null;
}
