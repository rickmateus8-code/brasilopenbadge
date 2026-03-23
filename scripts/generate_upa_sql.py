#!/usr/bin/env python3
"""
Script para buscar detalhes das UPAs via API CNES e gerar SQL de inserção no banco D1.
Evita duplicidade via INSERT OR IGNORE.
"""

import requests
import json
import time
import unicodedata
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def normalize(s):
    """Normaliza string: remove acentos, converte para maiúsculas"""
    if not s:
        return ""
    s = str(s)
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return s.upper().strip()

def buscar_detalhes_cnes(cnes_code):
    """Busca detalhes de um estabelecimento via API do CNES"""
    try:
        url = f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/{cnes_code}"
        r = requests.get(url, headers=HEADERS, timeout=8)
        if r.status_code == 200:
            return r.json()
    except:
        pass
    return None

def main():
    print("=== Gerando SQL de inserção de UPAs ===\n")
    
    # Carregar dados brutos
    with open('/home/ubuntu/docmaster/scripts/upas_raw.json', 'r', encoding='utf-8') as f:
        upas = json.load(f)
    
    print(f"Total de UPAs para processar: {len(upas)}")
    
    # Buscar detalhes via API (em lotes para não sobrecarregar)
    upas_com_detalhes = []
    
    print("Buscando detalhes via API CNES (pode demorar alguns minutos)...")
    for i, upa in enumerate(upas):
        if i % 100 == 0:
            print(f"  Processando {i}/{len(upas)}...")
        
        det = buscar_detalhes_cnes(upa['cnes'])
        
        if det:
            endereco = normalize(det.get('endereco_estabelecimento', ''))
            numero = str(det.get('numero_estabelecimento', '') or '').strip()
            bairro = normalize(det.get('bairro_estabelecimento', ''))
            cep = str(det.get('codigo_cep_estabelecimento', '') or '').strip()
            
            # Montar endereço completo
            if endereco and numero and numero not in ('0', 'S/N', ''):
                end_completo = f"{endereco}, {numero}"
            elif endereco:
                end_completo = endereco
            else:
                end_completo = ''
        else:
            end_completo = ''
            bairro = ''
            cep = ''
        
        upas_com_detalhes.append({
            'cnes': upa['cnes'],
            'nome': upa['nome'],
            'municipio': upa['municipio'],
            'uf': upa['uf'],
            'endereco': end_completo,
            'bairro': bairro,
            'cep': cep,
        })
        
        time.sleep(0.05)  # Rate limit suave
    
    # Salvar dados detalhados
    with open('/home/ubuntu/docmaster/scripts/upas_com_detalhes.json', 'w', encoding='utf-8') as f:
        json.dump(upas_com_detalhes, f, ensure_ascii=False, indent=2)
    
    print(f"\nDados detalhados salvos.")
    
    # Gerar SQL
    gerar_sql(upas_com_detalhes)

def gerar_sql(upas):
    """Gera SQL de inserção no banco D1"""
    print("\nGerando SQL de inserção...")
    
    sql_lines = [
        "-- SQL de inserção de UPAs no banco D1 do DocMaster",
        "-- Fonte: CNES DataSUS (Tipo 73 - Pronto Atendimento)",
        "-- Gerado automaticamente - Evita duplicidade via INSERT OR IGNORE",
        f"-- Total de registros: {len(upas)}",
        "",
        "BEGIN TRANSACTION;",
        ""
    ]
    
    # Médicos genéricos de UPA para complementar
    # Cada UPA terá 2-3 médicos: um Clínico Geral, um Pediatra, um Emergencista
    especialidades_upa = [
        ("CLINICO GERAL", "CLINICO GERAL"),
        ("PEDIATRIA", "PEDIATRA"),
        ("MEDICINA DE EMERGENCIA", "EMERGENCISTA"),
    ]
    
    inseridos = 0
    for upa in upas:
        nome_upa = upa['nome'].replace("'", "''")
        municipio = upa['municipio'].replace("'", "''")
        uf = upa['uf']
        endereco = upa.get('endereco', '').replace("'", "''")
        bairro = upa.get('bairro', '').replace("'", "''")
        
        # Nome do médico: "UPA {NOME}" se não começar com UPA
        if nome_upa.startswith('UPA'):
            local_trabalho = nome_upa
        else:
            local_trabalho = f"UPA {nome_upa}"
        
        # Inserir um registro por UPA (como local de trabalho)
        # CRM fictício baseado no CNES para evitar duplicidade
        crm_base = f"UPA{upa['cnes']}"
        
        # Inserir registro principal da UPA
        sql_lines.append(
            f"INSERT OR IGNORE INTO medicos_brasil "
            f"(nome_medico, crm, uf_crm, especialidade, local_trabalho, cidade, uf_local, endereco, bairro) VALUES "
            f"('{local_trabalho}', '{crm_base}', '{uf}', 'CLINICO GERAL', '{local_trabalho}', '{municipio}', '{uf}', '{endereco}', '{bairro}');"
        )
        inseridos += 1
    
    sql_lines.extend([
        "",
        "COMMIT;",
        "",
        f"-- Total inserido: {inseridos} UPAs"
    ])
    
    sql_content = '\n'.join(sql_lines)
    
    with open('/home/ubuntu/docmaster/scripts/insert_upas.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"SQL gerado: insert_upas.sql ({inseridos} registros)")
    
    # Gerar também versão em lotes menores para o endpoint de migração
    gerar_sql_lotes(upas)

def gerar_sql_lotes(upas):
    """Gera SQL em lotes de 100 para inserção via endpoint"""
    print("Gerando SQL em lotes para endpoint de migração...")
    
    lote_size = 100
    lotes = []
    
    for i in range(0, len(upas), lote_size):
        lote = upas[i:i+lote_size]
        valores = []
        
        for upa in lote:
            nome_upa = upa['nome'].replace("'", "''")
            municipio = upa['municipio'].replace("'", "''")
            uf = upa['uf']
            endereco = upa.get('endereco', '').replace("'", "''")
            bairro = upa.get('bairro', '').replace("'", "''")
            
            if nome_upa.startswith('UPA'):
                local_trabalho = nome_upa
            else:
                local_trabalho = f"UPA {nome_upa}"
            
            crm_base = f"UPA{upa['cnes']}"
            
            valores.append(
                f"('{local_trabalho}', '{crm_base}', '{uf}', 'CLINICO GERAL', '{local_trabalho}', '{municipio}', '{uf}', '{endereco}', '{bairro}')"
            )
        
        lotes.append(valores)
    
    # Salvar lotes como JSON para o endpoint
    with open('/home/ubuntu/docmaster/scripts/upas_lotes.json', 'w', encoding='utf-8') as f:
        json.dump(lotes, f, ensure_ascii=False)
    
    print(f"Lotes gerados: {len(lotes)} lotes de {lote_size} registros")

if __name__ == '__main__':
    main()
