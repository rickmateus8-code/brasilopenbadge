/**
 * Endpoint temporário de diagnóstico — verificar schema real do D1
 */
import type { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // Get documents table schema
    const docSchema = await env.DB.prepare("PRAGMA table_info(documents)").all();
    
    // Get transactions table schema
    const txSchema = await env.DB.prepare("PRAGMA table_info(transactions)").all();
    
    // Get users table schema
    const usersSchema = await env.DB.prepare("PRAGMA table_info(users)").all();
    
    // Check if documents table has STRICT mode
    const sqlMaster = await env.DB.prepare(
      "SELECT sql FROM sqlite_master WHERE name = 'documents'"
    ).first<{ sql: string }>();

    const txSqlMaster = await env.DB.prepare(
      "SELECT sql FROM sqlite_master WHERE name = 'transactions'"
    ).first<{ sql: string }>();

    // Try a test insert to see what fails
    let testResult = 'not tested';
    try {
      // Dry run - use a transaction that we rollback
      const testId = 'TEST_' + Date.now();
      await env.DB.prepare(
        'INSERT INTO documents (id, user_id, type, data, codigo_qr, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
      ).bind(testId, 'admin-caio-001', 'cnh', '{"test":true}', testId, 'emitido').run();
      
      // Delete the test row
      await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(testId).run();
      testResult = 'INSERT succeeded';
    } catch (e: any) {
      testResult = `INSERT failed: ${e.message}`;
    }

    return new Response(JSON.stringify({
      documents_schema: docSchema.results,
      documents_sql: sqlMaster?.sql,
      transactions_schema: txSchema.results,
      transactions_sql: txSqlMaster?.sql,
      users_schema: usersSchema.results,
      test_insert: testResult,
    }, null, 2), { status: 200, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};
