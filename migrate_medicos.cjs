const fs = require('fs');
const { execSync } = require('child_process');

async function migrate() {
  console.log("Iniciando migração de médicos do Supabase para o D1...");
  
  const SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co";
  const SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT";
  
  try {
    console.log("Buscando 1000 médicos do Supabase...");
    const res = await fetch(`${SB_URL}/rest/v1/medicos_brasil?limit=1000`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`
      }
    });
    
    const medicos = await res.json();
    console.log(`Encontrados ${medicos.length} médicos.`);
    
    // Gerar SQL de inserção em lotes de 100
    let sql = "";
    const batchSize = 100;
    
    for (let i = 0; i < medicos.length; i += batchSize) {
      const batch = medicos.slice(i, i + batchSize);
      sql += "INSERT INTO medicos_brasil (id, nome_medico, crm, uf_crm, especialidade, cod_cbo, cod_cnes, local_trabalho, cidade, uf_local, endereco, bairro, telefone) VALUES\n";
      
      const values = batch.map(m => {
        const escape = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
        return `(${m.id}, ${escape(m.nome_medico)}, ${escape(m.crm)}, ${escape(m.uf_crm)}, ${escape(m.especialidade)}, ${escape(m.cod_cbo)}, ${escape(m.cod_cnes)}, ${escape(m.local_trabalho)}, ${escape(m.cidade)}, ${escape(m.uf_local)}, ${escape(m.endereco)}, ${escape(m.bairro)}, ${escape(m.telefone)})`;
      });
      
      sql += values.join(",\n") + ";\n\n";
    }
    
    fs.writeFileSync('medicos_seed.sql', sql);
    console.log("Arquivo medicos_seed.sql gerado com sucesso.");
    
    console.log("Aplicando no banco local...");
    execSync('npx wrangler d1 execute docmaster-db --local --file=medicos_seed.sql', { stdio: 'inherit' });
    console.log("Migração local concluída com sucesso!");
    
  } catch (e) {
    console.error("Erro na migração:", e);
  }
}

migrate();
