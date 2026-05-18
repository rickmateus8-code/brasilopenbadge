import { useState, useRef, useEffect } from "react";
import { 
  Download, Pencil, Loader2, X, 
  ZoomIn, ZoomOut, Maximize, Move, RotateCcw 
} from "lucide-react";
import AttestationDocument from "@/components/AttestationDocument";
import { buildAttestationData, type AttestationDocRecord } from "@/lib/attestationActions";

interface AttestationViewerModalProps {
  doc: AttestationDocRecord;
  onClose: () => void;
  onEdit: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
}

export default function AttestationViewerModal({
  doc,
  onClose,
  onEdit,
  onDownload,
  isDownloading = false,
}: AttestationViewerModalProps) {
  const attData = buildAttestationData(doc);
  const [scale, setScale] = useState(0.65);
  const [position, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit inicial baseado na altura da tela
  useEffect(() => {
    const vh = window.innerHeight;
    if (vh < 800) setScale(0.55);
    else if (vh < 1000) setScale(0.65);
    else setScale(0.75);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 0.75) return; // Só arrasta se tiver zoom
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    const vh = window.innerHeight;
    if (vh < 800) setScale(0.55);
    else if (vh < 1000) setScale(0.65);
    else setScale(0.75);
    setPos({ x: 0, y: 0 });
  };

  return (
    <div 
      className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Modal Container: Ajustado para proporções A4 (max-width reduzido para ~850px) */}
      <div 
        className="bg-[#f8fafc] dark:bg-slate-900 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-[850px] h-full max-h-[98vh] flex flex-col overflow-hidden border border-white/10 dark:border-white/5 animate-in fade-in zoom-in duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Elite: Tema Inteligente */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Maximize className="w-5 h-5 text-[#005CA9] dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-tight">Visualização Premium</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">ID: {doc.codigo_qr || doc.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all active:scale-95 shadow-sm shadow-amber-200 dark:shadow-none"
            >
              <Pencil className="w-3.5 h-3.5" /> EDITAR
            </button>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#005CA9] hover:bg-[#004a8a] text-white rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200 dark:shadow-none disabled:opacity-60"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isDownloading ? "GERANDO..." : "DOWNLOAD"}
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar de Interação: Tema Inteligente */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-[110]">
          <button 
            onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all active:scale-90"
            title="Diminuir"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="px-3 min-w-[60px] text-center font-bold text-sm text-[#005CA9] dark:text-blue-400 font-mono">
            {Math.round(scale * 100)}%
          </div>

          <button 
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all active:scale-90"
            title="Aumentar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

          <button 
            onClick={resetView}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all active:scale-90"
            title="Resetar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className={`p-2.5 rounded-xl ${scale > 0.75 ? 'text-blue-500' : 'text-gray-300 dark:text-slate-600'}`} title="Modo Arrastar Ativo">
            <Move className="w-5 h-5" />
          </div>
        </div>

        {/* Viewport do Documento */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-hidden relative flex items-start justify-center p-4 sm:p-12 transition-colors bg-slate-200 dark:bg-[#020617] ${isDragging ? 'cursor-grabbing' : (scale > 0.75 ? 'cursor-grab' : 'cursor-default')}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "top center",
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
              filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.3))"
            }}
          >
            <AttestationDocument
              data={attData}
              logoLeft={attData.logoUrl as string}
              logoRight={attData.logoRight as string}
              signatureColor={attData.signatureColor as string}
              signatureImage={attData.signatureImage as string}
              documentType={(attData as any).documentType}
              logoLeftScale={(attData as any).logoLeftScale || 1}
              logoRightScale={(attData as any).logoRightScale || 1}
              logoLeftX={(attData as any).logoLeftX || 0}
              logoLeftY={(attData as any).logoLeftY || 0}
              logoRightX={(attData as any).logoRightX || 0}
              logoRightY={(attData as any).logoRightY || 0}
              stampScale={attData.stampScale}
              stampX={attData.stampX}
              stampY={attData.stampY}
              stampRotate={attData.stampRotate}
              hideQRCode={attData.hideQRCode}
              showStampInfo={attData.showStampInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
