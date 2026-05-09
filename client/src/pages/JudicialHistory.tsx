import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, Trash2, Calendar, FileText, User, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

/**
 * JudicialHistory.tsx — Histórico de Alvarás Gerados
 */

export default function JudicialHistory() {
  const [, setLocation] = useLocation();
  const [alvaras, setAlvaras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAlvaras = async () => {
      try {
        const res = await fetch("/api/judicial/alvara/list");
        const json = await res.json();
        if (json.success) {
          setAlvaras(json.data);
        }
      } catch (e) {
        toast.error("Erro ao carregar histórico.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlvaras();
    document.title = "Histórico de Alvarás - DocMaster";
  }, []);

  const filteredAlvaras = alvaras.filter(a => 
    a.credor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.process_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="h-16 bg-[#1a237e] text-white flex items-center px-8 shadow-md">
        <button onClick={() => setLocation("/bot-adv")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all text-sm font-bold">
           <ArrowLeft size={18} /> VOLTAR
        </button>
        <div className="h-8 w-px bg-white/20 mx-4" />
        <h1 className="text-sm font-black uppercase tracking-tight italic">Histórico de Alvarás</h1>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h2 className="text-3xl font-black text-gray-900 leading-none">Meus Documentos</h2>
              <p className="text-gray-500 text-sm mt-2">Visualize e baixe alvarás gerados anteriormente.</p>
           </div>
           
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por credor ou processo..."
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#1a237e] outline-none w-80 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
             <div className="w-12 h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin mb-4" />
             <p className="font-bold text-[#1a237e]">Carregando histórico...</p>
          </div>
        ) : filteredAlvaras.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200 opacity-60">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={40} className="text-gray-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-900">Nenhum registro encontrado</h3>
             <p className="text-gray-500 text-sm mt-2">Os alvarás que você gerar aparecerão nesta lista.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAlvaras.map((alvara) => (
              <div key={alvara.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-[#1a237e] group-hover:bg-[#1a237e] group-hover:text-white transition-all">
                     <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-black bg-indigo-100 text-[#1a237e] px-2 py-0.5 rounded uppercase tracking-tighter">Processo {alvara.process_number || "—"}</span>
                       <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Calendar size={12}/> {new Date(alvara.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <h4 className="font-black text-gray-900 uppercase tracking-tight">{alvara.credor_nome}</h4>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5"><User size={12}/> Adv: {alvara.advogado_nome || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => setLocation(`/bot-adv/${alvara.process_id}`)}
                    className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                    title="Ver Detalhes"
                   >
                     <ExternalLink size={20} />
                   </button>
                   <button 
                    className="flex items-center gap-2 bg-[#1a237e] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#283593] shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
                    title="Baixar PDF"
                   >
                     <Download size={18} /> BAIXAR
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
