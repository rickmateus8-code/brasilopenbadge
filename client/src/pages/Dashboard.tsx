import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import NovoDocumentoModal from "@/components/NovoDocumentoModal";
import RecarregaModal from "@/components/RecarregaModal";
import {
  FileText, Car, Anchor, FlaskConical, GraduationCap,
  Wallet, TrendingUp, BarChart3, ChevronRight, Plus,
  Clock, CheckCircle, Bell, Download, Trash2, Pill, Pencil, QrCode,
  Copy, X, Send, RefreshCw, Search, Save, Smartphone, AlertTriangle, Gift, Users, Loader2
} from "lucide-react";

const quickActionsRaw = [
  { key: "atestado", icon: FileText, label: "Novo Atestado", desc: "Emitir atestado médico", path: "/atestadocria", color: "yellow" },
  { key: "cnh", icon: Car, label: "Nova CNH", desc: "Emitir CNH digital", path: "/cnhcria", color: "amber" },
  { key: "cha", icon: Anchor, label: "Nova CHA", desc: "Emitir CHA náutica", path: "/chacria", color: "cyan" },
  { key: "toxicologico", icon: FlaskConical, label: "Toxicológico", desc: "Emitir laudo toxicológico", path: "/toxicria", color: "emerald" },
  { key: "historico-sp", icon: GraduationCap, label: "Histórico SP", desc: "Emitir histórico escolar SP", path: "/historico-sp", color: "green" },
  { key: "historico-uninter", icon: GraduationCap, label: "Histórico UNINTER", desc: "Emitir histórico UNINTER", path: "/historico-uninter", color: "indigo" },
  { key: "receita", icon: Pill, label: "Dr. Consulta", desc: "Emitir receituário médico", path: "/receitacria", color: "violet" },
  { key: "peticao-stj", icon: FileText, label: "STJ Petição", desc: "Emitir petição jurídica STJ", path: "/peticaocria", color: "indigo" },
  { key: "bot-adv", icon: Search, label: "Bot Adv", desc: "Consulta Judicial Inteligente", path: "/bot-adv", color: "blue" },
];

