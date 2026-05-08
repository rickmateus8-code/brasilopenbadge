// Migration: Add referral system, cashback config, and system_settings tables
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  const db = env.DB;
  const results: string[] = [];

  const run = async (sql: string, label: string) => {
    try {
      await db.prepare(sql).run();
      results.push(label);
    } catch (e: any) {
      if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
        results.push(label + " (already exists)");
      } else {
        results.push(label + " ERROR: " + e.message);
      }
    }
  };

  try {
    await run(
      "CREATE TABLE IF NOT EXISTS referral_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "Created referral_codes"
    );

    await run(
      "CREATE TABLE IF NOT EXISTS referrals (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id TEXT NOT NULL, referred_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "Created referrals"
    );

    await run(
      "CREATE TABLE IF NOT EXISTS referral_earnings (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id TEXT NOT NULL, referred_id TEXT NOT NULL, deposit_amount REAL NOT NULL, percentage REAL NOT NULL, earned_amount REAL NOT NULL, deposit_transaction_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "Created referral_earnings"
    );

    await run(
      "CREATE TABLE IF NOT EXISTS cashback_earnings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, deposit_amount REAL NOT NULL, percentage REAL NOT NULL, cashback_amount REAL NOT NULL, deposit_transaction_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "Created cashback_earnings"
    );

    await run(
      "CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "Created system_settings"
    );

    // Default settings
    await run("INSERT OR IGNORE INTO system_settings (key, value) VALUES ('referral_percentage', '10')", "Setting: referral_percentage=10");
    await run("INSERT OR IGNORE INTO system_settings (key, value) VALUES ('cashback_percentage', '5')", "Setting: cashback_percentage=5");
    await run("INSERT OR IGNORE INTO system_settings (key, value) VALUES ('referral_enabled', 'true')", "Setting: referral_enabled=true");
    await run("INSERT OR IGNORE INTO system_settings (key, value) VALUES ('cashback_enabled', 'true')", "Setting: cashback_enabled=true");

    // Add columns to users
    await run("ALTER TABLE users ADD COLUMN referral_code TEXT", "users.referral_code");
    await run("ALTER TABLE users ADD COLUMN referred_by TEXT", "users.referred_by");
    await run("ALTER TABLE users ADD COLUMN cashback_percentage REAL", "users.cashback_percentage");
    await run("ALTER TABLE users ADD COLUMN referral_percentage REAL", "users.referral_percentage");
    await run("ALTER TABLE users ADD COLUMN total_deposited REAL DEFAULT 0", "users.total_deposited");

    // Add columns to documents
    await run("ALTER TABLE documents ADD COLUMN senha TEXT", "documents.senha");
    await run("ALTER TABLE documents ADD COLUMN cpf TEXT", "documents.cpf");
    await run("ALTER TABLE documents ADD COLUMN nome TEXT", "documents.nome");
    await run("ALTER TABLE documents ADD COLUMN categoria TEXT", "documents.categoria");

    // Indexes
    await run("CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id)", "idx_referral_codes_user");
    await run("CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code)", "idx_referral_codes_code");
    await run("CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)", "idx_referrals_referrer");
    await run("CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id)", "idx_referrals_referred");
    await run("CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_id)", "idx_referral_earnings_referrer");
    await run("CREATE INDEX IF NOT EXISTS idx_cashback_earnings_user ON cashback_earnings(user_id)", "idx_cashback_earnings_user");

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message, results }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
