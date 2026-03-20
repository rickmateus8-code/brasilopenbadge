/**
 * Migração RÁPIDA: Supabase → Cloudflare D1 via API REST
 * Usa a API REST do Cloudflare D1 diretamente (sem wrangler CLI)
 * Muito mais rápido que via wrangler local
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Configurações
const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";
const CF_ACCOUNT_ID = "8f0446ea9cc0218364493885ddc1c419";
const DB_ID = "0cfb948c-fd13-4e09-8eaf-26df02e3e615";
const TOTAL = 1098170;
const BATCH_SB = 500;    // buscar 500 do Supabase por vez
const BATCH_SQL = 50;    // inserir 50 por INSERT no D1

// Obter token CF via wrangler
function getCFToken() {
  try {
    // Tentar pegar do ambiente
    if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
    // Tentar via wrangler whoami para pegar token
    const result = execSync('npx wrangler whoami 2>&1', { cwd: '/home/ubuntu/docmaster' }).toString();
    const tokenMatch = result.match(/token[:\s]+([a-zA-Z0-9_-]{40,})/i);
    if (tokenMatch) return tokenMatch[1];
    return null;
  } catch (e) {
    return null;
  }
}

function escape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function buildInsertSQL(rows) {
  const values = rows.map(m =>
    `(${m.id}, ${escape(m.nome_medico)}, ${escape(m.crm)}, ${escape(m.uf_crm)}, ` +
    `${escape(m.especialidade)}, ${escape(m.cod_cbo)}, ${escape(m.cod_cnes)}, ` +
    `${escape(m.local_trabalho)}, ${escape(m.cidade)}, ${escape(m.uf_local)}, ` +
    `${escape(m.endereco)}, ${escape(m.bairro)}, ${escape(m.telefone)})`
  );
  return `INSERT OR IGNORE INTO medicos_brasil (id, nome_medico, crm, uf_crm, especialidade, cod_cbo, cod_cnes, local_trabalho, cidade, uf_local, endereco, bairro, telefone) VALUES ${values.join(', ')}`;
}

async function cfD1Query(sql, token) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params: [] })
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result;
}

async function fetchBatch(offset) {
  const res = await fetch(
    `${SB_URL}/rest/v1/medicos_brasil?limit=${BATCH_SB}&offset=${offset}&order=id.asc`,
    {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
      }
    }
  );
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  return res.json();
}

async function getExistingCount(token) {
  try {
    const result = await cfD1Query("SELECT COUNT(*) as cnt FROM medicos_brasil", token);
    return result[0]?.results?.[0]?.cnt || 0;
  } catch (e) {
    return 0;
  }
}

async function migrate() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`MIGRAÇÃO RÁPIDA: Supabase → Cloudflare D1 (via API REST)`);
  console.log(`Total: ${TOTAL.toLocaleString()} médicos`);
  console.log(`${'='.repeat(60)}\n`);

  // Obter token
  const token = getCFToken();
  if (!token) {
    console.error("❌ Token Cloudflare não encontrado. Verifique as credenciais.");
    process.exit(1);
  }
  console.log("✅ Token Cloudflare obtido.");

  // Verificar quantos já foram migrados
  const existing = await getExistingCount(token);
  let offset = existing;
  let totalInserted = existing;
  
  if (existing > 0) {
    console.log(`✅ Já existem ${existing.toLocaleString()} médicos no D1. Continuando...`);
  }

  const startTime = Date.now();

  while (offset < TOTAL) {
    try {
      const medicos = await fetchBatch(offset);
      if (!medicos || medicos.length === 0) break;

      // Inserir em sub-lotes
      for (let i = 0; i < medicos.length; i += BATCH_SQL) {
        const sub = medicos.slice(i, i + BATCH_SQL);
        const sql = buildInsertSQL(sub);
        await cfD1Query(sql, token);
        totalInserted += sub.length;
      }

      offset += medicos.length;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const pct = ((totalInserted / TOTAL) * 100).toFixed(1);
      const rate = (totalInserted / Math.max(1, (Date.now() - startTime) / 1000)).toFixed(0);
      const eta = Math.round((TOTAL - totalInserted) / Math.max(1, rate));
      
      process.stdout.write(`\r[${pct}%] ${totalInserted.toLocaleString()}/${TOTAL.toLocaleString()} | ${rate} reg/s | ETA: ${eta}s`);
      fs.writeFileSync('/tmp/medicos_progress.txt', `${totalInserted}`);

    } catch (err) {
      console.error(`\nErro no offset ${offset}:`, err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ MIGRAÇÃO CONCLUÍDA! ${totalInserted.toLocaleString()} médicos em ${totalTime}s`);
}

migrate().catch(console.error);
