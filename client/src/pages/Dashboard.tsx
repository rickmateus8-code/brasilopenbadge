import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, Car, Anchor, FlaskConical, GraduationCap,
  Wallet, TrendingUp, BarChart3, ChevronRight, Plus,
  Clock, CheckCircle, Bell, Eye, Download, Trash2, Pill, Pencil, QrCode
} from "lucide-react";

const quickActions = [
  { icon: FileText, label: "Novo Atestado", desc: "Emitir atestado médico", path: "/atestadocria", color: "yellow" },
  { icon: Car, label: "Nova CNH", desc: "Emitir CNH digital", path: "/cnhcria", color: "amber" },
  { icon: Anchor, label: "Nova CHA", desc: "Emitir CHA náutica", path: "/chacria", color: "cyan" },
  { icon: FlaskConical, label: "Novo Toxicológico", desc: "Emitir exame toxicológico", path: "/toxicologicocria", color: "purple" },
  { icon: GraduationCap, label: "Histórico SP", desc: "Emitir histórico escolar SP", path: "/historico-sp", color: "green" },
  { icon: GraduationCap, label: "Histórico UNINTER", desc: "Emitir histórico UNINTER", path: "/historico-uninter", color: "indigo" },
  { icon: Pill, label: "Dr. Consulta", desc: "Emitir receituário médico", path: "/receitacria", color: "violet" },
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
};

const HISTORY_TABS = [
  { key: "atestado", label: "Atestado", icon: FileText, color: "yellow" },
  { key: "cnh", label: "CNH", icon: Car, color: "amber" },
  { key: "cha", label: "CHA", icon: Anchor, color: "cyan" },
  { key: "toxicologico", label: "Toxicológico", icon: FlaskConical, color: "purple" },
  { key: "historico-sp", label: "Histórico SP", icon: GraduationCap, color: "green" },
  { key: "historico-uninter", label: "UNINTER", icon: GraduationCap, color: "indigo" },
  { key: "receita", label: "Receitas", icon: Pill, color: "violet" },
];

