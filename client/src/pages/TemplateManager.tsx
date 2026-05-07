import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  ArrowLeft, Plus, Settings, Trash2, Layout, 
  ExternalLink, FileText, Search
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TemplateManager() {
  const [, setLocation] = useLocation();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        const result = await res.json();
        if (result.success) {
          setTemplates(result.data);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erro ao carregar templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-indigo-950 italic uppercase tracking-tight flex items-center gap-2">
              <Layout className="text-indigo-600" /> Motor Universal <span className="text-gray-400 font-light">/</span> Gerenciar Templates
            </h1>
            <p className="text-gray-500 text-sm font-medium">Controle os documentos gerados dinamicamente via banco de dados.</p>
          </div>
          
          <button 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
            onClick={async () => {
              const name = prompt("Nome do novo template:");
              const slug = prompt("Slug (ex: atestado-novo):");
              if (!name || !slug) return;
              const res = await fetch("/api/templates/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slug, category: "Geral", price: 0 })
              });
              const data = await res.json();
              if (data.success) {
                toast.success("Template criado! Redirecionando...");
                setLocation(`/engine-builder/${slug}`);
              } else {
                toast.error(data.error);
              }
            }}
          >
            <Plus size={18} /> NOVO TEMPLATE
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar template por nome ou slug..." 
              className="bg-transparent border-none outline-none text-sm w-full font-medium text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Template</th>
                  <th className="px-6 py-4">Slug / Categoria</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Carregando templates...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Nenhum template encontrado.</td></tr>
                ) : filtered.map((t) => (
                  <tr key={t.slug} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{t.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Status: Ativo</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">{t.slug}</span>
                        <span className="text-[11px] text-gray-500 mt-1">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-emerald-600">R$ {Number(t.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setLocation(`/emissor/${t.slug}`)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Visualizar Emissor"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button 
                          onClick={() => {
                             const targetSlug = t.slug === 'peticao-stj-v3' ? 'peticaocria' : t.slug;
                             setLocation(`/engine-builder/${targetSlug}`);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Layout"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engine funcional - Rodapé limpo */}
        <div className="mt-8">
        </div>
      </div>
    </DashboardLayout>
  );
}
