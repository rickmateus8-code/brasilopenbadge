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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function optimizeImageForUpload(file: File, options?: { maxWidth?: number; maxHeight?: number; quality?: number }) {
  const { maxWidth = 1400, maxHeight = 1400, quality = 0.82 } = options || {};
  if (!file.type.startsWith("image/")) return readFileAsBase64(file);
  const originalDataUrl = await readFileAsBase64(file);
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width || maxWidth;
      const height = img.height || maxHeight;
      const ratio = Math.min(1, maxWidth / width, maxHeight / height);
      const targetWidth = Math.max(1, Math.round(width * ratio));
      const targetHeight = Math.max(1, Math.round(height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth; canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(originalDataUrl); return; }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const preferredType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const optimizedDataUrl = canvas.toDataURL(preferredType, quality);
      resolve(optimizedDataUrl.length < originalDataUrl.length ? optimizedDataUrl : originalDataUrl);
    };
    img.onerror = () => resolve(originalDataUrl);
    img.src = originalDataUrl;
  });
}

function getUploadSizeInBytes(value?: string) {
  if (!value) return 0;
  const base64 = value.includes(",") ? value.split(",")[1] || "" : value;
  return Math.ceil((base64.length * 3) / 4);
}

const LOGOS_PADRAO = [
  { id: "logo1",      label: "Logo 1",       src: "/logos/logo1.png" },
  { id: "logo2",      label: "Logo 2",       src: "/logos/logo2.png" },
  { id: "logo3",      label: "Logo 3",       src: "/logos/logo3.jpg" },
  { id: "amil",       label: "Amil",         src: "/logos/amil.png" },
  { id: "hapvida",    label: "Hapvida",      src: "/logos/hapvida.png" },
  { id: "notredame",  label: "Notre Dame",   src: "/logos/notredame.png" },
  { id: "sulamerica", label: "Sul América",  src: "/logos/sulamerica.png" },
  { id: "unimed",     label: "Unimed",       src: "/logos/unimed.png" },
];

