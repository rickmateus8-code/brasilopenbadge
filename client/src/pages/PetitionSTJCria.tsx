import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Download, ZoomIn, ZoomOut,
  AlertCircle, FileText, CheckCircle
} from "lucide-react";
import EmissionModal from "@/components/EmissionModal";
import PetitionSTJDocument, { type PetitionData } from "@/components/PetitionSTJDocument";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function getInitialZoom(sidebarVisible = true) {
  if (typeof window === "undefined") return 0.64;
  const sidebarWidth = sidebarVisible ? 400 : 56;
  const horizontalSpacing = 96;
  const verticalSpacing = 152;
  const availableWidth = Math.max(320, window.innerWidth - sidebarWidth - horizontalSpacing);
  const availableHeight = Math.max(320, window.innerHeight - verticalSpacing);
  const fitZoom = Math.min(availableWidth / A4_WIDTH_PX, availableHeight / A4_HEIGHT_PX);
  return Math.max(0.42, Math.min(0.85, fitZoom));
}

export default function PetitionSTJCria() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [zoomScale, setZoomScale] = useState(() => getInitialZoom(true));
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [previewMode, setPreviewMode] = useState<"fit" | "full">("fit");

  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documentPrice, setDocumentPrice] = useState<number>(2000); // R$ 20,00 default

  const [form, setForm] = useState<PetitionData>({
    id: "XXXX.XXXX",
    enderecamento: "",
    processo: "",
    requerente: "",
    requerido: "",
    corpo: "",
    cidade: "",
    data: new Date().toLocaleDateString('pt-BR'),
    advogado: "",
    oab: ""
  });

  // Buscar preço real da API
  useEffect(() => {
    fetch("/api/pricing", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pricing["peticao-stj"]) {
          setDocumentPrice(data.pricing["peticao-stj"].price);
        }
      })
      .catch(() => {});
  }, []);

  const [currentSection, setCurrentSection] = useState<"top" | "bottom">("top");

  const scrollToPreviewSection = (section: "top" | "bottom") => {
    if (previewMode === "full") return;
    const container = document.getElementById("preview-container");
    if (container) {
      const containerHeight = container.offsetHeight;
      const containerWidth = container.offsetWidth;
      const padding = 20;
      
      const focusScale = Math.min((containerWidth - 40) / 794, 1.1);
      
      let targetY = 0;
      if (section === "top") {
        targetY = padding / focusScale;
      } else {
        targetY = (containerHeight - padding - (1123 * focusScale)) / focusScale;
      }
      setZoomScale(focusScale);
      setZoomTranslateY(targetY);
      setCurrentSection(section);
      setIsFocused(true);
    }
  };

  const resetPreviewZoom = () => {
    const container = document.getElementById("preview-container");
    if (!container) return;
    const padding = 20; 
    const availableWidth = container.offsetWidth - padding;
    const availableHeight = container.offsetHeight - padding;
    const scaleX = availableWidth / 794;
    const scaleY = availableHeight / 1123;
    const fitZoom = Math.min(scaleX, scaleY, 1.0);
    
    setZoomScale(fitZoom);
    setZoomTranslateY(0);
    setIsFocused(false);
    setCurrentSection("top");
  };

  const handleFocusSection = (sectionId: string) => {
    const isTop = sectionId === "preview-header" || sectionId === "preview-patient" || sectionId === "preview-top";
    scrollToPreviewSection(isTop ? "top" : "bottom");
  };

  const handleRequestEmit = useCallback(() => {
    if (!form.requerente) { toast.error("Preencha o Nome do Requerente"); return; }
    if (!form.advogado) { toast.error("Preencha o Nome do Advogado"); return; }
    
    const balance = user?.balance || 0;
    if (user?.role !== 'admin' && balance < documentPrice) {
      toast.error(`Saldo insuficiente. Necessário R$ ${(documentPrice/100).toFixed(2)}`);
      return;
    }
    setShowConfirmModal(true);
  }, [form.requerente, form.advogado, user?.balance, user?.role, documentPrice]);

  const handleSave = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/documents/peticao-stj", {
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
        toast.error(result.error || "Erro ao gerar petição");
        setShowConfirmModal(false);
      }
    } catch { toast.error("Erro de conexão"); setShowConfirmModal(false); }
    finally { setIsExporting(false); }
  }, [form, updateBalance]);

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(form.requerente || "PETICAO", "peticao-stj"),
        docType: "peticao-stj",
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar PDF.");
    }
  }, [exportPDF, form.requerente]);

  const inp = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    marginBottom: 10
  };

  const lbl = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#4b5563",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.025em"
  };

  const card = {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  };

  const secTitle = {
    fontSize: 13,
    fontWeight: 800,
    color: "#1e1b4b",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white font-sans">
      <header className="h-14 bg-[#1e1b4b] flex items-center px-6 gap-4 shrink-0 shadow-md z-10">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> VOLTAR
          </button>
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-sm font-black tracking-tight text-white uppercase italic">
            DocMaster <span className="font-light mx-1">|</span> Petição STJ
          </h1>
          
          <div className="ml-auto flex items-center gap-3">
            <button
              className={`flex items-center gap-2 text-xs font-black h-9 px-5 rounded-xl transition-all shadow-lg active:scale-95 ${
                saved 
                ? "bg-emerald-500 text-white" 
                : "bg-white text-[#1e1b4b] hover:bg-gray-50 shadow-indigo-900/20"
              }`}
              onClick={handleRequestEmit}
              disabled={isExporting || saved}
            >
              <Download size={14} />
              {saved ? "DOCUMENTO EMITIDO" : isExporting ? "PROCESSANDO..." : "EMITIR E EXPORTAR"}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden bg-gray-50">
          <aside className={`transition-all duration-300 border-r border-gray-200 bg-white shadow-xl z-10 flex flex-col ${sidebarOpen ? "w-[400px]" : "w-0 overflow-hidden"}`}>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div style={card}>
                <p style={secTitle}><FileText size={16} /> ⚖️ 1. Cabeçalho e Processo</p>
                <label style={lbl}>Endereçamento</label>
                <textarea 
                  style={{ ...inp, height: 80, resize: "none" }}
                  value={form.enderecamento}
                  onFocus={() => handleFocusSection("preview-header")}
                  onChange={(e) => setForm(p => ({ ...p, enderecamento: e.target.value }))}
                  placeholder="EXCELENTÍSSIMO SENHOR DOUTOR JUIZ..."
                />
                <label style={lbl}>Número do Processo</label>
                <input 
                  style={inp}
                  value={form.processo}
                  onFocus={() => handleFocusSection("preview-header")}
                  onChange={(e) => setForm(p => ({ ...p, processo: e.target.value }))}
                  placeholder="0000000-00.0000.0.00.0000"
                />
              </div>

              <div style={card}>
                <p style={secTitle}>👥 2. Partes</p>
                <label style={lbl}>Nome do Requerente</label>
                <input 
                  style={inp}
                  value={form.requerente}
                  onFocus={() => handleFocusSection("preview-patient")}
                  onChange={(e) => setForm(p => ({ ...p, requerente: e.target.value }))}
                  placeholder="Nome do Autor"
                />
                <label style={lbl}>Nome do Requerido</label>
                <input 
                  style={inp}
                  value={form.requerido}
                  onFocus={() => handleFocusSection("preview-patient")}
                  onChange={(e) => setForm(p => ({ ...p, requerido: e.target.value }))}
                  placeholder="Nome do Réu"
                />
              </div>

              <div style={card}>
                <p style={secTitle}>📝 3. Conteúdo da Petição</p>
                <label style={lbl}>Corpo do Texto</label>
                <textarea 
                  style={{ ...inp, height: 300, resize: "none" }}
                  value={form.corpo}
                  onFocus={() => handleFocusSection("preview-body")}
                  onChange={(e) => setForm(p => ({ ...p, corpo: e.target.value }))}
                  placeholder="Descreva aqui os fatos e fundamentos..."
                />
              </div>

              <div style={card}>
                <p style={secTitle}>📍 4. Local e Advogado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={lbl}>Comarca/Cidade</label>
                    <input 
                      style={inp}
                      value={form.cidade}
                      onFocus={() => handleFocusSection("preview-footer")}
                      onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Data</label>
                    <input 
                      style={inp}
                      value={form.data}
                      onFocus={() => handleFocusSection("preview-footer")}
                      onChange={(e) => setForm(p => ({ ...p, data: e.target.value }))}
                    />
                  </div>
                </div>
                <label style={lbl}>Nome do Advogado</label>
                <input 
                  style={inp}
                  value={form.advogado}
                  onFocus={() => handleFocusSection("preview-footer")}
                  onChange={(e) => setForm(p => ({ ...p, advogado: e.target.value }))}
                />
                <label style={lbl}>Inscrição OAB</label>
                <input 
                  style={inp}
                  value={form.oab}
                  onFocus={() => handleFocusSection("preview-footer")}
                  onChange={(e) => setForm(p => ({ ...p, oab: e.target.value }))}
                  placeholder="00.000/UF"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Preço de Emissão</span>
                  <span className="text-sm font-black text-[#1e1b4b]">R$ {(documentPrice/100).toFixed(2)}</span>
               </div>
               <button 
                 onClick={handleRequestEmit}
                 className="bg-[#1e1b4b] text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 transition-all"
               >
                 AVANÇAR
               </button>
            </div>
          </aside>

          <main className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-10 h-10 bg-white rounded-xl shadow-xl flex items-center justify-center text-gray-600 hover:text-[#1e1b4b] transition-all border border-gray-100"
              >
                {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
              </button>
              
              <div className="flex flex-col bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <button 
                  onClick={() => scrollToPreviewSection("top")} 
                  className={`p-2.5 transition-all border-b border-gray-100 ${currentSection === "top" && isFocused ? "bg-indigo-50 text-[#1e1b4b]" : "hover:bg-gray-50 text-gray-400"}`}
                  title="Ver Parte Superior"
                >
                  <span className="text-lg font-bold">▲</span>
                </button>
                <button 
                  onClick={resetPreviewZoom} 
                  className={`p-2.5 transition-all border-b border-gray-100 ${!isFocused ? "bg-indigo-50 text-[#1e1b4b]" : "hover:bg-gray-50 text-gray-400"}`}
                  title="Ver Documento Inteiro"
                >
                  <span className="text-lg">🔍</span>
                </button>
                <button 
                  onClick={() => scrollToPreviewSection("bottom")} 
                  className={`p-2.5 transition-all ${currentSection === "bottom" && isFocused ? "bg-indigo-50 text-[#1e1b4b]" : "hover:bg-gray-50 text-gray-400"}`}
                  title="Ver Parte Inferior"
                >
                  <span className="text-lg font-bold">▼</span>
                </button>
              </div>
            </div>

            <div 
              id="preview-container"
              className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar"
              style={{ perspective: "1000px" }}
            >
              <div
                style={{
                  transform: `scale(${zoomScale}) translateY(${zoomTranslateY}px)`,
                  transformOrigin: "top center",
                  transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  borderRadius: 4,
                  backgroundColor: "#fff"
                }}
              >
                <PetitionSTJDocument ref={previewRef} data={form} />
              </div>
            </div>
          </main>
        </div>

      <EmissionModal
        docLabel="Petição STJ"
        docEmoji="⚖️"
        documentPrice={documentPrice}
        userBalance={user?.balance || 0}
        showConfirm={showConfirmModal}
        showSuccess={showSuccessModal}
        isEmitting={isExporting}
        isDownloading={isDownloading}
        onConfirm={handleSave}
        onCancel={() => setShowConfirmModal(false)}
        onDownload={handleExportPDF}
        onClose={() => setLocation("/peticao-stj-salvos")}
        historyPath="/peticao-stj-salvos"
      />

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">SUCESSO!</h2>
              <p className="text-gray-500 mb-8 font-medium">Sua petição foi emitida e o saldo foi descontado.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleExportPDF}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> BAIXAR PETIÇÃO PDF
                </button>
                <button
                  onClick={() => setLocation("/peticao-stj-salvos")}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  IR PARA HISTÓRICO
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// Estilos de suporte reutilizados (apenas para o sidebarOpen no DashboardLayout)
function PanelLeftClose({ size }: { size: number }) { return <FileText size={size} /> }
function PanelLeft({ size }: { size: number }) { return <FileText size={size} /> }
