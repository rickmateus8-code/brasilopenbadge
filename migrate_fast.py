#!/usr/bin/env python3
"""
Migração otimizada dos médicos do Supabase para o D1 via MCP CLI
Lotes maiores (200 por SQL) e mais workers paralelos
"""
import json
import subprocess
import time
import sys
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

SB_URL = "https://ijkzwzvanougkjcxquvn.supabase.co"
SB_KEY = "sb_publishable_x76vx-9M9DrmibJ6NeELJg_iT1_CDsT"
DB_ID = "0cfb948c-fd13-4e09-8eaf-26df02e3e615"
TOTAL = 1_098_170
BATCH_SB = 1000   # buscar 1000 do Supabase por vez
BATCH_SQL = 100   # inserir 100 por SQL
MAX_WORKERS = 8   # 8 workers paralelos

PROGRESS_FILE = "/tmp/medicos_progress.txt"
LOG_FILE = "/tmp/migration_log.txt"

def escape(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

def build_insert(rows):
    cols = "id, nome_medico, crm, uf_crm, especialidade, cod_cbo, cod_cnes, local_trabalho, cidade, uf_local, endereco, bairro, telefone"
    values = []
    for m in rows:
        v = (f"({m['id']}, {escape(m['nome_medico'])}, {escape(m['crm'])}, "
             f"{escape(m['uf_crm'])}, {escape(m['especialidade'])}, "
             f"{escape(m['cod_cbo'])}, {escape(m['cod_cnes'])}, "
             f"{escape(m['local_trabalho'])}, {escape(m['cidade'])}, "
             f"{escape(m['uf_local'])}, {escape(m['endereco'])}, "
             f"{escape(m['bairro'])}, {escape(m['telefone'])})")
        values.append(v)
    return f"INSERT OR IGNORE INTO medicos_brasil ({cols}) VALUES {', '.join(values)}"

def mcp_query(sql):
    payload = json.dumps({"database_id": DB_ID, "sql": sql})
    result = subprocess.run(
        ["manus-mcp-cli", "tool", "call", "d1_database_query", "--server", "cloudflare", "--input", payload],
        capture_output=True, text=True, timeout=90
    )
    if result.returncode != 0:
        raise Exception(f"MCP error: {result.stderr[:200]}")
    return result.stdout

def fetch_batch(offset):
    headers = {
        'apikey': SB_KEY,
        'Authorization': f'Bearer {SB_KEY}'
    }
    res = requests.get(
        f"{SB_URL}/rest/v1/medicos_brasil?limit={BATCH_SB}&offset={offset}&order=id.asc",
        headers=headers, timeout=30
    )
    res.raise_for_status()
    return res.json()

def get_current_count():
    try:
        result = mcp_query("SELECT COUNT(*) as cnt FROM medicos_brasil")
        data = json.loads(result)
        if isinstance(data, list) and data:
            results = data[0].get('results', [])
            if results:
                return results[0].get('cnt', 0)
    except:
        pass
    return 0

def log(msg):
    print(msg, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(msg + '\n')

def process_batch(rows_chunk):
    """Processa um lote de linhas em sub-lotes de BATCH_SQL"""
    total_inserted = 0
    for i in range(0, len(rows_chunk), BATCH_SQL):
        sub = rows_chunk[i:i+BATCH_SQL]
        sql = build_insert(sub)
        try:
            mcp_query(sql)
            total_inserted += len(sub)
        except Exception as e:
            log(f"  ⚠️ Erro no sub-lote: {e}")
    return total_inserted

def main():
    log("🚀 Iniciando migração otimizada...")
    
    # Verificar quantos já foram inseridos
    current = get_current_count()
    log(f"✅ Já existem {current:,} médicos no banco. Continuando de onde parou...")
    
    start_offset = current
    inserted = current
    start_time = time.time()
    
    with open(PROGRESS_FILE, 'w') as f:
        f.write(str(current))
    
    offset = start_offset
    
    while offset < TOTAL:
        # Buscar lote do Supabase
        try:
            rows = fetch_batch(offset)
        except Exception as e:
            log(f"❌ Erro ao buscar do Supabase (offset={offset}): {e}")
            time.sleep(5)
            continue
        
        if not rows:
            log("✅ Migração concluída! Sem mais registros.")
            break
        
        # Dividir em chunks para processamento paralelo
        chunk_size = BATCH_SQL
        chunks = [rows[i:i+chunk_size] for i in range(0, len(rows), chunk_size)]
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(process_batch, chunk): chunk for chunk in chunks}
            for future in as_completed(futures):
                try:
                    n = future.result()
                    inserted += n
                except Exception as e:
                    log(f"  ⚠️ Erro no worker: {e}")
        
        offset += len(rows)
        elapsed = time.time() - start_time
        rate = (inserted - start_offset) / elapsed if elapsed > 0 else 0
        eta = (TOTAL - inserted) / rate if rate > 0 else 0
        pct = (inserted / TOTAL) * 100
        
        log(f"[{pct:.1f}%] {inserted:,}/{TOTAL:,} | {rate:.0f} reg/s | ETA: {eta:.0f}s | {elapsed:.0f}s decorridos")
        
        with open(PROGRESS_FILE, 'w') as f:
            f.write(str(inserted))
    
    log(f"🎉 Migração finalizada! Total: {inserted:,} médicos no D1")

if __name__ == '__main__':
    main()
