import { Env, ApiResponse, AttestationFrontend, CreateAttestationInput } from '../types';
import {
  getAllAttestations,
  createAttestation,
  mapToFrontend,
} from '../utils/db';

/**
 * GET /api/attestations - List all attestations
 * POST /api/attestations - Create new attestation
 */
export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Enable CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    if (request.method === 'GET') {
      return handleGetAttestations(env);
    } else if (request.method === 'POST') {
      return handleCreateAttestation(request, env);
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
    console.error('Error in attestations endpoint:', error);
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

async function handleGetAttestations(env: Env) {
  const attestations = await getAllAttestations(env);
  const data = attestations.map(mapToFrontend);

  return new Response(
    JSON.stringify({
      success: true,
      data,
      count: data.length,
    } as ApiResponse<AttestationFrontend[]>),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleCreateAttestation(request: Request, env: Env) {
  const body = await request.json<CreateAttestationInput>();

  // Validate required fields
  const requiredFields = [
    'paciente',
    'sexo',
    'nascimento',
    'cpf',
    'nome_mae',
    'endereco',
    'condicao',
    'vacinacao',
    'cid',
    'medico',
    'crm',
    'especialidade',
    'data_assinatura',
    'hora_assinatura',
    'data_emissao',
  ];

  const missingFields = requiredFields.filter((field) => !body[field as keyof CreateAttestationInput]);

  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const newAttestation = await createAttestation(env, {
    paciente: body.paciente,
    sexo: body.sexo,
    nascimento: body.nascimento,
    cpf: body.cpf,
    nome_mae: body.nome_mae,
    endereco: body.endereco,
    passaporte: body.passaporte || null,
    condicao: body.condicao,
    vacinacao: body.vacinacao,
    cid: body.cid,
    medico: body.medico,
    crm: body.crm,
    especialidade: body.especialidade,
    data_assinatura: body.data_assinatura,
    hora_assinatura: body.hora_assinatura,
    data_emissao: body.data_emissao,
    logo_url: body.logo_url || null,
    endereco_emitente:
      body.endereco_emitente ||
      'Endereço da Clínica',
    instituicao: body.instituicao || 'Clínica / Hospital',
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Attestation created successfully',
      data: mapToFrontend(newAttestation),
    } as ApiResponse<AttestationFrontend>),
    {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
