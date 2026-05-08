import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Receipt, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";

interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  description: string;
  created_at: string;
}

export default function Extrato() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", { credentials: "include" });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Extrato</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Histórico de movimentações</p>
            </div>
          </div>
          <button onClick={load} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.type === "credit"
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-red-100 dark:bg-red-900/20"
                }`}>
                  {tx.type === "credit"
                    ? <ArrowUpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${
                  tx.type === "credit"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}>
                  {tx.type === "credit" ? "+" : "-"}R$ {(tx.amount / 100).toFixed(2).replace(".", ",")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
