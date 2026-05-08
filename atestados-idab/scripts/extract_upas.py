#!/usr/bin/env python3
"""
Script para extrair dados de UPAs de todo o Brasil via CNES DataSUS
e gerar SQL de inserção no banco D1 do DocMaster.

Fonte: http://cnes2.datasus.gov.br/Mod_Ind_Unidade_Listar.asp?VTipo=73
Tipo 73 = Pronto Atendimento (UPA)
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import unicodedata

# Mapeamento de código IBGE -> UF
ESTADOS = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA",
    "16": "AP", "17": "TO", "21": "MA", "22": "PI", "23": "CE",
    "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE",
    "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
    "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT",
    "52": "GO", "53": "DF"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def normalize(s):
    """Normaliza string: remove acentos, converte para maiúsculas"""
    if not s:
        return ""
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return s.upper().strip()

def extrair_upas_estado(codigo_estado, uf):
    """Extrai UPAs de um estado via scraping do CNES DataSUS"""
    url = f"http://cnes2.datasus.gov.br/Mod_Ind_Unidade_Listar.asp?VTipo=73&VListar=1&VEstado={codigo_estado}&VMun=&VSubUni=&VComp="
    
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.encoding = 'iso-8859-1'
        soup = BeautifulSoup(r.text, 'html.parser')
        
        upas = []
        tables = soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 3:
                    cnes = cols[0].get_text(strip=True)
                    nome = cols[1].get_text(strip=True)
                    municipio = cols[2].get_text(strip=True)
                    
                    # Verificar se é um registro válido (CNES é numérico)
                    if cnes and cnes.isdigit() and nome and municipio:
                        # Filtrar apenas UPAs (nome contém UPA ou PRONTO ATENDIMENTO)
                        nome_upper = nome.upper()
                        if ('UPA' in nome_upper or 
                            'PRONTO ATENDIMENTO' in nome_upper or
                            'URGENCIA' in nome_upper or
                            'EMERGENCIA' in nome_upper):
                            upas.append({
                                'cnes': cnes,
                                'nome': normalize(nome),
                                'municipio': normalize(municipio),
                                'uf': uf
                            })
        
        return upas
    except Exception as e:
        print(f"  Erro ao extrair {uf}: {e}")
        return []

def buscar_detalhes_cnes(cnes_code):
    """Busca detalhes de um estabelecimento via API do CNES"""
    try:
        url = f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/{cnes_code}"
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            return r.json()
    except:
        pass
    return None

def main():
    print("=== Extração de UPAs do CNES DataSUS ===\n")
    
    todas_upas = []
    
    for codigo, uf in ESTADOS.items():
        print(f"Extraindo UPAs de {uf} (código {codigo})...")
        upas = extrair_upas_estado(codigo, uf)
        print(f"  → {len(upas)} UPAs encontradas")
        todas_upas.extend(upas)
        time.sleep(0.5)  # Respeitar rate limit
    
    print(f"\nTotal de UPAs extraídas: {len(todas_upas)}")
    
    # Salvar dados brutos
    with open('/home/ubuntu/docmaster/scripts/upas_raw.json', 'w', encoding='utf-8') as f:
        json.dump(todas_upas, f, ensure_ascii=False, indent=2)
    
    print(f"Dados salvos em upas_raw.json")
    
    # Buscar detalhes adicionais via API (endereço, bairro, telefone)
    print("\nBuscando detalhes adicionais via API CNES...")
    upas_detalhadas = []
    
    for i, upa in enumerate(todas_upas[:500]):  # Limitar para não sobrecarregar
        if i % 50 == 0:
            print(f"  Processando {i}/{min(500, len(todas_upas))}...")
        
        detalhes = buscar_detalhes_cnes(upa['cnes'])
        if detalhes:
            upa_det = {
                'cnes': upa['cnes'],
                'nome': upa['nome'],
                'municipio': upa['municipio'],
                'uf': upa['uf'],
                'endereco': normalize(detalhes.get('endereco_estabelecimento', '')),
                'numero': detalhes.get('numero_estabelecimento', ''),
                'bairro': normalize(detalhes.get('bairro_estabelecimento', '')),
                'cep': detalhes.get('codigo_cep_estabelecimento', ''),
                'telefone': detalhes.get('numero_telefone_estabelecimento', ''),
            }
        else:
            upa_det = {
                'cnes': upa['cnes'],
                'nome': upa['nome'],
                'municipio': upa['municipio'],
                'uf': upa['uf'],
                'endereco': '',
                'numero': '',
                'bairro': '',
                'cep': '',
                'telefone': '',
            }
        
        upas_detalhadas.append(upa_det)
        time.sleep(0.1)
    
    # Salvar dados detalhados
    with open('/home/ubuntu/docmaster/scripts/upas_detalhadas.json', 'w', encoding='utf-8') as f:
        json.dump(upas_detalhadas, f, ensure_ascii=False, indent=2)
    
    print(f"\nDados detalhados salvos em upas_detalhadas.json")
    
    # Gerar SQL de inserção
    gerar_sql(todas_upas, upas_detalhadas)

def gerar_sql(upas_basicas, upas_detalhadas):
    """Gera SQL de inserção no banco D1"""
    print("\nGerando SQL de inserção...")
    
    # Criar mapa de detalhes por CNES
    detalhes_map = {u['cnes']: u for u in upas_detalhadas}
    
    sql_lines = [
        "-- SQL de inserção de UPAs no banco D1 do DocMaster",
        "-- Gerado automaticamente via CNES DataSUS",
        "-- Evita duplicidade via INSERT OR IGNORE",
        "",
        "BEGIN TRANSACTION;",
        ""
    ]
    
    inseridos = 0
    for upa in upas_basicas:
        det = detalhes_map.get(upa['cnes'], upa)
        
        nome = det['nome'].replace("'", "''")
        municipio = det['municipio'].replace("'", "''")
        uf = det['uf']
        endereco = det.get('endereco', '').replace("'", "''")
        numero = str(det.get('numero', '')).replace("'", "''")
        bairro = det.get('bairro', '').replace("'", "''")
        
        # Montar endereço completo
        if endereco and numero:
            end_completo = f"{endereco}, {numero}"
        elif endereco:
            end_completo = endereco
        else:
            end_completo = ''
        
        # Montar local_trabalho com nome da UPA
        local_trabalho = nome
        
        # CRM fictício para UPA (padrão: UPA + código CNES)
        crm_upa = f"UPA{upa['cnes']}"
        
        # Nome do médico padrão: "UPA {NOME_DA_UPA}"
        nome_medico = f"UPA {nome}" if not nome.startswith('UPA') else nome
        
        sql_lines.append(
            f"INSERT OR IGNORE INTO medicos_brasil "
            f"(nome_medico, crm, uf_crm, especialidade, local_trabalho, cidade, uf_local, endereco, bairro) VALUES "
            f"('{nome_medico}', '{crm_upa}', '{uf}', 'CLINICO GERAL', '{local_trabalho}', '{municipio}', '{uf}', '{end_completo}', '{bairro}');"
        )
        inseridos += 1
    
    sql_lines.extend([
        "",
        "COMMIT;",
        "",
        f"-- Total de UPAs: {inseridos}"
    ])
    
    sql_content = '\n'.join(sql_lines)
    
    with open('/home/ubuntu/docmaster/scripts/insert_upas.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"SQL gerado: insert_upas.sql ({inseridos} registros)")
    return sql_content

if __name__ == '__main__':
    main()
