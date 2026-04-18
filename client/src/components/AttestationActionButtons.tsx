import { Download, Edit3, Eye, Loader2, Trash2 } from "lucide-react";

interface AttestationActionButtonsProps {
  onView: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export default function AttestationActionButtons({
  onView,
  onDelete,
  onEdit,
  onDownload,
  isDownloading = false,
}: AttestationActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      <button
        type="button"
        title="Visualizar documento"
        aria-label="Visualizar documento"
        onClick={onView}
        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <Eye className="w-4 h-4" />
      </button>

      {onEdit && (
        <button
          type="button"
          title="Editar"
          aria-label="Editar"
          onClick={onEdit}
          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      )}

      {onDownload && (
        <button
          type="button"
          title="Baixar PDF"
          aria-label="Baixar PDF"
          disabled={isDownloading}
          onClick={onDownload}
          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
      )}

      <button
        type="button"
        title="Excluir documento"
        aria-label="Excluir documento"
        onClick={onDelete}
        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
