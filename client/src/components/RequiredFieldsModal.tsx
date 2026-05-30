import React from "react";
import { AlertCircle, X, CheckCircle2, ChevronRight } from "lucide-react";

interface RequiredFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  onConfirm: () => void;
}

export default function RequiredFieldsModal({ isOpen, onClose, missingFields, onConfirm }: RequiredFieldsModalProps) {
  if (!isOpen) return null;

  const hasMissing = missingFields.length > 0;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between ${hasMissing ? "bg-amber-500/5" : "bg-[#005CA9]/5"}`}>
          <div className="flex items-center gap-4">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${hasMissing ? "bg-amber-500 shadow-amber-500/20" : "bg-[#005CA9] shadow-blue-500/20"}`}>
                {hasMissing ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight m-0">
                  {hasMissing ? "Campos Pendentes" : "Confirmar Emissão"}
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Validação de Integridade Elite</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border-none bg-slate-100 dark:bg-slate-800 cursor-pointer flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
           {hasMissing ? (
             <div className="space-y-6">
                <p className="text-sm text-slate-500 font-medium text-center">
                  Para garantir a <strong className="text-slate-900 dark:text-white">validade forense</strong> do documento, os seguintes campos devem ser preenchidos:
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 grid grid-cols-1 gap-3">
                   {missingFields.map((field, i) => (
                     <div key={i} className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[11px] font-black uppercase tracking-wider">{field}</span>
                     </div>
                   ))}
                </div>
                <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">
                   VOLTAR E PREENCHER
                </button>
             </div>
           ) : (
             <div className="space-y-6 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Tudo pronto! Todos os campos obrigatórios foram validados com sucesso.
                </p>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                   <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest">Saldo será descontado após a emissão</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={onClose} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all">
                    CANCELAR
                  </button>
                  <button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2">
                    EMITIR AGORA <ChevronRight size={14} />
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
