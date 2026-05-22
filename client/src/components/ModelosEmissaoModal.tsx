import { useState, useEffect } from "react";
import { X, Camera, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from "lucide-react";

interface EmissionModel {
  id: string;
  doc_key: string;
  doc_name: string;
  images: string | string[]; // JSON string or array of base64/URLs
}

interface ModelosEmissaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelosEmissaoModal({ isOpen, onClose }: ModelosEmissaoModalProps) {
  const [models, setModels] = useState<EmissionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<EmissionModel | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/models");
      const json = await res.json();
      if (json.success) {
        setModels(json.models || []);
      }
    } catch (err) {
      console.error("Erro ao carregar modelos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadModels();
  }, [isOpen]);

  const handleSelectModel = (model: EmissionModel) => {
    setSelectedModel(model);
    setCurrentImageIndex(0);
  };

  const getImages = (model: EmissionModel): string[] => {
    try {
      return typeof model.images === "string" ? JSON.parse(model.images) : (model.images || []);
    } catch {
      return [];
    }
  };

  const nextImage = () => {
    if (!selectedModel) return;
    const images = getImages(selectedModel);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!selectedModel) return;
    const images = getImages(selectedModel);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-600 tracking-tight m-0 uppercase italic">
                {selectedModel ? `Modelos: ${selectedModel.doc_name}` : "Modelos de Emissão"}
              </h2>
              <p className="text-[11px] font-bold text-blue-700/60 dark:text-blue-400/60 uppercase tracking-widest">
                {selectedModel ? `Visualizando modelo ${currentImageIndex + 1}/${getImages(selectedModel).length}` : "Confira os detalhes de impressão"}
              </p>
            </div>
          </div>
          <button
            onClick={selectedModel ? () => setSelectedModel(null) : onClose}
            className="w-10 h-10 rounded-full border-none bg-white dark:bg-white/5 shadow-sm cursor-pointer flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
          >
            {selectedModel ? <ChevronLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-50" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando modelos...</p>
            </div>
          ) : !selectedModel ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-white/5 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-blue-500 shadow-sm transition-colors">
                    <Camera size={24} />
                  </div>
                  <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase text-center leading-tight">
                    {model.doc_name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-inner">
                {getImages(selectedModel).length > 0 ? (
                  <>
                    <img
                      src={getImages(selectedModel)[currentImageIndex]}
                      alt={selectedModel.doc_name}
                      className="w-full h-full object-contain cursor-zoom-in active:scale-105 transition-transform"
                      onClick={() => setZoomImage(getImages(selectedModel)[currentImageIndex])}
                    />
                    
                    {getImages(selectedModel).length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg border-none cursor-pointer hover:scale-110 transition-all"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg border-none cursor-pointer hover:scale-110 transition-all"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                    <Camera size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma imagem disponível</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <ZoomIn size={14} className="text-blue-500" /> Clique na imagem para ampliar
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            DocMaster Preview System © 2026
          </p>
        </div>
      </div>

      {/* Zoom Overlay */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setZoomImage(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors border-none bg-transparent cursor-pointer">
            <X size={32} />
          </button>
          <img src={zoomImage} alt="Zoom" className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-500" />
        </div>
      )}
    </div>
  );
}
