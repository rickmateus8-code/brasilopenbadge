import { Handler } from '@netlify/functions';
import { db } from '../db';
import { attestation_history } from '../schema';
import { desc, eq, and } from 'drizzle-orm';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };
  
  const fieldId = event.path.split('/').pop();
  if (!fieldId) return { statusCode: 400, body: 'Missing fieldId' };

  // Nota: Implementação simplificada buscando histórico recente baseado no fieldId no JSON de preenchimento
  // Esta query precisa ser adaptada ao esquema real de busca de histórico.
  try {
    const history = await db.select()
      .from(attestation_history)
      .where(eq(attestation_history.field_id, fieldId))
      .orderBy(desc(attestation_history.created_at))
      .limit(5);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: history.map(h => h.value) })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch suggestions' }) };
  }
};
