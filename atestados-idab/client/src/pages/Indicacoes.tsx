import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, Users, TrendingUp, Wallet, Gift, ArrowUpRight, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  referralCode: string;
}

interface ReferralUser {
  username: string;
  created_at: string;
  status: 'ATIVO' | 'PENDENTE';
}

interface CommissionHistory {
  referee_username: string;
  date: string;
  amount: number;
}

export default function Indicacoes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommissions: 0,
    referralCode: ""
  });
  const [network, setNetwork] = useState<ReferralUser[]>([]);
  const [history, setHistory] = useState<CommissionHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supportWhatsapp, setSupportWhatsapp] = useState("");

  const referralLink = `${window.location.origin}/register?ref=${stats.referralCode || user?.username || ""}`;

  useEffect(() => {
    fetch("/api/settings/public", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.support_whatsapp) setSupportWhatsapp(data.support_whatsapp);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/referral", { credentials: "include" });
        const data = await response.json();
        
        // Mapear dados do backend existente para o novo layout
        if (data.code) {
          setStats({
            totalReferrals: data.totalReferred || 0,
            activeReferrals: data.referredUsers?.length || 0,
            totalCommissions: data.totalEarnings || 0,
            referralCode: data.code
          });
          
          setNetwork(data.referredUsers?.map((u: any) => ({
            username: u.name || u.email || "Usuário",
            created_at: u.created_at,
            status: 'ATIVO'
          })) || []);
          
          // O histórico de comissões pode ser derivado ou buscado separadamente se necessário
          setHistory(data.referredUsers?.filter((u: any) => u.total_earned > 0).map((u: any) => ({
            referee_username: u.name || u.email || "Usuário",
            date: u.created_at,
            amount: u.total_earned
          })) || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de indicação:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link de indicação copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0f172a] flex items-center justify-center p-4 md:p-8 font-sans">
        
        {/* Modal Estilo docmaster.store */}
        <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
          
          {/* Botão Fechar */}
          <button 
            onClick={() => setLocation("/dashboard")}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
          >
            <X size={18} />
          </button>

          {/* Header do Modal */}
          <div className="p-8 pb-0">
            <h1 className="text-2xl font-black text-[#1e293b] dark:text-white flex items-center gap-3 mb-2">
              <Gift className="text-[#10b981]" size={28} />
              Indique e Ganhe
            </h1>
          </div>

          <div className="p-8 pt-4 space-y-6">
            {/* Banner de Ganho */}
            <div className="bg-[#f0fdf4] dark:bg-emerald-500/10 border border-[#dcfce7] dark:border-emerald-500/20 rounded-2xl p-5">
              <p className="text-[#166534] dark:text-emerald-400 text-[15px] font-bold leading-snug mb-2">
                Ganhe 10% de TODAS as recargas dos seus amigos, para sempre!
              </p>
              <p className="text-[#14532d] dark:text-emerald-500/80 text-xs font-medium leading-relaxed">
                Você recebe 10% de comissão em saldo sobre cada transação realizada pelos seus indicados para gerar documentos.
              </p>
            </div>

            {/* Link de Afiliado */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu Link Exclusivo</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate flex items-center">
                  {referralLink}
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-[#1e293b] dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-black text-xs hover:opacity-90 transition-all active:scale-95"
                >
                  {copied ? "COPIADO" : "COPIAR"}
                </button>
              </div>
            </div>

            {/* Minha Rede */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Users size={14} />
                Minha Rede
              </div>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {network.length > 0 ? network.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                        {member.username.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{member.username}</div>
                        <div className="text-[9px] text-slate-400 font-medium">{new Date(member.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-full uppercase">
                      {member.status}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-400 text-[11px] font-medium italic">
                    Nenhum indicado ainda...
                  </div>
                )}
              </div>
            </div>

            {/* Últimos Ganhos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <TrendingUp size={14} />
                Últimos Ganhos
              </div>
              
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length > 0 ? history.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600">
                        <ArrowUpRight size={12} />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">{item.referee_username}</div>
                        <div className="text-[9px] text-slate-400 font-medium">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                      + R$ {(item.amount / 100).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-400 text-[11px] font-medium italic">
                    Nenhuma comissão recebida.
                  </div>
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Wallet size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Ganho</span>
                </div>
                <div className="text-xl font-black text-[#1e293b] dark:text-white">
                  R$ {(stats.totalCommissions / 100).toFixed(2).replace('.', ',')}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-[#ef4444] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                  Não fazemos devolução ou transferência de saldo.
                </div>
                <a 
                  href={supportWhatsapp ? `https://wa.me/${supportWhatsapp.replace(/\D/g, "")}` : "#"}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 text-[13px] font-bold hover:bg-slate-100 transition-all"
                >
                  <MessageCircleIcon size={16} className="text-[#22c55e]" />
                  Suporte com o Pagamento
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </DashboardLayout>
  );
}

function MessageCircleIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
