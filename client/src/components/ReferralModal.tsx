import { useState, useEffect } from "react";
import { X, Gift, Network, HandHoldingUsd, Copy, Check, Users, ArrowUp, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReferredUser {
  id: string;
  username: string;
  created_at: string;
  is_active: number;
}

interface Earning {
  earned_amount: number;
  created_at: string;
  referred_username: string;
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referral", { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de indicação:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const handleCopy = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    toast.success("Link copiado com sucesso!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-600 tracking-tight m-0 uppercase italic">
                Indique e Ganhe
              </h2>
              <p className="text-[11px] font-bold text-emerald-700/60 dark:text-emerald-400/60 uppercase tracking-widest">Programa de Afiliados Elite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border-none bg-white dark:bg-white/5 shadow-sm cursor-pointer flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 opacity-50" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando rede...</p>
            </div>
          ) : (
            <>
              {/* Explicativo */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-5">
                <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 leading-snug mb-2">
                  Ganhe 10% de TODAS as recargas dos seus amigos, para sempre!
                </p>
                <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 font-medium leading-relaxed">
                  Você recebe 10% de comissão em saldo sobre cada transação realizada pelos seus indicados para gerar documentos.
                </p>
              </div>

              {/* Link Section */}
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 block px-1">
                  Seu Link Exclusivo
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-black text-gray-700 dark:text-gray-200 truncate">
                    {data?.referralLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
                      copied
                        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                        : "bg-white dark:bg-white/5 border-gray-900 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50"
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "COPIADO" : "COPIAR"}
                  </button>
                </div>
              </div>

              {/* Minha Rede */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest flex items-center gap-2">
                    <Network size={14} className="text-blue-500" /> Minha Rede
                  </h3>
                  <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {data?.network?.length || 0} INDICADOS
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                  <div className="max-h-[140px] overflow-y-auto custom-scrollbar">
                    {data?.network?.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-40">
                        Ninguém na sua rede ainda
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {data?.network?.map((user: ReferredUser) => (
                            <tr key={user.id} className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-black text-gray-700 dark:text-gray-200 uppercase">{user.username}</td>
                              <td className="px-4 py-3 text-gray-400 font-bold">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  user.is_active ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                                }`}>
                                  {user.is_active ? "ATIVO" : "INATIVO"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Últimos Ganhos */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <HandHoldingUsd size={14} className="text-emerald-500" /> Últimos Ganhos
                </h3>
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                  <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                    {data?.earnings?.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-40">
                        Nenhum ganho registrado
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {data?.earnings?.map((earning: Earning, idx: number) => (
                          <div key={idx} className="px-4 py-4 flex items-center justify-between hover:bg-white dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                <ArrowUp size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-800 dark:text-gray-200 m-0 uppercase leading-none">
                                  {earning.referred_username}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 m-0 mt-1 uppercase">
                                  {new Date(earning.created_at).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-emerald-600 italic tracking-tighter m-0">
                                + R$ {Number(earning.earned_amount).toFixed(2).replace(".", ",")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            DocMaster Affiliate © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
