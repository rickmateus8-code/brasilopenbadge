interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const results: string[] = [];

  try {
    // Check existing columns
    const tableInfo = await context.env.DB.prepare("PRAGMA table_info(documents)").all();
    const columns = (tableInfo.results || []).map((c: any) => c.name);

    // Add validation_id column if missing
    if (!columns.includes('validation_id')) {
      await context.env.DB.prepare("ALTER TABLE documents ADD COLUMN validation_id TEXT").run();
      results.push('Added validation_id column to documents');
    } else {
      results.push('validation_id column already exists');
    }

    // Create index for validation_id
    try {
      await context.env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_documents_validation_id ON documents(validation_id)").run();
      results.push('Created index idx_documents_validation_id');
    } catch (e: any) {
      results.push('Index already exists or error: ' + e.message);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, results }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