interface DocRecord {
  id: string;
  type: string;
  paciente?: string;
  nome?: string;
  created_at: string;
  status: string;
  codigo_qr?: string;
  codigo_validacao?: string;
  data_emissao?: string;
  medico?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("atestado");
  const [history, setHistory] = useState<DocRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadNotifications();
  }, []);

  useEffect(() => {
    loadHistory(activeTab);
  }, [activeTab]);

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
      const endpoint = type === "atestado"
        ? `/api/attestations?limit=50`
        : type === "receita"
        ? `/api/receitas?limit=50`
        : `/api/documents/${type}?limit=50`;
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // Endpoint genérico por tipo de documento
      let endpoint = `/api/attestations/${id}`;
      if (activeTab === "receita") endpoint = `/api/receitas/${id}`;
      else if (activeTab === "cnh" || activeTab === "cha" || activeTab === "toxicologico" || activeTab === "historico-sp" || activeTab === "historico-uninter") endpoint = `/api/documents/${id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setHistory(prev => prev.filter(d => d.id !== id));
        setConfirmDeleteId(null);
      } else {
        alert("Erro ao excluir documento.");
      }
    } catch {
      alert("Erro ao excluir documento.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      // Já está em DD/MM/YYYY — retorna direto
      if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        return dateStr.slice(0, 10);
      }
      // Formato ISO YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ
      if (dateStr.includes("-") && dateStr.length >= 10) {
        const [y, m, d] = dateStr.slice(0, 10).split("-");
        return `${d}/${m}/${y}`;
      }
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  const activeTabInfo = HISTORY_TABS.find(t => t.key === activeTab)!;

  return (
    <DashboardLayout>
      <div className="p-7 max-w-7xl mx-auto">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                n.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
                n.type === "error" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" :
                "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
              }`}>
                <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  n.type === "warning" ? "text-amber-500" :
                  n.type === "error" ? "text-red-500" :
                  "text-yellow-500"
                }`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-7 mb-7 text-white shadow-lg">
          <h1 className="text-2xl font-bold">
            Olá, <span className="text-red-100">{user?.displayName || user?.username}</span>! 👋
          </h1>
          <p className="text-red-100 mt-1 text-sm">
            Bem-vindo ao maior e melhor painel da atualidade — <strong>DocMaster</strong>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById("acesso-rapido");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Documento
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              Estatísticas
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: "Atestados Emitidos", value: stats.atestado ?? 0, color: "yellow" },
              { icon: Car, label: "CNHs Emitidas", value: stats.cnh ?? 0, color: "amber" },
              { icon: Anchor, label: "CHAs Emitidas", value: stats.cha ?? 0, color: "cyan" },
              { icon: Wallet, label: "Saldo Disponível", value: `R$ ${((user?.balance || 0) / 100).toFixed(2).replace(".", ",")}`, color: "emerald" },
            ].map(({ icon: Icon, label, value, color }) => {
              const c = colorMap[color];
              return (
                <div key={label} className={`${c.bg} rounded-xl p-5 flex items-center gap-3`}>
                  <div className={`${c.iconBg} rounded-lg p-3 flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emission History */}
        <div id="historico-atestados" className="mb-7">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              Histórico de Emissões
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 flex-wrap mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {HISTORY_TABS.map(tab => {
              const c = colorMap[tab.color];
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? `${c.badge} text-white shadow-sm`
                      : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Clock className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Nenhum documento emitido ainda</p>
                <button
                  onClick={() => setLocation(quickActions.find(q => q.path.includes(activeTab.split("-")[0]))?.path || "/atestadocria")}
                  className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Emitir agora
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Código QR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criado Em</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {history.map(doc => {
                      const codigoQR = doc.codigo_qr || doc.codigo_validacao || "";
                      const dataEmissao = doc.data_emissao || doc.created_at;
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {doc.paciente || doc.nome || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              {codigoQR ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" title="QR Code ativo">
                                  <QrCode className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400" title="Sem QR Code">
                                  <QrCode className="w-3 h-3 opacity-40" />
                                </span>
                              )}
                              <span>{codigoQR || doc.id?.slice(0, 8) || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(dataEmissao)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              {doc.status || "emitido"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Editar */}
                              {activeTab === "atestado" && (
                                <button
                                  title="Editar atestado"
                                  onClick={() => setLocation(`/atestado/editar/${doc.id}`)}
                                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {activeTab === "receita" && (
                                <button
                                  title="Editar receita"
                                  onClick={() => setLocation(`/receita/editar/${doc.id}`)}
                                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {/* Baixar PDF / Ver */}
                              <button
                                title="Ver documento"
                                onClick={() => {
                                  if (activeTab === "atestado") setLocation(`/historico/atestados/${doc.id}`);
                                  else if (activeTab === "receita") setLocation(`/v/${doc.codigo_qr || doc.id}`);
                                  else if (activeTab === "cnh") setLocation(`/v/${doc.codigo_qr || doc.id}`);
                                  else setLocation(`/v/${doc.codigo_qr || doc.id}`);
                                }}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {/* Excluir — disponível para todos os tipos */}
                              <button
                                title="Excluir documento"
                                onClick={() => setConfirmDeleteId(doc.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div id="acesso-rapido">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              Acesso Rápido
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map(({ icon: Icon, label, desc, path, color }) => {
              const c = colorMap[color];
              return (
                <button
                  key={path}
                  onClick={() => setLocation(path)}
                  className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800 hover:shadow-md transition-all group text-left"
                >
                  <div className={`${c.iconBg} rounded-lg p-3 flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "32px 40px",
              textAlign: "center", maxWidth: 380, width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#dc2626", margin: "0 0 8px" }}>
              Excluir Documento?
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
              Esta ação não pode ser desfeita. O documento será removido permanentemente.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                  background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: deletingId ? "not-allowed" : "pointer",
                  opacity: deletingId ? 0.7 : 1,
                }}
                disabled={!!deletingId}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                {deletingId === confirmDeleteId ? "Excluindo..." : "Sim, Excluir"}
              </button>
              <button
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e5e7eb",
                  background: "#f9fafb", color: "#374151", fontWeight: 700, fontSize: 13,
                  cursor: "pointer",
                }}
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
