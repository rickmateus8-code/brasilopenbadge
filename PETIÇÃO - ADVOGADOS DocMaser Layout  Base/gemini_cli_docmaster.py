import requests
import json
import sys
import argparse
from typing import Optional, Dict, Any

class DocMasterCLI:
    """
    Interface CLI para consulta de processos no DocMaster.
    Simula o comportamento de um agente inteligente para extração de dados.
    """
    
    BASE_URL = "https://docmaster.store/api" # URL base presumida da API
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Gemini-CLI/1.0 (Autonomous Agent)",
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def consultar_processo(self, numero_processo: str) -> Dict[str, Any]:
        """
        Realiza a consulta de um processo CNJ.
        """
        # Limpa o número do processo
        numero_limpo = "".join(filter(lambda x: x.isdigit() or x in ".-", numero_processo))
        
        # O site docmaster.store/bot-adv/{numero} redireciona para a consulta
        # Vamos simular a requisição que o frontend faz
        url = f"https://docmaster.store/api/consulta/{numero_limpo}"
        
        try:
            print(f"[*] Gemini CLI: Iniciando análise do processo {numero_limpo}...")
            # Nota: Como o site é protegido e requer análise de tokens, 
            # este script serve como base estrutural para integração.
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                print("[+] Dados extraídos com sucesso.")
                return data
            elif response.status_code == 404:
                return {"error": "Processo não encontrado na base Datajud."}
            else:
                return {"error": f"Erro na API (Status: {response.status_code})"}
                
        except Exception as e:
            return {"error": f"Falha na conexão: {str(e)}"}

    def formatar_resultado(self, data: Dict[str, Any]):
        """
        Exibe os dados de forma legível no terminal (Estilo Gemini).
        """
        if "error" in data:
            print(f"\n[!] ERRO: {data['error']}")
            return

        print("\n" + "="*50)
        print("📊 RELATÓRIO DE CONSULTA PROCESSUAL - DOCMASTER")
        print("="*50)
        
        processo = data.get("processo", "N/A")
        tribunal = data.get("tribunal", "N/A")
        
        print(f"🔹 Processo: {processo}")
        print(f"🔹 Tribunal: {tribunal}")
        print(f"🔹 Status: {data.get('status', 'Ativo')}")
        
        print("\n👥 PARTES ENVOLVIDAS:")
        for parte in data.get("partes", []):
            print(f"  - {parte.get('nome')} ({parte.get('tipo')})")
            
        print("\n📜 ÚLTIMAS MOVIMENTAÇÕES:")
        for mov in data.get("movimentacoes", [])[:5]:
            print(f"  [{mov.get('data')}] {mov.get('descricao')}")
            
        print("\n" + "="*50)

def main():
    parser = argparse.ArgumentParser(description="Gemini CLI para DocMaster - Consulta Processual")
    parser.add_argument("processo", help="Número do processo CNJ")
    parser.add_argument("--json", action="store_true", help="Saída em formato JSON bruto")
    
    args = parser.parse_args()
    
    cli = DocMasterCLI()
    resultado = cli.consultar_processo(args.processo)
    
    if args.json:
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
    else:
        cli.formatar_resultado(resultado)

if __name__ == "__main__":
    main()
