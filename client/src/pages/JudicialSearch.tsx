import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Gavel, History, ShieldCheck, ArrowRight, Scale } from "lucide-react";
import { toast } from "sonner";

/**
 * JudicialSearch.tsx — Landing page de busca de processos
 * Design elegante e sofisticado inspirado em portais jurídicos de elite.
 */

const THEME = {
  primary: "#1a237e", // Azul Marinho Profundo
  accent: "#FF9800",  // Laranja Supremo
  bg: "#f8f9fa",
  text: "#2c3e50",
  muted: "#7f8c8d"
};

export default function JudicialSearch() {
  const [, setLocation] = useLocation();
  const [processNumber, setProcessNumber] = useState("");
  const [searchType, setSearchType] = useState<"processo" | "oab">("processo");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) {
      toast.error(`Por favor, informe o ${searchType === "processo" ? "número do processo" : "número da OAB"}.`);
      return;
    }

    setIsLoading(true);
    
    if (searchType === "oab") {
      // Formato esperado: 12345/SP ou apenas 12345
      const parts = inputValue.split("/");
      const oab = parts[0];
      const uf = parts[1] || "SP";
      setLocation(`/bot-adv/oab/${oab}/${uf}`);
    } else {
      setLocation(`/bot-adv/${encodeURIComponent(inputValue)}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Header Sofisticado */}
      <header className="h-16 md:h-20 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1a237e] rounded-lg flex items-center justify-center text-white shadow-lg shrink-0">
             <Scale size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-extrabold tracking-tight text-[#1a237e] uppercase italic leading-none truncate">
              DocMaster <span className="font-light mx-0.5 md:mx-1">|</span> <span className="text-gray-400">Judicial</span>
            </h1>
            <p className="text-[8px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest truncate">Consulta Processual Unificada</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setLocation("/bot-adv/historico")}
            className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-[#1a237e] hover:opacity-70 transition-all"
          >
            <History size={16} className="md:w-4.5 md:h-4.5" /> <span className="hidden sm:inline">HISTÓRICO</span>
          </button>
          <div className="h-6 md:h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-emerald-100 shrink-0">
             <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">SEGURO</span>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-12">
        <div className="max-w-3xl w-full text-center space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1a237e] tracking-tight leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Justiça Digital <br/>
              <span className="text-[#FF9800]">na palma da sua mão.</span>
            </h2>
            <p className="text-sm md:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed px-4">
              Consulte processos ou dados oficiais da OAB com foto e situação cadastral em tempo real.
            </p>
          </div>

          {/* Toggle Search Type */}
          <div className="flex items-center justify-center p-1 bg-gray-200/50 backdrop-blur rounded-xl w-fit mx-auto border border-gray-200">
            <button
              onClick={() => setSearchType("processo")}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${searchType === "processo" ? "bg-[#1a237e] text-white shadow-md" : "text-gray-500 hover:bg-gray-200"}`}
            >
              PROCESSO CNJ
            </button>
            <button
              onClick={() => setSearchType("oab")}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${searchType === "oab" ? "bg-[#1a237e] text-white shadow-md" : "text-gray-500 hover:bg-gray-200"}`}
            >
              ADVOGADO (OAB)
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto w-full">
            <div className="absolute inset-y-0 left-4 md:left-6 flex items-center text-gray-400 group-focus-within:text-[#1a237e] transition-colors">
              {searchType === "processo" ? <Search size={20} className="md:w-6 md:h-6" /> : <Gavel size={20} className="md:w-6 md:h-6" />}
            </div>
            <input 
              type="text"
              placeholder={searchType === "processo" ? "Nº do processo (CNJ)..." : "Nº da OAB/UF (Ex: 12345/SP)..."}
              className="w-full h-16 md:h-20 pl-12 md:pl-16 pr-32 md:pr-48 rounded-xl md:rounded-2xl bg-white border-2 border-transparent shadow-xl md:shadow-2xl text-base md:text-xl font-medium focus:border-[#1a237e] outline-none transition-all placeholder:text-gray-300"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:top-3 h-auto px-4 md:px-8 bg-[#1a237e] text-white rounded-lg md:rounded-xl font-bold flex items-center gap-1 md:gap-2 hover:bg-[#283593] active:scale-95 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-70 text-xs md:text-base"
            >
              {isLoading ? "..." : <><span className="hidden xs:inline">CONSULTAR</span> <ArrowRight size={18} className="md:w-5 md:h-5" /></>}
            </button>
          </form>

          {/* Quick Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 pt-8 md:pt-12">
             <div className="bg-white/50 backdrop-blur-sm p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/50 text-center flex sm:flex-col items-center justify-center gap-2 sm:gap-0">
                <div className="text-[#1a237e] font-black text-xl md:text-2xl">24/7</div>
                <div className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Disponibilidade</div>
             </div>
             <div className="bg-white/50 backdrop-blur-sm p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/50 text-center flex sm:flex-col items-center justify-center gap-2 sm:gap-0">
                <div className="text-[#1a237e] font-black text-xl md:text-2xl">100%</div>
                <div className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Segurança</div>
             </div>
             <div className="bg-white/50 backdrop-blur-sm p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/50 text-center flex sm:flex-col items-center justify-center gap-2 sm:gap-0">
                <div className="text-[#1a237e] font-black text-xl md:text-2xl">Instante</div>
                <div className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Processamento</div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 md:p-8 text-center text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-auto">
         Tribunal de Justiça Unificado &copy; 2026<br className="xs:hidden" /> — DocMaster Judicial Intelligence
      </footer>
    </div>
  );
}
