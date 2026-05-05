import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { FileText, Settings, Layout, DollarSign, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function EngineDashboard() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin === false) {
      setLocation("/dashboard");
      return;
    }
    fetchTemplates();
  }, [isAdmin, setLocation]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const [resUniversal, resLegado] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/admin/legados")
      ]);
      const [uni, leg] = await Promise.all([resUniversal.json(), resLegado.json()]);
      const combined = [
        ...(uni.success ? uni.data : []),
        ...(leg.success ? leg.data : [])
      ];
      setDocuments(combined);
    } catch (err) {
      toast.error("Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  };

  const saveMetadata = async (slug: string, data: any) => {
    try {
      const res = await fetch(`/api/admin/templates/${slug}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Documento atualizado!");
        fetchTemplates();
      }
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-7 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-indigo-950 mb-6 uppercase italic">Engine Central de Controle</h1>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">Documento</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">Slug</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">Preço (R$)</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase text-xs">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map(doc => (
                  <tr key={doc.slug} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 font-mono text-gray-500">{doc.slug}</td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        defaultValue={doc.price}
                        onBlur={(e) => saveMetadata(doc.slug, { ...doc, price: parseFloat(e.target.value) })}
                        className="w-20 px-2 py-1 rounded border border-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => window.location.href = `/emissor/${doc.slug}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Editar Layout"
                      >
                        <Layout size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
