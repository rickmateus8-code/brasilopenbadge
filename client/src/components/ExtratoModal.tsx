import { useState, useEffect } from "react";
import { X, Receipt, ArrowUpCircle, ArrowDownCircle, RefreshCw, Loader2, Landmark } from "lucide-react";

interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  description: string;
  created_at: string;
}

interface ExtratoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExtratoModal({ isOpen, onClose }: ExtratoModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Erro ao carregar extrato:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight m-0 uppercase italic">
                Extrato <span className="font-light opacity-50 mx-1">|</span> Financeiro
              </h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Movimentações de Saldo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="w-10 h-10 rounded-full border-none bg-white dark:bg-white/5 shadow-sm cursor-pointer flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border-none bg-white dark:bg-white/5 shadow-sm cursor-pointer flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-50" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando extrato...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-40">
              <Landmark className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-sm font-bold uppercase tracking-widest">Nenhuma movimentação</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="group relative bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    tx.type === "credit"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                      : "bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                  }`}>
                    {tx.type === "credit"
                      ? <ArrowUpCircle className="w-6 h-6" />
                      : <ArrowDownCircle className="w-6 h-6" />
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-gray-800 dark:text-gray-200 leading-tight mb-1 truncate">
                      {tx.description}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {new Date(tx.created_at).toLocaleString("pt-BR", {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black italic tracking-tight ${
                      tx.type === "credit"
                        ? "text-emerald-600"
                        : "text-rose-500"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"} R$ {(tx.amount / 100).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            DocMaster Financeiro © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
