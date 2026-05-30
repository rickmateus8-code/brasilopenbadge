import { Download, Pencil, Eye, Loader2, Trash2, MessageCircle, Clock } from "lucide-react";

interface AttestationActionButtonsProps {
  onView?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onWhatsApp?: () => void;
  onRenew?: () => void;
  isDownloading?: boolean;
}

export default function AttestationActionButtons({
  onView,
  onDelete,
  onEdit,
  onDownload,
  onWhatsApp,
  onRenew,
  isDownloading = false,
}: AttestationActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {onRenew && (
        <button
          type="button"
          title="Ficar mais meses no painel (Renovar)"
          aria-label="Ficar mais meses no painel (Renovar)"
          onClick={onRenew}
          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          title="Editar Registro"
          aria-label="Editar Registro"
          onClick={onEdit}
          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {onView && (
        <button
          type="button"
          title="Ver PDF / Exportar"
          aria-label="Ver PDF / Exportar"
          onClick={onView}
          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {onDownload && (
        <button
          type="button"
          title="Baixar PDF Direto"
          aria-label="Baixar PDF Direto"
          disabled={isDownloading}
          onClick={onDownload}
          className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
      )}

      {onWhatsApp && (
        <button
          type="button"
          title="Enviar WhatsApp"
          aria-label="Enviar WhatsApp"
          onClick={onWhatsApp}
          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          title="Apagar Registro"
          aria-label="Apagar Registro"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
