import { X, Settings, Gift, Receipt, CreditCard, HelpCircle, LogOut, User, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { type AuthUser } from "@/contexts/AuthContext";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  logout: () => void;
  onOpenRecarregaModal: () => void;
  onOpenExtratoModal: () => void;
  onOpenReferralModal: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  logout,
  onOpenRecarregaModal,
  onOpenExtratoModal,
  onOpenReferralModal,
}: UserProfileModalProps) {
  const [, setLocation] = useLocation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Profile Info */}
        <div className="p-8 text-center bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent border-b border-gray-100 dark:border-white/5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border-none bg-white/50 dark:bg-white/5 cursor-pointer flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-red-600 dark:text-red-400" />
            )}
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight m-0 leading-tight">
            {user.displayName || user.username}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1 mb-3">{user.email}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
            {user.role === "admin" ? <><Shield size={10} /> Administrador</> : "Usuário DocMaster"}
          </div>
        </div>

        {/* Options Grid */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => { setLocation("/configuracoes"); onClose(); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
          >
            <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Ajustes</span>
          </button>

          <button
            onClick={() => { onOpenReferralModal(); onClose(); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
          >
            <Gift className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Indicar</span>
          </button>

          <button
            onClick={() => { onOpenExtratoModal(); onClose(); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
          >
            <Receipt className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Extrato</span>
          </button>

          <button
            onClick={() => { onOpenRecarregaModal(); onClose(); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
          >
            <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Recarga</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-8 space-y-2">
          <a
            href="https://wa.me/5511965355468?text=Preciso+de+suporte"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors border border-transparent hover:border-blue-500/20"
          >
            <HelpCircle className="w-4 h-4" /> Ajuda / Suporte
          </a>
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-xs font-black text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all border border-transparent hover:border-rose-500/30"
          >
            <LogOut className="w-4 h-4" /> SAIR DA CONTA
          </button>
        </div>
      </div>
    </div>
  );
}
