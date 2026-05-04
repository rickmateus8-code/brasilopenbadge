import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  FileText, CheckCircle, Search, X, PanelLeftClose, PanelLeft,
  ChevronUp, ChevronDown
} from "lucide-react";
import EmissionModal from "@/components/EmissionModal";
import UniversalDocument, { type UniversalTemplate } from "@/components/UniversalDocument";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";

export default function UniversalEmissor() {
  const { slug } = useParams();
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [template, setTemplate] = useState<UniversalTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, any>>({ id: "XXXX.XXXX" });
  
  const [zoomScale, setZoomScale] = useState(0.65);
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Formatters
  const formatters = {
    currency: (val: string) => {
      let digits = val.replace(/\D/g, "");
      if (!digits) return "";
      const amount = (parseInt(digits) / 100).toFixed(2);
      const [int, dec] = amount.split(".");
      const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `R$ ${formattedInt},${dec}`;
    },
    date: (val: string) => {
      const v = val.replace(/\D/g, "").slice(0, 8);
      if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
      if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
      return v;
    },
    mask: (val: string, mask: string) => {
      if (!mask) return val;
      if (mask === "0000000-00.0000.0.00.0000") {
        const v = val.replace(/\D/g, "").slice(0, 20);
        if (v.length > 16) return `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9, 13)}.${v.slice(13, 14)}.${v.slice(14, 16)}.${v.slice(16)}`;
        if (v.length > 14) return `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9, 13)}.${v.slice(13, 14)}.${v.slice(14)}`;
        if (v.length > 13) return `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9, 13)}.${v.slice(13)}`;
        if (v.length > 9) return `${v.slice(0, 7)}-${v.slice(7, 9)}.${v.slice(9)}`;
        if (v.length > 7) return `${v.slice(0, 7)}-${v.slice(7)}`;
        return v;
      }
      return val;
    }
  };

  const formatLongDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('/')) return "";
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const [d, m, y] = parts.map(Number);
    const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return `${d} de ${months[m - 1]} de ${y}`;
  };

  useEffect(() => {
    if (slug === "peticao-stj-v3" && form.data && form.data.length === 10) {
      const year = form.data.split('/')[2];
      const alvara = form.alvara_numero || Math.floor(1000000 + Math.random() * 9000000).toString();
      const derived = {
        alvara_numero: alvara,
        alvara_final: `${alvara}/${year}`,
        data_extenso: formatLongDate(form.data)
      };
      if (form.alvara_final !== derived.alvara_final || form.data_extenso !== derived.data_extenso) {
        setForm(p => ({ ...p, ...derived }));
      }
    }
  }, [form.data, form.alvara_numero, slug]);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/templates?slug=${slug}`);
        const result = await res.json();
        if (result.success) {
          setTemplate(result.data);
          const initialForm: Record<string, any> = { id: "XXXX.XXXX" };
          result.data.fields_definition.forEach((f: any) => { initialForm[f.id] = ""; });
          setForm(initialForm);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erro ao carregar template");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchTemplate();
  }, [slug]);

  const resetPreviewZoom = useCallback(() => {
    if (!template) return;
    const container = document.getElementById("preview-container");
    if (!container) return;
    const availableWidth = container.offsetWidth - 40;
    const availableHeight = container.offsetHeight - 40;
    const scale = Math.min(availableWidth / template.base_config.width, availableHeight / template.base_config.height, 1.0);
    setZoomScale(scale);
    setZoomTranslateY(0);
  }, [template]);

  useEffect(() => {
    if (template) {
      const timer = setTimeout(resetPreviewZoom, 100);
      return () => clearTimeout(timer);
    }
  }, [template, resetPreviewZoom]);

  const handleRequestEmit = useCallback(() => {
    if (!template) return;
    const balance = user?.balance || 0;
    if (user?.role !== 'admin' && balance < template.price) {
      toast.error(`Saldo insuficiente. Necessário R$ ${(template.price).toFixed(2)}`);
      return;
    }
    setShowConfirmModal(true);
  }, [template, user?.balance, user?.role]);

  const handleSave = useCallback(async () => {
    if (!template) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/documents/${template.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        if (result.newBalance !== undefined) updateBalance(result.newBalance);
        setSaved(true);
        setForm(p => ({ ...p, id: result.data.id }));
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        toast.error(result.error || "Erro ao gerar documento");
        setShowConfirmModal(false);
      }
    } catch { 
      toast.error("Erro de conexão"); 
      setShowConfirmModal(false); 
    } finally { 
      setIsExporting(false); 
    }
  }, [form, template, updateBalance]);

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || !template) return;
    try {
      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(form.credor || "DOCUMENTO", template.slug),
        docType: template.slug as any,
        customWidth: template.base_config.width,
        customHeight: template.base_config.height,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) { 
      toast.error("Erro ao exportar PDF."); 
    }
  }, [exportPDF, form.credor, template]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white">Carregando motor...</div>;
  if (!template) return <div className="h-screen flex items-center justify-center bg-white text-red-500 font-bold">Template não encontrado ou inativo.</div>;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white font-sans">
      <header className="h-14 bg-[#1e1b4b] flex items-center px-6 gap-4 shrink-0 shadow-md z-10">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all">
            <ArrowLeft size={14} /> VOLTAR
          </button>
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-sm font-black tracking-tight text-white uppercase italic">
            DocMaster <span className="font-light mx-1">|</span> {template.name}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setForm({ id: "XXXX.XXXX" })} className="flex items-center gap-2 text-xs font-bold h-9 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 shadow-sm active:scale-95">
              <X size={14} /> LIMPAR
            </button>
            <button className={`flex items-center gap-2 text-xs font-black h-9 px-5 rounded-xl transition-all shadow-lg active:scale-95 ${saved ? "bg-emerald-500 text-white" : "bg-white text-[#1e1b4b] hover:bg-gray-50 shadow-indigo-900/20"}`} onClick={handleRequestEmit} disabled={isExporting || saved}>
              <Download size={14} /> {saved ? "DOCUMENTO EMITIDO" : isExporting ? "PROCESSANDO..." : "EMITIR E EXPORTAR"}
            </button>
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden bg-gray-50">
          <aside className={`transition-all duration-300 border-r border-gray-200 bg-white shadow-xl z-10 flex flex-col ${sidebarOpen ? "w-[400px]" : "w-0 overflow-hidden"}`}>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                <p className="text-sm font-bold text-indigo-950 mb-4 flex items-center gap-2"><FileText size={16} /> 📝 Preenchimento</p>
                {template.fields_definition.map((f: any) => (
                  <div key={f.id} className="mb-4">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">{f.label}</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={form[f.id] || ""} 
                      onChange={(e) => {
                        let val = e.target.value;
                        if (f.type === "currency") val = formatters.currency(val);
                        else if (f.type === "date") val = formatters.date(val);
                        else if (f.mask) val = formatters.mask(val, f.mask);
                        setForm(p => ({ ...p, [f.id]: val }));
                      }}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1 relative flex flex-col overflow-hidden">
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100">{sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}</button>
              <button onClick={() => setZoomScale(s => Math.min(s + 0.1, 2))} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100"><ZoomIn size={20} /></button>
              <button onClick={() => setZoomScale(s => Math.max(s - 0.1, 0.3))} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100"><ZoomOut size={20} /></button>
              <button onClick={resetPreviewZoom} className="p-2.5 bg-white shadow-xl rounded-xl text-gray-700 hover:bg-gray-50 transition-all border border-gray-100" title="Ajustar à Tela"><Search size={20} /></button>
            </div>
            <div id="preview-container" className="w-full h-full flex items-start justify-center overflow-hidden bg-white relative">
              <div style={{ width: template.base_config.width, flexShrink: 0, transform: `scale(${zoomScale}) translateY(${zoomTranslateY}px)`, transformOrigin: "top center", transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
                <UniversalDocument ref={previewRef} template={template} data={form} />
              </div>
            </div>
          </main>
      </div>

      <EmissionModal open={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleSave} isExporting={isExporting} price={template.price * 100} />
      
      {showSuccessModal && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="text-emerald-500 w-12 h-12" /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 italic">EMISSÃO CONCLUÍDA!</h2>
            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">Seu documento foi registrado com sucesso e já está pronto para download.</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleExportPDF} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"><Download size={18} /> BAIXAR DOCUMENTO PDF</button>
              <button onClick={() => setLocation("/dashboard")} className="text-gray-400 hover:text-gray-600 text-xs font-bold py-2 transition-colors">VOLTAR AO PAINEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
