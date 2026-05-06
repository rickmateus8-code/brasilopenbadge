import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Loader2, Move, Upload, Zap } from "lucide-react";

export default function EngineBuilder() {
  const { slug } = useParams();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info("Documento base carregado. Iniciando OCR...");
      detectFields();
    }
  };

  const detectFields = async () => {
    setIsDetecting(true);
    // Simulação de OCR Inteligente
    setTimeout(() => {
      const suggestedFields = [
        { fieldId: "nome", top: 150, left: 100, fontSize: "14pt" },
        { fieldId: "cpf", top: 200, left: 100, fontSize: "12pt" },
        { fieldId: "data", top: 850, left: 500, fontSize: "11pt" }
      ];
      setTemplate(prev => ({
        ...prev,
        layout_definition: [...prev.layout_definition, ...suggestedFields]
      }));
      setIsDetecting(false);
      toast.success("Campos detectados com sucesso!");
    }, 2000);
  };


  useEffect(() => {
    workerRef.current = new Worker(new URL('@/workers/canvasWorker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      if (e.data.success) toast.success("Processamento concluído via Worker.");
    };
    return () => workerRef.current?.terminate();
  }, []);

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

  // Lógica simplificada de Canvas para renderizar o PDF de fundo
  useEffect(() => {
    if (template && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, 826, 1180); // A4 placeholder
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText("PDF Base: " + template.name, 50, 100);
      }
    }
  }, [template]);

  const updateField = (fieldId: string, updates: any) => {
    const newLayout = template.layout_definition.map((f: any) => 
      f.fieldId === fieldId ? { ...f, ...updates } : f
    );
    setTemplate({ ...template, layout_definition: newLayout });
  };

  const saveLayout = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/templates/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout_definition: template.layout_definition }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Layout salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar: " + result.error);
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-7">
        <h1 className="text-xl font-bold mb-4 italic uppercase">Builder: {template.name}</h1>
        <div className="flex gap-6">
          <div className="flex-1 relative border-4 border-gray-300 shadow-xl">
             <canvas ref={canvasRef} width={826} height={1180} className="w-full h-auto bg-white" />
             {template.layout_definition.map((f: any) => (
                <div 
                  key={f.fieldId}
                  className="absolute p-2 bg-indigo-500/30 border-2 border-indigo-600 cursor-move flex items-center justify-center font-bold text-indigo-900 select-none"
                  style={{ top: `${(f.top / 1180) * 100}%`, left: `${(f.left / 826) * 100}%` }}
                >
                  <Move size={14} className="mr-1" /> {f.fieldId}
                </div>
             ))}
          </div>
          <div className="w-80 space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <h3 className="text-xs font-black text-indigo-900 uppercase mb-3 flex items-center gap-2">
                <Zap size={14} /> Ferramentas Inteligentes
              </h3>
              <div className="flex flex-col gap-2">
                <label className="w-full bg-white border-2 border-dashed border-indigo-300 p-3 rounded-lg text-xs font-bold text-indigo-600 cursor-pointer hover:bg-indigo-50 flex items-center justify-center gap-2">
                  <Upload size={14} /> Carregar Base PDF/IMG
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <button 
                  onClick={detectFields}
                  disabled={isDetecting}
                  className="w-full bg-indigo-600 text-white p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {isDetecting ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />} 
                  Detectar Campos (OCR)
                </button>
              </div>
            </div>

            {template.layout_definition.map((f: any) => (
              <div key={f.fieldId} className="bg-white p-4 rounded shadow border">
                <div className="font-bold mb-2 text-xs uppercase">{f.fieldId}</div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={f.top} onChange={(e) => updateField(f.fieldId, { top: parseInt(e.target.value) })} className="p-2 border rounded text-xs" placeholder="Top" />
                  <input type="number" value={f.left} onChange={(e) => updateField(f.fieldId, { left: parseInt(e.target.value) })} className="p-2 border rounded text-xs" placeholder="Left" />
                </div>
              </div>
            ))}
            <button 
              onClick={saveLayout}
              className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black uppercase hover:bg-emerald-700 shadow-lg"
            >
              Salvar Canvas
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

}
