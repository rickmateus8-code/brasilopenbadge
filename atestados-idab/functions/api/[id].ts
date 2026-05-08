import { Env, ApiResponse, AttestationFrontend } from '../types';
import {
  getAttestationById,
  updateAttestation,
  deleteAttestation,
  mapToFrontend,
} from '../utils/db';

/**
 * GET /api/attestations/:id - Get specific attestation
 * PUT /api/attestations/:id - Update attestation
 * DELETE /api/attestations/:id - Delete attestation
 */
export async function onRequest(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;
  const id = params.id;

  // Enable CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    if (request.method === 'GET') {
      return handleGetAttestation(id, env);
    } else if (request.method === 'PUT') {
      return handleUpdateAttestation(id, request, env);
    } else if (request.method === 'DELETE') {
      return handleDeleteAttestation(id, env);
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
    console.error('Error in attestation endpoint:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
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

async function handleGetAttestation(id: string, env: Env) {
  const attestation = await getAttestationById(env, id);

  if (!attestation) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Attestation not found',
      }),
      {
        status: 404,
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
      data: mapToFrontend(attestation),
    } as ApiResponse<AttestationFrontend>),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleUpdateAttestation(id: string, request: Request, env: Env) {
  const body = await request.json();
  const updated = await updateAttestation(env, id, body);

  if (!updated) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Attestation not found',
      }),
      {
        status: 404,
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
      message: 'Attestation updated successfully',
      data: mapToFrontend(updated),
    } as ApiResponse<AttestationFrontend>),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleDeleteAttestation(id: string, env: Env) {
  const deleted = await deleteAttestation(env, id);

  if (!deleted) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Attestation not found',
      }),
      {
        status: 404,
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
      message: 'Attestation deleted successfully',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
