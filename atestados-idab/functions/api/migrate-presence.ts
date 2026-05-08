/**
 * /api/migrate-presence — GET: Cria tabelas user_presence e system_logs se não existirem
 */
import type { Env } from '../types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const actions: string[] = [];
  try {
    // Create user_presence table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_presence (
        user_id TEXT PRIMARY KEY,
        current_page TEXT DEFAULT '/dashboard',
        current_action TEXT DEFAULT 'navegando',
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        is_online INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    actions.push('user_presence table created/verified');

    // Create system_logs table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'system',
        severity TEXT NOT NULL DEFAULT 'info',
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `).run();
    actions.push('system_logs table created/verified');

    // Create indexes
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_syslog_category ON system_logs(category)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_syslog_severity ON system_logs(severity)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_syslog_created ON system_logs(created_at)').run();
    actions.push('indexes created/verified');

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration completed successfully',
      actions,
    }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      actions,
    }), { status: 500, headers: corsHeaders });
  }
};
