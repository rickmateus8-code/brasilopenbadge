/**
 * Migração completa: Supabase → Cloudflare D1
 * 1.098.170 médicos em lotes de 500 registros
 * Usa a API REST do Cloudflare D1 diretamente
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Configurações
const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";
const DB_ID = "0cfb948c-fd13-4e09-8eaf-26df02e3e615";
const BATCH_SB = 1000;   // quantos buscar do Supabase por vez
const BATCH_SQL = 100;   // quantos inserir por INSERT
const TOTAL = 1098170;

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
  return `INSERT OR IGNORE INTO medicos_brasil (id, nome_medico, crm, uf_crm, especialidade, cod_cbo, cod_cnes, local_trabalho, cidade, uf_local, endereco, bairro, telefone) VALUES\n${values.join(',\n')};`;
}

async function fetchBatch(offset) {
  const res = await fetch(
    `${SB_URL}/rest/v1/medicos_brasil?limit=${BATCH_SB}&offset=${offset}&order=id.asc`,
    {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Range-Unit': 'items',
        'Range': `${offset}-${offset + BATCH_SB - 1}`
      }
    }
  );
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function executeSQL(sql) {
  // Salva em arquivo temporário e executa via wrangler local
  const tmpFile = `/tmp/medicos_batch_${Date.now()}.sql`;
  fs.writeFileSync(tmpFile, sql);
  try {
    execSync(`npx wrangler d1 execute docmaster-db --local --file=${tmpFile}`, {
      stdio: 'pipe',
      cwd: '/home/ubuntu/docmaster'
    });
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

async function migrate() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`MIGRAÇÃO: Supabase → Cloudflare D1`);
  console.log(`Total estimado: ${TOTAL.toLocaleString()} médicos`);
  console.log(`${'='.repeat(60)}\n`);

  // Verificar quantos já foram migrados
  let startOffset = 0;
  try {
    const checkResult = execSync(
      `npx wrangler d1 execute docmaster-db --local --command "SELECT COUNT(*) as cnt FROM medicos_brasil" --json`,
      { cwd: '/home/ubuntu/docmaster', stdio: 'pipe' }
    ).toString();
    const parsed = JSON.parse(checkResult);
    const existing = parsed[0]?.results?.[0]?.cnt || 0;
    if (existing > 0) {
      console.log(`✅ Já existem ${existing.toLocaleString()} médicos no banco. Continuando de onde parou...`);
      startOffset = existing;
    }
  } catch (e) {
    console.log("Iniciando do zero...");
  }

  let totalInserted = startOffset;
  let offset = startOffset;
  const startTime = Date.now();

  while (offset < TOTAL) {
    try {
      // Buscar lote do Supabase
      const medicos = await fetchBatch(offset);
      if (!medicos || medicos.length === 0) {
        console.log("Sem mais dados. Migração concluída!");
        break;
      }

      // Inserir em sub-lotes de BATCH_SQL
      for (let i = 0; i < medicos.length; i += BATCH_SQL) {
        const subBatch = medicos.slice(i, i + BATCH_SQL);
        const sql = buildInsertSQL(subBatch);
        await executeSQL(sql);
        totalInserted += subBatch.length;
      }

      offset += medicos.length;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const pct = ((totalInserted / TOTAL) * 100).toFixed(1);
      const rate = (totalInserted / Math.max(1, (Date.now() - startTime) / 1000)).toFixed(0);
      const eta = Math.round((TOTAL - totalInserted) / Math.max(1, rate));
      
      console.log(`[${pct}%] ${totalInserted.toLocaleString()}/${TOTAL.toLocaleString()} | ${rate} reg/s | ETA: ${eta}s | ${elapsed}s decorridos`);

      // Salvar progresso
      fs.writeFileSync('/tmp/medicos_progress.txt', `${totalInserted}`);

    } catch (err) {
      console.error(`Erro no offset ${offset}:`, err.message);
      console.log("Aguardando 5s e tentando novamente...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ MIGRAÇÃO CONCLUÍDA!`);
  console.log(`Total inserido: ${totalInserted.toLocaleString()} médicos`);
  console.log(`Tempo total: ${totalTime}s`);
  console.log(`${'='.repeat(60)}\n`);
}

migrate().catch(console.error);
