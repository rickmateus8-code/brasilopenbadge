import { Env, ValidateResponse, AttestationFrontend } from '../../types';
import {
  getAttestationByCode,
  validateAttestation,
  mapToFrontend,
} from '../../utils/db';

/**
 * GET /api/validate/:code - Validate attestation by code
 * Query params:
 *   - date: optional, to validate with date matching
 */
export async function onRequest(context: { request: Request; env: Env; params: { code: string } }) {
  const { request, env, params } = context;
  const code = params.code;

  // Enable CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    if (request.method === 'GET') {
      return handleValidateAttestation(code, request, env);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed',
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  } catch (error) {
    console.error('Error in validate endpoint:', error);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ValidateResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

async function handleValidateAttestation(code: string, request: Request, env: Env) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');

  // If date provided, do full validation
  if (date) {
    const result = await validateAttestation(env, code, date);
    if (result.valid && result.attestation) {
      return new Response(
        JSON.stringify({
          success: true,
          valid: true,
          message: 'Attestation is valid and authentic',
          data: mapToFrontend(result.attestation),
        } as ValidateResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        message: 'Attestation not found or date does not match',
      } as ValidateResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // If no date, just look up by code
  const attestation = await getAttestationByCode(env, code);
  if (!attestation) {
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        message: 'Attestation not found',
      } as ValidateResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      valid: true,
      message: 'Attestation found',
      data: mapToFrontend(attestation),
    } as ValidateResponse),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
