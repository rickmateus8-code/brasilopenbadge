/**
 * Worker: valida-laudo-sodre
 * Domínio: valida-laudo-sodre.online
 * Referência: https://valida-laudo-sodre.online/?codigo=UF6DTXEQMV45ATPAF
 *
 * Fluxo:
 *   GET /?codigo=XXXX.XXXX  → consulta D1 do DocMaster → renderiza laudo ou erro
 *   GET /                   → página de busca
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
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Montserrat", sans-serif;
      background-color: #f0f0f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      color: #333;
      text-align: center;
    }
    h1 {
      font-size: 26px;
      font-weight: 400;
      margin-bottom: 25px;
      color: #333;
    }
    .card {
      background: white;
      padding: 40px 30px;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 440px;
    }
    .success-icon {
      width: 64px;
      height: 64px;
      background: #e8f5e9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
    }
    .error-icon {
      width: 64px;
      height: 64px;
      background: #ffeaea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
    }
    .success-text {
      font-size: 15px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
      font-weight: 400;
    }
    .error-text {
      font-size: 15px;
      line-height: 1.6;
      color: #777;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      text-align: left;
      font-size: 14px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #999; font-weight: 400; }
    .info-value { color: #333; font-weight: 600; text-align: right; max-width: 60%; }
    .btn-download {
      background-color: #4a4f55;
      color: white;
      border: none;
      padding: 18px 0;
      width: 100%;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: block;
      margin-top: 24px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: opacity 0.2s;
    }
    .btn-download:hover { opacity: 0.9; }
    .btn-buscar {
      background-color: #4a4f55;
      color: white;
      border: none;
      padding: 14px 0;
      width: 100%;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 16px;
      transition: opacity 0.2s;
    }
    .btn-buscar:hover { opacity: 0.85; }
    input[type="text"] {
      width: 100%;
      padding: 14px 18px;
      border: 2px solid #e0e0e0;
      border-radius: 50px;
      font-size: 16px;
      font-family: "Montserrat", sans-serif;
      outline: none;
      text-align: center;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    input[type="text"]:focus { border-color: #4a4f55; }
    .contact-info {
      font-size: 14px;
      color: #666;
      margin-top: 35px;
      line-height: 1.5;
      padding: 0 10px;
    }
    .footer-container {
      margin-top: 50px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .footer-logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2d3748, #4a5568);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 20px;
      margin-bottom: 12px;
    }
    .footer-address {
      font-size: 12px;
      color: #aaa;
      max-width: 320px;
      line-height: 1.5;
    }
    .divider {
      width: 40px;
      height: 3px;
      background: #4a4f55;
      border-radius: 2px;
      margin: 16px auto;
    }
    .codigo-display {
      font-family: monospace;
      font-size: 18px;
      font-weight: 700;
      color: #4a4f55;
      letter-spacing: 3px;
      background: #f5f5f5;
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-block;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="footer-logo">S</div>
  <h1>Verificação de Laudo</h1>
  ${body}
  <div class="footer-container">
    <div class="footer-address">
      Sodré SL Diagnósticos E Pesquisas Laboratoriais LTDA,<br>
      Rua Luiz Gama nº 1801, Lins/SP, 16.400-472
    </div>
  </div>
</body>
</html>`;
}

function renderSuccess(doc) {
  const data = typeof doc.data === "string" ? JSON.parse(doc.data) : (doc.data || {});
  const nome = data.nome || doc.nome || "—";
  const cpf = data.cpf || doc.cpf || "—";
  const dataColeta = data.dataColeta || "—";
  const dataLiberacao = data.dataLiberacao || "—";
  const validadeExame = data.validadeExame || "—";
  const codigo = doc.codigo_validacao || doc.id || "—";

  return htmlBase("Verificação de Laudo - Sodré", `
    <div class="card">
      <div class="success-icon">✅</div>
      <div class="success-text">
        Laudo verificado com sucesso, realize o download da versão mais recente para conferência de informações.
      </div>
      <div class="divider"></div>
      <div class="codigo-display">${codigo}</div>
      <div style="margin-top: 20px;">
        <div class="info-row">
          <span class="info-label">Paciente</span>
          <span class="info-value">${nome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CPF</span>
          <span class="info-value">${cpf}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data da Coleta</span>
          <span class="info-value">${dataColeta}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data de Liberação</span>
          <span class="info-value">${dataLiberacao}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Validade do Exame</span>
          <span class="info-value">${validadeExame}</span>
        </div>
      </div>
      <a href="#" class="btn-download" onclick="window.print();return false;">Baixar laudo</a>
      <div class="contact-info">
        Em caso de dúvidas entre em contato com a nossa central relacionamento.
      </div>
    </div>
  `);
}

function renderNotFound(codigo) {
  return htmlBase("Verificação de Laudo - Sodré", `
    <div class="card">
      <div class="error-icon">❌</div>
      <p style="font-size:18px;font-weight:600;color:#333;margin-bottom:12px;">Laudo não encontrado</p>
      <p class="error-text">
        O código informado não existe ou foi digitado incorretamente.
      </p>
      <a href="/" style="display:block;margin-top:16px;color:#4a4f55;font-size:14px;font-weight:600;text-decoration:none;">
        ← Tentar outro código
      </a>
    </div>
  `);
}

function renderSearch() {
  return htmlBase("Verificação de Laudo - Sodré", `
    <div class="card">
      <p class="success-text">
        Informe o código do laudo para verificar sua autenticidade.
      </p>
      <form method="GET" action="/">
        <input type="text" name="codigo" placeholder="XXXX.XXXX" maxlength="9" autocomplete="off" />
        <button type="submit" class="btn-buscar">Verificar Laudo</button>
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
      // Consultar laudocria no D1 do DocMaster
      const result = await env.DB.prepare(
        "SELECT id, nome, cpf, data, codigo_validacao, type, created_at FROM documents WHERE (codigo_validacao = ? OR id = ?) AND type IN ('laudocria', 'toxicria') LIMIT 1"
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
