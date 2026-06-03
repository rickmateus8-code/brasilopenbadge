/**
 * Worker: valida-laudo-innovatox
 * Domínio: valida-laudo-sodretox.online (a ser atualizado para innovatox)
 */

// ─── HTML Helpers ─────────────────────────────────────────────────────────────
function htmlBase(title, body) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Inter", sans-serif;
      background-color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      color: #0f172a;
      text-align: center;
    }
    .logo-container {
      margin-top: 30px;
      margin-bottom: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo-main {
      display: flex;
      align-items: center;
    }
    .logo-icon {
      width: 18px;
      height: 18px;
      border: 3px solid #00aeef;
      border-radius: 50% 50% 0 50%;
      transform: rotate(-15deg);
      position: relative;
    }
    .logo-dot {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 7px;
      height: 7px;
      background: #00aeef;
      border-radius: 50%;
    }
    .logo-text {
      margin-left: 6px;
      font-size: 28px;
      font-weight: 900;
      color: #004a80;
      letter-spacing: -1px;
    }
    .logo-text span { color: #00aeef; }
    .logo-sub {
      font-size: 7px;
      color: #004a80;
      font-weight: 700;
      letter-spacing: 3px;
      margin-top: -4px;
      margin-left: 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 900;
      margin-bottom: 25px;
      color: #004a80;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .card {
      background: white;
      padding: 40px 30px;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0,74,128,0.1);
      width: 100%;
      max-width: 440px;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #004a80, #00aeef);
    }
    .success-icon {
      width: 64px;
      height: 64px;
      background: #f0fdf4;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
    }
    .error-icon {
      width: 64px;
      height: 64px;
      background: #fef2f2;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #f0fdf4;
      color: #16a34a;
      border-radius: 12px;
      font-weight: 900;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      border: 1px solid #bcf0da;
    }
    .info-group {
      text-align: left;
      margin-top: 10px;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { 
      color: #64748b; 
      font-weight: 700; 
      font-size: 10px; 
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .info-value { 
      color: #0f172a; 
      font-weight: 700; 
      font-size: 15px;
    }
    .btn-action {
      background: #004a80;
      color: white;
      border: none;
      padding: 18px 0;
      width: 100%;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
      text-decoration: none;
      display: block;
      margin-top: 30px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s;
      box-shadow: 0 10px 20px rgba(0,74,128,0.2);
    }
    .btn-action:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0,74,128,0.3); }
    input[type="text"] {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid #f1f5f9;
      border-radius: 16px;
      font-size: 16px;
      font-family: "Inter", sans-serif;
      outline: none;
      text-align: center;
      font-weight: 700;
      background: #f8fafc;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus { border-color: #00aeef; }
    .footer-text {
      margin-top: 40px;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .hash-display {
      font-family: monospace;
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="logo-container">
    <div class="logo-main">
      <div class="logo-icon"><div class="logo-dot"></div></div>
      <div class="logo-text">innova<span>tox</span></div>
    </div>
    <div class="logo-sub">ANÁLISES E PESQUISAS</div>
  </div>
  <h1>Validação de Laudo</h1>
  ${body}
  <div class="footer-text">
    INNOVATOX Análises e Pesquisas Ltda.<br>
    Rua Levindo Lima, 55 - Pq. Campolim, Sorocaba - SP<br>
    CNPJ: 28.256.904/0001-00
  </div>
</body>
</html>`;
}

function renderSuccess(doc) {
  const data = typeof doc.data === "string" ? JSON.parse(doc.data) : doc.data;
  const nome = data.nome || doc.nome || "—";
  const cpf = data.cpf || doc.cpf || "—";
  const laudo = data.laudoNumero || "—";
  const emissao = data.dataEmissao || "—";
  const validade = "90 DIAS (CNH) / 60 DIAS (CLT)";
  const hash = doc.codigo_validacao ? doc.codigo_validacao.replace(/-/g, "").toUpperCase() : "";

  return htmlBase("Laudo Verificado - Innovatox", `
    <div class="card">
      <div class="success-icon">✅</div>
      <div class="status-badge">Documento Autêntico</div>
      <div class="info-group">
        <div class="info-row">
          <span class="info-label">Doador</span>
          <span class="info-value">${nome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CPF</span>
          <span class="info-value">${cpf}</span>
        </div>
        <div class="info-row">
          <span class="info-label">N° do Laudo</span>
          <span class="info-value">${laudo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data de Emissão</span>
          <span class="info-value">${emissao}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Validade</span>
          <span class="info-value">${validade}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Resultado</span>
          <span class="info-value" style="color: #16a34a;">NEGATIVO</span>
        </div>
      </div>
      <div class="hash-display">HASH: ${hash}</div>
      <button class="btn-action" onclick="window.print()">Imprimir Comprovante</button>
    </div>
  `);
}

function renderNotFound(codigo) {
  return htmlBase("Erro na Validação - Innovatox", `
    <div class="card">
      <div class="error-icon">❌</div>
      <p style="font-size:18px;font-weight:900;color:#0f172a;margin-bottom:12px;text-transform:uppercase;">Não Encontrado</p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px;">
        O código <strong>${codigo || ""}</strong> não foi localizado em nossa base de dados oficial.
      </p>
      <a href="/" style="display:block;margin-top:16px;color:#00aeef;font-size:12px;font-weight:900;text-decoration:none;text-transform:uppercase;">
        ← Tentar outro código
      </a>
    </div>
  `);
}

function renderSearch() {
  return htmlBase("Validação Innovatox", `
    <div class="card">
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:30px;">
        Digite o código de validação presente no rodapé do laudo para verificar sua autenticidade.
      </p>
      <form method="GET" action="/">
        <input type="text" name="codigo" placeholder="XXXX.XXXX" maxlength="20" autocomplete="off" />
        <button type="submit" class="btn-action">Verificar Documento</button>
      </form>
    </div>
  `);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const codigo = url.searchParams.get("codigo") || url.searchParams.get("id") || "";

    const headers = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    };

    if (!codigo) {
      return new Response(renderSearch(), { headers });
    }

    const codigoNorm = codigo.trim().toUpperCase();

    try {
      const result = await env.DB.prepare(
        "SELECT id, nome, cpf, data, codigo_validacao, type, created_at FROM documents WHERE (codigo_validacao = ? OR id = ?) AND type = 'toxicria' LIMIT 1"
      ).bind(codigoNorm, codigoNorm).first();

      if (!result) {
        return new Response(renderNotFound(codigoNorm), { status: 404, headers });
      }

      return new Response(renderSuccess(result), { headers });
    } catch (err) {
      console.error("DB error:", err);
      return new Response(renderNotFound(codigoNorm), { status: 500, headers });
    }
  }
};
