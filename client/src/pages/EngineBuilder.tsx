import { useState, useEffect } from "react";
import { useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Loader2, Save, Move, Type } from "lucide-react";

export default function EngineBuilder() {
  const { slug } = useParams();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [slug]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/templates?slug=${slug}`);
      const result = await res.json();
      if (result.success) setTemplate(result.data);
    } catch {
      toast.error("Falha ao carregar template.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (fieldId: string, updates: any) => {
    const newLayout = template.layout_definition.map((f: any) => 
      f.fieldId === fieldId ? { ...f, ...updates } : f
    );
    setTemplate({ ...template, layout_definition: newLayout });
  };

  if (loading) return <DashboardLayout><div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-7">
        <h1 className="text-xl font-bold mb-4 italic uppercase">Builder: {template.name}</h1>
        <div className="flex gap-6">
          <div className="flex-1 bg-gray-200 min-h-[800px] relative border-2 border-dashed border-gray-400">
             {template.layout_definition.map((f: any) => (
                <div 
                  key={f.fieldId}
                  className="absolute p-2 bg-indigo-500/20 border border-indigo-500 cursor-move"
                  style={{ top: `${f.top}px`, left: `${f.left}px` }}
                >
                  {f.fieldId}
                </div>
             ))}
          </div>
          <div className="w-80 space-y-4">
            {template.layout_definition.map((f: any) => (
              <div key={f.fieldId} className="bg-white p-4 rounded shadow border">
                <div className="font-bold mb-2">{f.fieldId}</div>
                <div className="flex gap-2">
                  <input type="number" value={f.top} onChange={(e) => updateField(f.fieldId, { top: parseInt(e.target.value) })} className="w-full p-1 border" placeholder="Top" />
                  <input type="number" value={f.left} onChange={(e) => updateField(f.fieldId, { left: parseInt(e.target.value) })} className="w-full p-1 border" placeholder="Left" />
                </div>
              </div>
            ))}
            <button className="w-full bg-emerald-600 text-white p-3 rounded font-bold uppercase hover:bg-emerald-700">Salvar Layout</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
