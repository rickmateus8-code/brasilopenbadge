// Temporary migration endpoint - DELETE AFTER USE
// Ensures documents table has all required columns: status, codigo_qr
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const results: string[] = [];

    // Check current columns
    const tableInfo = await env.DB.prepare("PRAGMA table_info(documents)").all();
    const columns = tableInfo.results?.map((col: any) => col.name) || [];

    // Add status column if missing
    if (!columns.includes('status')) {
      await env.DB.prepare("ALTER TABLE documents ADD COLUMN status TEXT DEFAULT 'emitido'").run();
      results.push('Added status column');
    } else {
      results.push('status column already exists');
    }

    // Add codigo_qr column if missing
    if (!columns.includes('codigo_qr')) {
      await env.DB.prepare("ALTER TABLE documents ADD COLUMN codigo_qr TEXT").run();
      results.push('Added codigo_qr column');
    } else {
      results.push('codigo_qr column already exists');
    }

    // Add validation_url column if missing
    if (!columns.includes('validation_url')) {
      await env.DB.prepare("ALTER TABLE documents ADD COLUMN validation_url TEXT").run();
      results.push('Added validation_url column');
    } else {
      results.push('validation_url column already exists');
    }

    // Add pdf_data column if missing
    if (!columns.includes('pdf_data')) {
      await env.DB.prepare("ALTER TABLE documents ADD COLUMN pdf_data TEXT").run();
      results.push('Added pdf_data column');
    } else {
      results.push('pdf_data column already exists');
    }

    // Update existing rows with null status
    await env.DB.prepare("UPDATE documents SET status = 'emitido' WHERE status IS NULL").run();
    results.push('Updated null status rows');

    // Get final column list
    const finalInfo = await env.DB.prepare("PRAGMA table_info(documents)").all();
    const finalColumns = finalInfo.results?.map((c: any) => c.name) || [];

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Migration completed successfully',
      actions: results,
      columns: finalColumns
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
};
