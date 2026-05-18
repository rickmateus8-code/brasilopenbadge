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
    setScale(0.65);
    setPos({ x: 0, y: 0 });
  };

  return (
    <div 
      className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-8"
      onClick={onClose}
    >
      <div 
        className="bg-[#f8fafc] rounded-3xl shadow-2xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Elite */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Maximize className="w-5 h-5 text-[#005CA9]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Visualização Premium</h3>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Documento ID: {doc.codigo_qr || doc.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all active:scale-95 shadow-sm shadow-amber-200"
            >
              <Pencil className="w-3.5 h-3.5" /> EDITAR
            </button>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#005CA9] hover:bg-[#004a8a] text-white rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200 disabled:opacity-60"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isDownloading ? "GERANDO..." : "DOWNLOAD PDF"}
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar de Interação */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gray-100 z-[110]">
          <button 
            onClick={() => setScale(s => Math.max(0.4, s - 0.1))}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all active:scale-90"
            title="Diminuir"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="px-3 min-w-[60px] text-center font-bold text-sm text-[#005CA9] font-mono">
            {Math.round(scale * 100)}%
          </div>

          <button 
            onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all active:scale-90"
            title="Aumentar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button 
            onClick={resetView}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all active:scale-90"
            title="Resetar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className={`p-2.5 rounded-xl ${scale > 0.75 ? 'text-blue-500' : 'text-gray-300'}`} title="Modo Arrastar Ativo">
            <Move className="w-5 h-5" />
          </div>
        </div>

        {/* Viewport do Documento */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-hidden relative flex items-start justify-center p-8 transition-colors ${isDragging ? 'cursor-grabbing' : (scale > 0.75 ? 'cursor-grab' : 'cursor-default')}`}
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
              filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.15))"
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