export default function PetitionSTJCria() {
  const { user, updateBalance } = useAuth();
  const [, setLocation] = useLocation();
  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isDownloading } = usePDFExport();

  const [zoomScale, setZoomScale] = useState(0.65);
  const [zoomTranslateY, setZoomTranslateY] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [previewMode, setPreviewMode] = useState<"fit" | "full">("fit");
  const [currentSection, setCurrentSection] = useState<"top" | "bottom">("top");

  // Logos e Assinatura
  const [logoLeft, setLogoLeft] = useState<string>("");
  const [logoRight, setLogoRight] = useState<string>("");
  const [logoSide, setLogoSide] = useState<"left" | "right">("left");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const logoLeftRef = useRef<HTMLInputElement>(null);
  const logoRightRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const [logoLeftScale, setLogoLeftScale] = useState<number>(1);
  const [logoRightScale, setLogoRightScale] = useState<number>(1);
  const [logoLeftX, setLogoLeftX] = useState<number>(0);
  const [logoLeftY, setLogoLeftY] = useState<number>(0);
  const [logoRightX, setLogoRightX] = useState<number>(0);
  const [logoRightY, setLogoRightY] = useState<number>(0);

  const adjustScale = (side: "left" | "right", delta: number) => {
    if (side === "left") setLogoLeftScale(v => Math.max(0.1, Math.min(3, parseFloat((v + delta).toFixed(2)))));
    else setLogoRightScale(v => Math.max(0.1, Math.min(3, parseFloat((v + delta).toFixed(2)))));
  };
  const adjustX = (side: "left" | "right", delta: number) => {
    if (side === "left") setLogoLeftX(v => v + delta);
    else setLogoRightX(v => v + delta);
  };
  const adjustY = (side: "left" | "right", delta: number) => {
    if (side === "left") setLogoLeftY(v => v + delta);
    else setLogoRightY(v => v + delta);
  };

  const handleLogoUpload = async (side: "left" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const optimized = await optimizeImageForUpload(file, { maxWidth: 1200, maxHeight: 500, quality: 0.9 });
    if (side === "left") setLogoLeft(optimized); else setLogoRight(optimized);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const optimized = await optimizeImageForUpload(file, { maxWidth: 1200, maxHeight: 350, quality: 0.88 });
    setSignatureImage(optimized);
  };

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

  // Calcula a escala "Fit" exata para o container atual
  const getFitScale = useCallback(() => {
    const container = document.getElementById("preview-container");
    if (!container) return 0.65;
    const padding = 20; 
    const availableWidth = container.offsetWidth - padding;
    const availableHeight = container.offsetHeight - padding;
    const scaleX = availableWidth / 794;
    const scaleY = availableHeight / 1123;
    return Math.min(scaleX, scaleY, 1.0);
  }, []);

  // Função para calcular o Zoom e Deslocamento dividindo o Layout em CIMA / BAIXO
  const scrollToPreviewSection = useCallback((section: "top" | "bottom") => {
    if (previewMode === "full") return;

    const container = document.getElementById("preview-container");
    if (container) {
      const containerHeight = container.offsetHeight;
      const containerWidth = container.offsetWidth;
      const padding = 15; // Reduzido para ganhar espaço
      
      // Zoom focado: aproveita a largura mas mantém margem lateral pequena
      const focusScale = Math.min((containerWidth - 30) / 794, 1.05);
      
      let targetY = 0;
      if (section === "top") {
        // Alinha o topo do A4 exatamente com o topo do container (com margem mínima)
        targetY = padding; 
      } else {
        // Alinha o fundo do A4 com o fundo do container
        const scaledHeight = 1123 * focusScale;
        targetY = containerHeight - scaledHeight - padding;
      }

      setZoomScale(focusScale);
      setZoomTranslateY(targetY);
      setCurrentSection(section);
      setIsFocused(true);
    }
  }, [previewMode]);

  const handleFocusSection = (sectionId: string) => {
    const isTop = sectionId === "preview-header" || sectionId === "preview-patient" || sectionId === "preview-top";
    scrollToPreviewSection(isTop ? "top" : "bottom");
  };

  const resetPreviewZoom = useCallback(() => {
    const scale = getFitScale();
    const container = document.getElementById("preview-container");
    let ty = 0;
    if (container) {
      const containerHeight = container.offsetHeight;
      const scaledHeight = 1123 * scale;
      // Centraliza verticalmente se o documento couber inteiro
      if (containerHeight > scaledHeight) {
        ty = (containerHeight - scaledHeight) / 2;
      }
    }
    setZoomScale(scale);
    setZoomTranslateY(ty);
    setIsFocused(false);
    setCurrentSection("top");
  }, [getFitScale]);

  // Ajustar escala inicial e ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (!isFocused || previewMode === "full") {
        resetPreviewZoom();
      }
    };
    window.addEventListener('resize', handleResize);
    // Timeout para garantir que o DOM renderezou
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [resetPreviewZoom, isFocused, previewMode]);

  const handleRequestEmit = useCallback(() => {
    if (!form.requerente) { toast.error("Preencha o Nome do Requerente"); return; }
    if (!form.advogado) { toast.error("Preencha o Nome do Advogado"); return; }
    
    // Validar tamanho das imagens para evitar erro de Payload Too Large (limite sugerido 2.5MB)
    const totalSize = getUploadSizeInBytes(logoLeft) + getUploadSizeInBytes(logoRight) + getUploadSizeInBytes(signatureImage);
    if (totalSize > 2.5 * 1024 * 1024) {
      toast.error("⚠️ As imagens anexadas são muito grandes. Remova-as ou use arquivos menores.");
      return;
    }

    const balance = user?.balance || 0;
    if (user?.role !== 'admin' && balance < documentPrice) {
      toast.error(`Saldo insuficiente. Necessário R$ ${(documentPrice/100).toFixed(2)}`);
      return;
    }
    setShowConfirmModal(true);
  }, [form.requerente, form.advogado, user?.balance, user?.role, documentPrice, logoLeft, logoRight, signatureImage]);

  const handleSave = useCallback(async () => {
    setIsExporting(true);
    try {
      const payload = {
        ...form,
        logoUrl: logoLeft,
        logoRight: logoRight,
        signatureImage: signatureImage,
        logoLeftScale,
        logoRightScale,
        logoLeftX,
        logoLeftY,
        logoRightX,
        logoRightY
      };

      const res = await fetch("/api/documents/peticao-stj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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
  }, [form, updateBalance, logoLeft, logoRight, signatureImage, logoLeftScale, logoRightScale, logoLeftX, logoLeftY, logoRightX, logoRightY]);

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

              {/* 🖼 Logos do Documento */}
              <div style={card}>
                <p style={secTitle}><AlertCircle size={16} /> 🖼 Logos do Documento</p>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setLogoSide("left"); scrollToPreviewSection("top"); }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${logoSide === "left" ? "bg-[#1e1b4b] text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    ← ESQUERDA
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLogoSide("right"); scrollToPreviewSection("top"); }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${logoSide === "right" ? "bg-[#1e1b4b] text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    DIREITA →
                  </button>
                </div>

                <div className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden mb-3">
                  {(logoSide === "left" ? logoLeft : logoRight) ? (
                    <img src={logoSide === "left" ? logoLeft : logoRight} alt="Preview" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400">SEM LOGO</span>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <label className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-all">
                    📁 ENVIAR LOGO
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(logoSide, e)} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { 
                      if (logoSide === "left") setLogoLeft(""); else setLogoRight("");
                    }}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-all"
                  >
                    ✕ REMOVER
                  </button>
                </div>

                <p className="text-[10px] font-black text-gray-400 mb-2 uppercase">Ajuste de Posição/Escala</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => adjustScale(logoSide, 0.05)} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">Z+</button>
                  <button onClick={() => adjustScale(logoSide, -0.05)} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">Z-</button>
                  <button onClick={() => { 
                    if (logoSide === "left") { setLogoLeftScale(1); setLogoLeftX(0); setLogoLeftY(0); }
                    else { setLogoRightScale(1); setLogoRightX(0); setLogoRightY(0); }
                  }} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">Reset</button>
                  <button onClick={() => adjustX(logoSide, -2)} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">← X</button>
                  <button onClick={() => adjustX(logoSide, 2)} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">X →</button>
                  <button onClick={() => adjustY(logoSide, -2)} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">↑ Y</button>
                  <button onClick={() => adjustY(logoSide, 2)} className="bg-gray-100 py-2 rounded-lg text-[10px] font-bold">↓ Y</button>
                </div>
              </div>

              {/* 🖋 Assinatura */}
              <div style={card}>
                <p style={secTitle}><CheckCircle size={16} /> 🖋 Assinatura do Advogado</p>
                <div className="flex items-center gap-4 mb-3">
                  {signatureImage ? (
                    <div className="relative group">
                      <img src={signatureImage} alt="Assinatura" className="h-16 border border-gray-100 rounded-lg bg-gray-50" />
                      <button 
                        onClick={() => setSignatureImage("")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      📷 ENVIAR ASSINATURA
                      <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                    </label>
                  )}
                </div>
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

          <main className="flex-1 relative flex flex-col overflow-hidden">
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
              className="w-full h-full flex items-start justify-center overflow-hidden bg-white relative"
              style={{ perspective: "1000px" }}
            >
              <div
                style={{
                  width: 794,
                  flexShrink: 0,
                  transform: `scale(${zoomScale}) translateY(${zoomTranslateY}px)`,
                  transformOrigin: "top center",
                  transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  borderRadius: 4,
                  backgroundColor: "#fff"
                }}
              >
                <PetitionSTJDocument 
                  ref={previewRef} 
                  data={{
                    ...form,
                    logoUrl: logoLeft,
                    logoRight: logoRight,
                    signatureImage: signatureImage,
                    logoLeftScale,
                    logoRightScale,
                    logoLeftX,
                    logoLeftY,
                    logoRightX,
                    logoRightY
                  }} 
                />
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
