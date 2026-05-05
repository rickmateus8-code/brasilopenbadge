import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Search, Loader2, FileText, Download } from "lucide-react";
import PeticaoDocument from "@/components/PetitionSTJDocument";

export default function BotAdvDashboard() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleConsultar = async () => {
    if (!query) return toast.error("Insira o processo/OAB/CPF");
    setIsSearching(true);
    try {
      const res = await fetch("/api/datajud-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type: "processo" })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        toast.success("Dados carregados!");
      } else {
        toast.error("Não encontrado.");
      }
    } catch {
      toast.error("Erro na consulta.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-7 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-indigo-950 mb-6 uppercase italic">Bot Adv: Consultoria Inteligente</h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 flex gap-4">
          <input 
            className="flex-1 p-3 bg-gray-900 text-white border border-gray-700 rounded-xl placeholder-gray-500"
            placeholder="Consulte por OAB, CPF, CNPJ ou Processo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleConsultar} className="bg-indigo-900 text-white px-6 rounded-xl font-bold flex items-center gap-2">
            {isSearching ? <Loader2 className="animate-spin" /> : <Search />} Consultar
          </button>
        </div>

        {result && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="font-black text-indigo-950 mb-4">Resumo IA</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center">
              <h3 className="font-bold mb-4">Pré-visualização da Petição</h3>
              <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                <FileText size={48} />
              </div>
              <button className="mt-4 bg-emerald-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <Download size={18} /> Exportar Petição
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
