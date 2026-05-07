import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Loader2, Save, Type, Layout } from "lucide-react";

// Importação dinâmica do fabric para evitar erro de inicialização no SSR/Bundle
const fabric = typeof window !== 'undefined' ? require('fabric').fabric : null;

export default function EngineBuilderPro() {
  const { slug } = useParams();
  const [canvas, setCanvas] = useState<any>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fabric || !canvasEl.current) return;
    
    const c = new fabric.Canvas(canvasEl.current, {
      width: 826,
      height: 1180,
      backgroundColor: "#fff"
    });
    setCanvas(c);
    setLoading(false);

    return () => c.dispose();
  }, []);

  const addText = () => {
    const text = new fabric.IText("Novo Texto", {
      left: 100, top: 100, fontFamily: "Arial", fontSize: 20
    });
    canvas?.add(text);
  };

  const saveLayout = async () => {
    const json = canvas?.toJSON();
    await fetch(`/api/admin/templates/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout_definition: json })
    });
    toast.success("Layout profissional salvo!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-950 min-h-screen">
        <div className="flex gap-4 mb-6">
          <button onClick={addText} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"><Type size={14} /> Texto</button>
          <button onClick={saveLayout} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"><Save size={14} /> Salvar</button>
        </div>
        <div className="flex justify-center">
          <canvas ref={canvasEl} className="shadow-2xl border border-gray-800" />
        </div>
      </div>
    </DashboardLayout>
  );
}
