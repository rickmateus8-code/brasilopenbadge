import { Download, Pencil, Loader2, X } from "lucide-react";
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mt-4 mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Visualizar Documento</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-60"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? "Gerando..." : "Baixar PDF"}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="bg-white p-4 overflow-x-auto">
          <div style={{ transform: "scale(0.75)", transformOrigin: "top center", width: "794px", margin: "0 auto" }}>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
