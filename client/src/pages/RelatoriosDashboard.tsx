import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Loader2, TrendingUp, Award, BarChart3, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function RelatoriosDashboard() {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRelatorios();
  }, []);

  const fetchRelatorios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/relatorios/juridico");
      const result = await res.json();
      if (result.success) setRelatorios(result.data);
    } catch {
      toast.error("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Ouro": return "text-yellow-600 bg-yellow-50";
      case "Prata": return "text-gray-600 bg-gray-50";
      case "Bronze": return "text-orange-800 bg-orange-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-7 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-indigo-950 mb-6 uppercase italic flex items-center gap-3">
          <BarChart3 /> Relatórios Jurídicos Inteligentes
        </h1>

        <div className="flex gap-4 mb-6">
          {["all", "Ouro", "Prata", "Bronze"].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg font-bold text-xs capitalize ${filter === t ? 'bg-indigo-900 text-white' : 'bg-white border'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatorios.filter(r => filter === "all" || r.tier === filter).map((r, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getTierColor(r.tier)}`}>
                  Nível {r.tier}
                </div>
                <h3 className="font-bold text-lg text-indigo-950 mb-2 truncate">{r.numeroProcesso}</h3>
                <p className="text-sm text-gray-500 mb-4 h-16 overflow-hidden">{r.resumoIA}</p>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="font-bold text-emerald-600">R$ {r.valorCausa.toLocaleString('pt-BR')}</span>
                  <button className="text-indigo-600 text-xs font-bold hover:underline">Ver Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
