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
      <header className="h-16 md:h-20 bg-[#1a237e] text-white flex items-center px-4 md:px-8 shadow-md sticky top-0 z-50">
        <button onClick={() => setLocation("/bot-adv")} className="flex items-center gap-1.5 md:gap-2 hover:bg-white/10 px-2 md:px-3 py-1.5 rounded-lg transition-all text-xs md:text-sm font-bold">
           <ArrowLeft size={18} /> <span className="hidden xs:inline">VOLTAR</span>
        </button>
        <div className="h-6 md:h-8 w-px bg-white/20 mx-2 md:mx-4" />
        <h1 className="text-xs md:text-sm font-black uppercase tracking-tight italic truncate">Histórico de Alvarás</h1>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-none">Meus Documentos</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1.5 md:mt-2">Alvarás gerados anteriormente.</p>
           </div>
           
           <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar credor ou processo..."
                className="w-full pl-9 pr-4 py-2 md:py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#1a237e] outline-none text-xs md:text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 opacity-40">
             <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin mb-4" />
             <p className="font-bold text-[#1a237e] text-sm">Carregando...</p>
          </div>
        ) : filteredAlvaras.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-gray-200 opacity-60">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <FileText size={32} className="text-gray-400 md:w-10 md:h-10" />
             </div>
             <h3 className="text-lg md:text-xl font-bold text-gray-900">Nenhum registro</h3>
             <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-2">Os alvarás gerados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {filteredAlvaras.map((alvara) => (
              <div key={alvara.id} className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-lg md:rounded-xl flex items-center justify-center text-[#1a237e] group-hover:bg-[#1a237e] group-hover:text-white transition-all shrink-0">
                     <FileText size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                       <span className="text-[8px] md:text-xs font-black bg-indigo-100 text-[#1a237e] px-1.5 py-0.5 rounded uppercase tracking-tighter truncate">Processo {alvara.process_number || "—"}</span>
                       <span className="text-[8px] md:text-[10px] font-bold text-gray-400 flex items-center gap-1 shrink-0"><Calendar size={10}/> {new Date(alvara.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <h4 className="font-black text-gray-900 uppercase tracking-tight text-xs md:text-sm truncate">{alvara.credor_nome}</h4>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5 truncate"><User size={10}/> Adv: {alvara.advogado_nome || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                   <button 
                    onClick={() => setLocation(`/bot-adv/${alvara.process_id}`)}
                    className="flex-1 sm:flex-none p-2.5 md:p-3 bg-gray-100 text-gray-600 rounded-lg md:rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center"
                    title="Ver Detalhes"
                   >
                     <ExternalLink size={18} className="md:w-5 md:h-5" />
                   </button>
                   <button 
                    className="flex-[2] sm:flex-none flex items-center justify-center gap-2 bg-[#1a237e] text-white px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-[#283593] shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
                    title="Baixar PDF"
                   >
                     <Download size={16} className="md:w-[18px]" /> BAIXAR
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
