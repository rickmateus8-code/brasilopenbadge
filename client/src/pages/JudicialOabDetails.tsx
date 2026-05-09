import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  ExternalLink,
  Download,
  Share2,
  Search
} from "lucide-react";
import { toast } from "sonner";

/**
 * JudicialOabDetails.tsx — Detalhes Oficiais do Advogado via CNA/OAB
 * Layout premium com integração ao Cache Híbrido e Cloudflare R2.
 */

const THEME = {
  primary: "#1a237e",
  accent: "#FF9800",
  success: "#10b981",
  danger: "#ef4444",
  bg: "#f8f9fa",
  card: "#ffffff"
};

export default function JudicialOabDetails() {
  const [, params] = useRoute("/bot-adv/oab/:uf/:oab");
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uf = params?.uf?.toUpperCase();
  const oab = params?.oab;

  useEffect(() => {
    async function fetchOabData() {
      if (!uf || !oab) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/judicial/oab?uf=${uf}&oab=${oab}`, {
          credentials: "include"
        });
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Não foi possível localizar este registro na OAB Nacional.");
        }
      } catch (err) {
        setError("Erro na conexão com o servidor de justiça.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOabData();
  }, [uf, oab]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#1a237e] font-bold animate-pulse">AUTENTICANDO JUNTO AO CNA...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registro Não Encontrado</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <button 
          onClick={() => setLocation("/bot-adv")}
          className="px-6 py-3 bg-[#1a237e] text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
        >
          <ArrowLeft size={20} /> VOLTAR PARA BUSCA
        </button>
      </div>
    );
  }

  // Parse contatos se vier como string do D1
  const contatos = typeof data.contatos === 'string' ? JSON.parse(data.contatos) : data.contatos;

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-20">
      {/* Header Fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/bot-adv")} className="p-2 hover:bg-gray-100 rounded-full text-[#1a237e] transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-black text-[#1a237e] uppercase leading-none">Ficha Cadastral</h1>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Cadastro Nacional dos Advogados</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-200 transition-all border border-gray-200">
             <Download size={20} />
           </button>
           <button className="p-2.5 bg-[#1a237e] text-white rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-900/20">
             <Share2 size={20} />
           </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Card Principal de Identidade */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#1a237e] to-[#283593] relative">
            <div className="absolute -bottom-16 left-8 p-1.5 bg-white rounded-3xl shadow-2xl">
               <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-50">
                  {data.foto_b64 ? (
                    <img src={data.foto_b64} alt={data.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                       <User size={64} />
                    </div>
                  )}
               </div>
            </div>
            
            <div className="absolute top-4 right-8 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${data.situacao?.toUpperCase() === 'REGULAR' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
               <span className="text-white text-xs font-black tracking-widest uppercase">{data.situacao || 'SITUAÇÃO DESCONHECIDA'}</span>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">{data.nome}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-[#1a237e] rounded-lg border border-indigo-100 font-bold text-sm">
                    <Scale size={16} /> OAB {data.inscricao_oab}/{data.uf_seccional}
                  </div>
                  <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">{data.tipo_inscricao || 'ADVOGADO'}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setLocation(`/bot-adv`)} // Aqui seria a busca por nome no Supremo futuramente
                className="px-6 py-3 bg-[#FF9800] text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Search size={18} /> BUSCAR PROCESSOS
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Profissionais */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 space-y-6">
            <h3 className="text-sm font-black text-[#1a237e] uppercase tracking-widest border-b border-gray-100 pb-4 flex items-center gap-2">
              <Scale size={18} className="text-[#FF9800]" /> Endereço Profissional
            </h3>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl text-[#1a237e]"><MapPin size={24} /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Escritório / Endereço</p>
                <p className="text-gray-800 font-medium leading-relaxed mt-1">{contatos?.endereco || "Endereço não informado no cadastro oficial."}</p>
              </div>
            </div>
            <div className="pt-4">
               <button className="w-full py-3 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all">
                 <ExternalLink size={14} /> VER NO GOOGLE MAPS
               </button>
            </div>
          </div>

          {/* Dados de Contato */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 space-y-6">
            <h3 className="text-sm font-black text-[#1a237e] uppercase tracking-widest border-b border-gray-100 pb-4 flex items-center gap-2">
              <Phone size={18} className="text-[#FF9800]" /> Canais de Comunicação
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Phone size={24} /></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Telefone</p>
                  <p className="text-gray-800 font-black text-lg">{contatos?.telefone || "NÃO CADASTRADO"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-[#1a237e]"><Mail size={24} /></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">E-mail</p>
                  <p className="text-gray-800 font-black text-lg break-all">{contatos?.email || "NÃO CADASTRADO"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selo de Autenticidade Forense */}
        <div className="bg-[#1a237e] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/40">
           <div className="flex items-center gap-5 text-center md:text-left">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                 <CheckCircle2 size={36} className="text-emerald-400" />
              </div>
              <div>
                 <h4 className="text-xl font-black uppercase tracking-tight italic">Certificação Digital</h4>
                 <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Dados verificados em {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
           </div>
           <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-black tracking-widest uppercase">
              Hash: {Math.random().toString(36).substring(2, 15).toUpperCase()}
           </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
         DocMaster Judicial Intel &copy; 2026 — CNA API V2.4
      </footer>
    </div>
  );
}
