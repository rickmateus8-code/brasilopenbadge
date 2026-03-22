// Migration: Add referral system, cashback config, and system_settings tables
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  const db = env.DB;
  const results: string[] = [];

  try {
    // 1. Referral codes table - each user gets a unique referral code
    await db.exec(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    results.push("Created referral_codes table");

    // 2. Referrals table - tracks who referred whom
    await db.exec(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id TEXT NOT NULL,
        referred_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    results.push("Created referrals table");

    // 3. Referral earnings - tracks earnings from referrals
    await db.exec(`
      CREATE TABLE IF NOT EXISTS referral_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id TEXT NOT NULL,
        referred_id TEXT NOT NULL,
        deposit_amount REAL NOT NULL,
        percentage REAL NOT NULL,
        earned_amount REAL NOT NULL,
        deposit_transaction_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    results.push("Created referral_earnings table");

    // 4. Cashback earnings - tracks cashback from deposits
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cashback_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        deposit_amount REAL NOT NULL,
        percentage REAL NOT NULL,
        cashback_amount REAL NOT NULL,
        deposit_transaction_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    results.push("Created cashback_earnings table");

    // 5. System settings table - stores global configs
    await db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    results.push("Created system_settings table");

    // 6. Insert default settings
    await db.exec(`
      INSERT OR IGNORE INTO system_settings (key, value) VALUES
        ('referral_percentage', '10'),
        ('cashback_percentage', '5'),
        ('referral_enabled', 'true'),
        ('cashback_enabled', 'true')
    `);
    results.push("Inserted default settings (referral 10%, cashback 5%)");

    // 7. Add referral_code column to users if not exists
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN referral_code TEXT`);
      results.push("Added referral_code column to users");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("referral_code column already exists in users");
      } else {
        results.push("referral_code: " + e.message);
      }
    }

    // 8. Add referred_by column to users if not exists
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN referred_by TEXT`);
      results.push("Added referred_by column to users");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("referred_by column already exists in users");
      } else {
        results.push("referred_by: " + e.message);
      }
    }

    // 9. Add cashback_percentage column to users for per-user override
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN cashback_percentage REAL`);
      results.push("Added cashback_percentage column to users");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("cashback_percentage column already exists in users");
      } else {
        results.push("cashback_percentage: " + e.message);
      }
    }

    // 10. Add referral_percentage column to users for per-user override
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN referral_percentage REAL`);
      results.push("Added referral_percentage column to users");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("referral_percentage column already exists in users");
      } else {
        results.push("referral_percentage: " + e.message);
      }
    }

    // 11. Add total_deposited column to users
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN total_deposited REAL DEFAULT 0`);
      results.push("Added total_deposited column to users");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("total_deposited column already exists in users");
      } else {
        results.push("total_deposited: " + e.message);
      }
    }

    // 12. Add senha (password for CNH/CHA app access) column to documents
    try {
      await db.exec(`ALTER TABLE documents ADD COLUMN senha TEXT`);
      results.push("Added senha column to documents");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("senha column already exists in documents");
      } else {
        results.push("senha: " + e.message);
      }
    }

    // 13. Add cpf column to documents
    try {
      await db.exec(`ALTER TABLE documents ADD COLUMN cpf TEXT`);
      results.push("Added cpf column to documents");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("cpf column already exists in documents");
      } else {
        results.push("cpf: " + e.message);
      }
    }

    // 14. Add nome column to documents
    try {
      await db.exec(`ALTER TABLE documents ADD COLUMN nome TEXT`);
      results.push("Added nome column to documents");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("nome column already exists in documents");
      } else {
        results.push("nome: " + e.message);
      }
    }

    // 15. Add categoria column to documents
    try {
      await db.exec(`ALTER TABLE documents ADD COLUMN categoria TEXT`);
      results.push("Added categoria column to documents");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        results.push("categoria column already exists in documents");
      } else {
        results.push("categoria: " + e.message);
      }
    }

    // Indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_cashback_earnings_user ON cashback_earnings(user_id)`);
    results.push("Created indexes");

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
