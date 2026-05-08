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
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processNumber) {
      toast.error("Por favor, informe o número do processo.");
      return;
    }

    setIsLoading(true);
    // Simula tempo de busca para efeito visual sofisticado
    setTimeout(() => {
      setIsLoading(false);
      setLocation(`/bot-adv/${encodeURIComponent(processNumber)}`);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Header Sofisticado */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a237e] rounded-lg flex items-center justify-center text-white shadow-lg">
             <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#1a237e] uppercase italic leading-none">
              DocMaster <span className="font-light mx-1">|</span> <span className="text-gray-400">Judicial</span>
            </h1>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Sistema de Consulta Processual Unificada</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => setLocation("/bot-adv/historico")}
            className="flex items-center gap-2 text-sm font-bold text-[#1a237e] hover:opacity-70 transition-all"
          >
            <History size={18} /> HISTÓRICO
          </button>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
             <ShieldCheck size={14} /> AMBIENTE SEGURO
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
        <div className="max-w-3xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold text-[#1a237e] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Justiça Digital <br/>
              <span className="text-[#FF9800]">na palma da sua mão.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Consulte detalhes de processos, visualize movimentações e gere alvarás judiciais com fé pública e segurança forense.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-6 flex items-center text-gray-400 group-focus-within:text-[#1a237e] transition-colors">
              <Search size={24} />
            </div>
            <input 
              type="text"
              placeholder="Digite o número do processo (Ex: 5016085-27...)"
              className="w-full h-20 pl-16 pr-48 rounded-2xl bg-white border-2 border-transparent shadow-2xl text-xl font-medium focus:border-[#1a237e] outline-none transition-all placeholder:text-gray-300"
              value={processNumber}
              onChange={(e) => setProcessNumber(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute right-3 top-3 bottom-3 px-8 bg-[#1a237e] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#283593] active:scale-95 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-70"
            >
              {isLoading ? "BUSCANDO..." : <>CONSULTAR <ArrowRight size={20} /></>}
            </button>
          </form>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-6 pt-12">
             <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50 text-center">
                <div className="text-[#1a237e] font-black text-2xl">24/7</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Disponibilidade</div>
             </div>
             <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50 text-center">
                <div className="text-[#1a237e] font-black text-2xl">100%</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Segurança</div>
             </div>
             <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50 text-center">
                <div className="text-[#1a237e] font-black text-2xl">Instante</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Processamento</div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
         Tribunal de Justiça Unificado &copy; 2026 — DocMaster Judicial Intelligence
      </footer>
    </div>
  );
}
