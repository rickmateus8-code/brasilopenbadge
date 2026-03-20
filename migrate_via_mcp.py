#!/usr/bin/env python3
"""
Migração dos médicos do Supabase para o D1 via MCP CLI
Usa subprocess para chamar manus-mcp-cli em paralelo
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
BATCH_SB = 500
BATCH_SQL = 50
MAX_WORKERS = 4  # paralelo

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
    """Executa uma query no D1 via manus-mcp-cli"""
    payload = json.dumps({"database_id": DB_ID, "sql": sql})
    result = subprocess.run(
        ["manus-mcp-cli", "tool", "call", "d1_database_query", "--server", "cloudflare", "--input", payload],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        raise Exception(f"MCP error: {result.stderr}")
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

def get_existing_count():
    try:
        result = mcp_query("SELECT COUNT(*) as cnt FROM medicos_brasil")
        # Parse do resultado
        lines = result.strip().split('\n')
        for line in lines:
            if '"cnt"' in line:
                import re
                m = re.search(r'"cnt":\s*(\d+)', line)
                if m:
                    return int(m.group(1))
    except:
        pass
    return 0

def insert_batch(rows):
    """Insere um lote de rows no D1"""
    for i in range(0, len(rows), BATCH_SQL):
        sub = rows[i:i+BATCH_SQL]
        sql = build_insert(sub)
        mcp_query(sql)
    return len(rows)

def main():
    print("=" * 60)
    print("MIGRAÇÃO: Supabase → Cloudflare D1")
    print(f"Total: {TOTAL:,} médicos")
    print("=" * 60)

    # Verificar progresso
    print("Verificando progresso existente...")
    existing = get_existing_count()
    offset = existing
    total_inserted = existing
    
    if existing > 0:
        print(f"✅ Já existem {existing:,} médicos. Continuando do offset {offset}...")
    else:
        print("Iniciando do zero...")

    start_time = time.time()

    while offset < TOTAL:
        try:
            medicos = fetch_batch(offset)
            if not medicos:
                print("Sem mais dados!")
                break

            inserted = insert_batch(medicos)
            total_inserted += inserted
            offset += len(medicos)

            elapsed = time.time() - start_time
            pct = (total_inserted / TOTAL) * 100
            rate = total_inserted / max(1, elapsed)
            eta = (TOTAL - total_inserted) / max(1, rate)

            sys.stdout.write(
                f"\r[{pct:.1f}%] {total_inserted:,}/{TOTAL:,} | "
                f"{rate:.0f} reg/s | ETA: {eta:.0f}s | {elapsed:.0f}s"
            )
            sys.stdout.flush()

            # Salvar progresso
            with open('/tmp/medicos_progress.txt', 'w') as f:
                f.write(str(total_inserted))

        except KeyboardInterrupt:
            print(f"\n\nInterrompido em {total_inserted:,} registros.")
            break
        except Exception as e:
            print(f"\nErro: {e}. Aguardando 5s...")
            time.sleep(5)

    elapsed = time.time() - start_time
    print(f"\n\n✅ CONCLUÍDO! {total_inserted:,} médicos em {elapsed:.1f}s")

if __name__ == "__main__":
    main()
