// Referral system endpoints
// GET: Get current user's referral code and stats
// POST: Apply referral code during registration or first use

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/docmaster_session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const session = await db.prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')").bind(tokenMatch[1]).first<{ user_id: string }>();
  if (!session) return new Response(JSON.stringify({ error: "Sessão expirada" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const userId = session.user_id;

  // Get or create referral code
  let refCode = await db.prepare("SELECT code FROM referral_codes WHERE user_id = ?").bind(userId).first<{ code: string }>();
  if (!refCode) {
    const code = generateReferralCode();
    await db.prepare("INSERT INTO referral_codes (user_id, code) VALUES (?, ?)").bind(userId, code).run();
    refCode = { code };
    // Also update user record
    await db.prepare("UPDATE users SET referral_code = ? WHERE id = ?").bind(code, userId).run();
  }

  // Get referral stats
  const totalReferred = await db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?").bind(userId).first<{ count: number }>();
  const totalEarnings = await db.prepare("SELECT COALESCE(SUM(earned_amount), 0) as total FROM referral_earnings WHERE referrer_id = ?").bind(userId).first<{ total: number }>();
  const totalCashback = await db.prepare("SELECT COALESCE(SUM(cashback_amount), 0) as total FROM cashback_earnings WHERE user_id = ?").bind(userId).first<{ total: number }>();

  // Get referred users list
  const referredUsers = await db.prepare(`
    SELECT r.referred_id, r.created_at, u.name, u.email,
           COALESCE(SUM(re.earned_amount), 0) as total_earned
    FROM referrals r
    JOIN users u ON r.referred_id = u.id
    LEFT JOIN referral_earnings re ON re.referred_id = r.referred_id AND re.referrer_id = r.referrer_id
    WHERE r.referrer_id = ?
    GROUP BY r.referred_id
    ORDER BY r.created_at DESC
    LIMIT 50
  `).bind(userId).all();

  // Get settings
  const refPct = await db.prepare("SELECT value FROM system_settings WHERE key = 'referral_percentage'").first<{ value: string }>();
  const cbPct = await db.prepare("SELECT value FROM system_settings WHERE key = 'cashback_percentage'").first<{ value: string }>();

  // Get user-specific overrides
  const user = await db.prepare("SELECT referral_percentage, cashback_percentage FROM users WHERE id = ?").bind(userId).first<any>();

  return new Response(JSON.stringify({
    code: refCode.code,
    referralLink: `https://docmaster.store/register?ref=${refCode.code}`,
    totalReferred: totalReferred?.count || 0,
    totalEarnings: totalEarnings?.total || 0,
    totalCashback: totalCashback?.total || 0,
    referredUsers: referredUsers?.results || [],
    globalReferralPercentage: parseFloat(refPct?.value || "10"),
    globalCashbackPercentage: parseFloat(cbPct?.value || "5"),
    userReferralPercentage: user?.referral_percentage,
    userCashbackPercentage: user?.cashback_percentage
  }), {
    headers: { "Content-Type": "application/json" }
  });
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ request, env }) => {
  const db = env.DB;
  const cookie = request.headers.get("Cookie") || "";
  const tokenMatch = cookie.match(/docmaster_session=([^;]+)/);
  if (!tokenMatch) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const session = await db.prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')").bind(tokenMatch[1]).first<{ user_id: string }>();
  if (!session) return new Response(JSON.stringify({ error: "Sessão expirada" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const userId = session.user_id;
  const body = await request.json() as any;
  const { referralCode } = body;

  if (!referralCode) {
    return new Response(JSON.stringify({ error: "Código de indicação é obrigatório" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Check if user already has a referrer
  const existingRef = await db.prepare("SELECT id FROM referrals WHERE referred_id = ?").bind(userId).first();
  if (existingRef) {
    return new Response(JSON.stringify({ error: "Você já foi indicado por alguém" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Find referrer by code
  const referrer = await db.prepare("SELECT user_id FROM referral_codes WHERE code = ?").bind(referralCode.toUpperCase()).first<{ user_id: string }>();
  if (!referrer) {
    return new Response(JSON.stringify({ error: "Código de indicação inválido" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  if (referrer.user_id === userId) {
    return new Response(JSON.stringify({ error: "Você não pode usar seu próprio código" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Create referral
  await db.prepare("INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)").bind(referrer.user_id, userId).run();
  await db.prepare("UPDATE users SET referred_by = ? WHERE id = ?").bind(referrer.user_id, userId).run();

  return new Response(JSON.stringify({ success: true, message: "Indicação aplicada com sucesso!" }), {
    headers: { "Content-Type": "application/json" }
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
};