const colorMap: Record<string, { bg: string; text: string; iconBg: string; badge: string }> = {
  yellow:  { bg: "bg-yellow-50 dark:bg-yellow-900/10",  text: "text-yellow-600 dark:text-yellow-400",  iconBg: "bg-yellow-100 dark:bg-yellow-900/30", badge: "bg-yellow-500" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-900/10",    text: "text-amber-600 dark:text-amber-400",    iconBg: "bg-amber-100 dark:bg-amber-900/30",   badge: "bg-amber-500" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-900/10",      text: "text-cyan-600 dark:text-cyan-400",      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",     badge: "bg-cyan-500" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-900/10",  text: "text-purple-600 dark:text-purple-400",  iconBg: "bg-purple-100 dark:bg-purple-900/30", badge: "bg-purple-500" },
  green:   { bg: "bg-green-50 dark:bg-green-900/10",    text: "text-green-600 dark:text-green-400",    iconBg: "bg-green-100 dark:bg-green-900/30",   badge: "bg-green-500" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-900/10",  text: "text-indigo-600 dark:text-indigo-400",  iconBg: "bg-indigo-100 dark:bg-indigo-900/30", badge: "bg-indigo-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10",text: "text-emerald-600 dark:text-emerald-400",iconBg: "bg-emerald-100 dark:bg-emerald-900/30",badge: "bg-emerald-500" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-900/10",  text: "text-violet-600 dark:text-violet-400",  iconBg: "bg-violet-100 dark:bg-violet-900/30",  badge: "bg-violet-500" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-900/10",    text: "text-blue-600 dark:text-blue-400",    iconBg: "bg-blue-100 dark:bg-blue-900/30",   badge: "bg-blue-500" },
};

const INITIAL_HISTORY_TABS = [
  { key: "atestado", label: "Atestado", icon: FileText, color: "yellow" },
  { key: "cnh", label: "CNH", icon: Car, color: "amber" },
  { key: "cha", label: "CHA", icon: Anchor, color: "cyan" },
  { key: "historico-sp", label: "Histórico SP", icon: GraduationCap, color: "green" },
  { key: "historico-uninter", label: "UNINTER", icon: GraduationCap, color: "indigo" },
  { key: "receita", label: "Receitas", icon: Pill, color: "violet" },
];

const TAB_LABELS: Record<string, string> = {
  atestado: "Atestado",
  cnh: "CNH",
  cha: "CHA",
  "historico-sp": "Histórico SP",
  "historico-uninter": "UNINTER",
  receita: "Receita",
};

interface DocRecord {
  id: string;
  seq_id?: number;
  type: string;
  paciente?: string;
  nome?: string;
  cpf?: string;
  created_at: string;
  status: string;
}

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("atestado");
  const [historyTabs, setHistoryTabs] = useState(INITIAL_HISTORY_TABS);
  const [history, setHistory] = useState<DocRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [showNovoDocModal, setShowNovoDocModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showRecarregaModal, setShowRecarregaModal] = useState(false);

  useEffect(() => {
    refresh();
    loadStats();
    loadNotifications();
  }, [refresh]);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/attestations?stats=1", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications.slice(0, 3));
      }
    } catch {}
  };

  const loadHistory = async (type: string) => {
    setHistoryLoading(true);
    try {
      const endpoint = type === "atestado" ? `/api/attestations?limit=50` : type === "receita" ? `/api/receitas?limit=50` : `/api/documents/${type}?limit=50`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || data.attestations || data.documents || []);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(activeTab);
  }, [activeTab]);

  const perms = user?.permissions ? JSON.parse(user.permissions) : { editaveis: [], ferramentas: [] };
  const allowedEditables = Array.isArray(perms.editaveis) ? perms.editaveis : [];
  const allowedTools = Array.isArray(perms.ferramentas) ? perms.ferramentas : [];

  const isToolAllowed = (key: string) => {
    if (user?.role === "admin") return true;
    if (["bot-adv", "peticao-stj"].includes(key)) return allowedTools.includes(key);
    if (key === "toxicria") return allowedEditables.includes("toxicologico");
    return allowedEditables.includes(key);
  };

  const filteredQuickActions = quickActionsRaw.filter(action => isToolAllowed(action.key));
  const hasAnyPermission = filteredQuickActions.length > 0;
  const hasEmissions = Object.values(stats).some(val => typeof val === 'number' && val > 0);

  return (
    <DashboardLayout>
      <div className="p-7 max-w-7xl mx-auto">
        {/* Banner de Boas-vindas */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
              Olá, {user?.displayName || user?.username}!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium max-w-2xl">
              Bem-vindo ao maior e melhor painel da atualidade — <span className="text-red-600 font-bold">DocMaster</span>
            </p>
            {hasAnyPermission && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setShowNovoDocModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Novo Documento
                </button>
                <button onClick={() => setLocation("/configuracoes")} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Configurações
                </button>
              </div>
            )}
            {!hasAnyPermission && user?.role !== "admin" && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Aguardando Liberação do Administrador
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">Sua conta está ativa, mas você ainda não possui ferramentas liberadas.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {hasEmissions && (
          <div className="mb-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Estatísticas</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: FileText, label: "Atestados", value: stats.atestado ?? 0, color: "yellow" },
                { icon: Car, label: "CNHs", value: stats.cnh ?? 0, color: "amber" },
                { icon: Anchor, label: "CHAs", value: stats.cha ?? 0, color: "cyan" },
                { icon: Pill, label: "Receitas", value: stats.receita ?? 0, color: "violet" },
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${colorMap[s.color].iconBg}`}>
                    <s.icon className={`w-5 h-5 ${colorMap[s.color].text}`} />
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {hasEmissions && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Histórico de Emissões</h2>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
                {historyTabs.filter(t => isToolAllowed(t.key)).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.key ? "border-red-600 text-red-600 bg-red-50/30" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {historyLoading ? (
                  <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" /></div>
                ) : history.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhuma {TAB_LABELS[activeTab] || activeTab} emitida ainda</h3>
                    <button onClick={() => setLocation(quickActionsRaw.find(a => a.key === activeTab)?.path || "/dashboard")} className="mt-4 px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase">Emitir Documento</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-50 dark:border-gray-800">
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Documento</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Data</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(doc => (
                          <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                            <td className="px-4 py-4 text-xs font-bold text-gray-700 dark:text-gray-300">{doc.paciente || doc.nome || "Sem nome"}</td>
                            <td className="px-4 py-4 text-[10px] font-mono text-gray-400">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="px-4 py-4 text-right">
                              <button onClick={() => setLocation(`/view/${doc.id}`)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><QrCode size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Access */}
        {hasAnyPermission && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Acesso Rápido</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredQuickActions.map((action, i) => (
                <button key={i} onClick={() => setLocation(action.path)} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-red-200 transition-all text-left group">
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${colorMap[action.color].iconBg}`}>
                    <action.icon className={`w-5 h-5 ${colorMap[action.color].text}`} />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-red-600 transition-colors">{action.label}</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase mt-1">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <NovoDocumentoModal open={showNovoDocModal} onClose={() => setShowNovoDocModal(false)} userBalance={user?.balance || 0} username={user?.username || ""} />
      <RecarregaModal isOpen={showRecarregaModal} onClose={() => setShowRecarregaModal(false)} userName={user?.displayName || user?.username || ""} />
    </DashboardLayout>
  );
}
