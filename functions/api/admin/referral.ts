// Admin referral management endpoints
// GET: List all referrals, earnings, and settings
// PUT: Update referral/cashback settings (global or per-user)
// DELETE: Clear referral logs

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const session = await db.prepare("SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')").bind(tokenMatch[1]).first<{ user_id: string; role: string }>();
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "overview";

  if (tab === "overview") {
    // Global stats
    const totalReferrals = await db.prepare("SELECT COUNT(*) as count FROM referrals").first<{ count: number }>();
    const totalReferralEarnings = await db.prepare("SELECT COALESCE(SUM(earned_amount), 0) as total FROM referral_earnings").first<{ total: number }>();
    const totalCashbackPaid = await db.prepare("SELECT COALESCE(SUM(cashback_amount), 0) as total FROM cashback_earnings").first<{ total: number }>();
    const activeReferrers = await db.prepare("SELECT COUNT(DISTINCT referrer_id) as count FROM referrals").first<{ count: number }>();

    // Settings
    const settings = await db.prepare("SELECT key, value FROM system_settings WHERE key IN ('referral_percentage', 'cashback_percentage', 'referral_enabled', 'cashback_enabled')").all();

    return new Response(JSON.stringify({
      totalReferrals: totalReferrals?.count || 0,
      totalReferralEarnings: totalReferralEarnings?.total || 0,
      totalCashbackPaid: totalCashbackPaid?.total || 0,
      activeReferrers: activeReferrers?.count || 0,
      settings: settings?.results || []
    }), { headers: { "Content-Type": "application/json" } });
  }

  if (tab === "referrals") {
    // List all referrals with details
    const referrals = await db.prepare(`
      SELECT r.id, r.created_at,
             u1.name as referrer_name, u1.email as referrer_email, u1.referral_percentage as referrer_custom_pct,
             u2.name as referred_name, u2.email as referred_email,
             COALESCE(SUM(re.earned_amount), 0) as total_earned
      FROM referrals r
      JOIN users u1 ON r.referrer_id = u1.id
      JOIN users u2 ON r.referred_id = u2.id
      LEFT JOIN referral_earnings re ON re.referrer_id = r.referrer_id AND re.referred_id = r.referred_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({ referrals: referrals?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }

  if (tab === "earnings") {
    // List all referral earnings
    const earnings = await db.prepare(`
      SELECT re.id, re.deposit_amount, re.percentage, re.earned_amount, re.created_at,
             u1.name as referrer_name, u2.name as referred_name
      FROM referral_earnings re
      JOIN users u1 ON re.referrer_id = u1.id
      JOIN users u2 ON re.referred_id = u2.id
      ORDER BY re.created_at DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({ earnings: earnings?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }

  if (tab === "cashback") {
    // List all cashback earnings
    const cashback = await db.prepare(`
      SELECT ce.id, ce.deposit_amount, ce.percentage, ce.cashback_amount, ce.created_at,
             u.name as user_name, u.email as user_email
      FROM cashback_earnings ce
      JOIN users u ON ce.user_id = u.id
      ORDER BY ce.created_at DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({ cashback: cashback?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }

  if (tab === "users") {
    // List users with referral info
    const users = await db.prepare(`
      SELECT u.id, u.name, u.email, u.referral_code, u.referral_percentage, u.cashback_percentage,
             rc.code,
             (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as total_referred,
             (SELECT COALESCE(SUM(earned_amount), 0) FROM referral_earnings WHERE referrer_id = u.id) as total_earned,
             (SELECT COALESCE(SUM(cashback_amount), 0) FROM cashback_earnings WHERE user_id = u.id) as total_cashback
      FROM users u
      LEFT JOIN referral_codes rc ON rc.user_id = u.id
      ORDER BY total_referred DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({ users: users?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Tab inválida" }), { status: 400, headers: { "Content-Type": "application/json" } });
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const session = await db.prepare("SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')").bind(tokenMatch[1]).first<{ user_id: string; role: string }>();
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const body = await request.json() as any;
  const { action } = body;

  if (action === "update_global_settings") {
    const { referral_percentage, cashback_percentage, referral_enabled, cashback_enabled } = body;
    if (referral_percentage !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('referral_percentage', ?, datetime('now'))").bind(String(referral_percentage)).run();
    }
    if (cashback_percentage !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('cashback_percentage', ?, datetime('now'))").bind(String(cashback_percentage)).run();
    }
    if (referral_enabled !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('referral_enabled', ?, datetime('now'))").bind(String(referral_enabled)).run();
    }
    if (cashback_enabled !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('cashback_enabled', ?, datetime('now'))").bind(String(cashback_enabled)).run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  }

  if (action === "update_user_settings") {
    const { userId, referral_percentage, cashback_percentage } = body;
    if (!userId) return new Response(JSON.stringify({ error: "userId é obrigatório" }), { status: 400, headers: { "Content-Type": "application/json" } });

    await db.prepare("UPDATE users SET referral_percentage = ?, cashback_percentage = ? WHERE id = ?")
      .bind(referral_percentage ?? null, cashback_percentage ?? null, userId).run();

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { "Content-Type": "application/json" } });
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const session = await db.prepare("SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')").bind(tokenMatch[1]).first<{ user_id: string; role: string }>();
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const url = new URL(request.url);
  const clearType = url.searchParams.get("clear");

  if (clearType === "earnings") {
    await db.exec("DELETE FROM referral_earnings");
    return new Response(JSON.stringify({ success: true, message: "Logs de ganhos de indicação limpos" }), { headers: { "Content-Type": "application/json" } });
  }
  if (clearType === "cashback") {
    await db.exec("DELETE FROM cashback_earnings");
    return new Response(JSON.stringify({ success: true, message: "Logs de cashback limpos" }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Tipo de limpeza inválido" }), { status: 400, headers: { "Content-Type": "application/json" } });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};
