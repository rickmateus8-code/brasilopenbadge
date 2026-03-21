import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  Users, Settings, Plus, Minus, Shield,
  RefreshCw, DollarSign, Trash2, ToggleLeft, ToggleRight,
  Bell, AlertTriangle, CheckCircle, Info, FileText,
  Activity, Database, Search, Eye, X, Save
} from "lucide-react";

type Tab = "users" | "pricing" | "notices" | "logs" | "emissions" | "database" | "settings";

interface EmissionRow {
  id: string;
  user_id: string;
  username?: string;
  paciente?: string;
  nome?: string;
  type: string;
  status: string;
  codigo_qr?: string;
  created_at: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  balance: number;
  is_active: number;
  created_at: string;
  profile_photo?: string;
}

interface PricingRow {
  document_type: string;
  display_name: string;
  price: number;
}

interface LogRow {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  details?: string;
  created_at: string;
}

interface NoticeRow {
  id?: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  is_active: number;
  created_at?: string;
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "users", label: "Usuários", icon: Users },
  { key: "pricing", label: "Preços", icon: DollarSign },
  { key: "notices", label: "Avisos", icon: Bell },
  { key: "logs", label: "Logs", icon: Activity },
  { key: "emissions", label: "Emissões", icon: FileText },
  { key: "database", label: "Banco de Dados", icon: Database },
  { key: "settings", label: "Configurações", icon: Settings },
];

const NOTICE_TYPES = [
  { value: "info", label: "Informação", icon: Info },
  { value: "warning", label: "Aviso", icon: AlertTriangle },
  { value: "error", label: "Urgente", icon: AlertTriangle },
  { value: "success", label: "Sucesso", icon: CheckCircle },
];

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("users");

  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [balanceInputs, setBalanceInputs] = useState<Record<number, string>>({});
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);

  // Pricing
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  // Notices
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [newNotice, setNewNotice] = useState<NoticeRow>({
    title: "", message: "", type: "info", is_active: 1
  });

  // Logs
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logFilter, setLogFilter] = useState("");

  // Emissions
  const [emissions, setEmissions] = useState<EmissionRow[]>([]);
  const [emissionsFilter, setEmissionsFilter] = useState("");

  // Database
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteUserConfirm, setDeleteUserConfirm] = useState("");
  const [deleteTargetUserId, setDeleteTargetUserId] = useState<number | null>(null);
  const [deleteTargetUsername, setDeleteTargetUsername] = useState("");

  // Settings
  const [settings, setSettings] = useState({
    site_name: "DocMaster",
    support_whatsapp: "5511965355468",
    max_documents_per_day: "100",
    auto_delete_days: "60",
    maintenance_mode: false,
  });

  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch { toast.error("Erro ao carregar usuários"); }
    finally { setLoading(false); }
  }, []);

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPricing(data.pricing || []);
        const ep: Record<string, string> = {};
        (data.pricing || []).forEach((p: PricingRow) => {
          ep[p.document_type] = (p.price / 100).toFixed(2);
        });
        setEditingPrice(ep);
      }
    } catch { toast.error("Erro ao carregar preços"); }
  }, []);

  const loadNotices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { credentials: "include" });
      const data = await res.json();
      if (data.success) setNotices(data.notifications || []);
    } catch {}
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs", { credentials: "include" });
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch { toast.error("Erro ao carregar logs"); }
    finally { setLoading(false); }
  }, []);

  const loadEmissions = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar atestados (admin vê todos)
      const res = await fetch("/api/attestations", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const attestations = (data.data || []).map((a: any) => ({
          ...a,
          type: "atestado",
          nome: a.paciente,
        }));
        setEmissions(attestations);
      }
    } catch { toast.error("Erro ao carregar emissões"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "pricing") loadPricing();
    if (tab === "notices") loadNotices();
    if (tab === "logs") loadLogs();
    if (tab === "emissions") loadEmissions();
  }, [tab]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const adjustBalance = async (userId: number, delta: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Saldo atualizado!");
        loadUsers();
        setBalanceInputs(prev => ({ ...prev, [userId]: "" }));
      } else {
        toast.error(data.error || "Erro ao atualizar saldo");
      }
    } catch { toast.error("Erro de conexão"); }
  };

  const toggleUserActive = async (userId: number, current: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(current ? "Usuário desativado" : "Usuário ativado");
        loadUsers();
      }
    } catch { toast.error("Erro de conexão"); }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${username}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Usuário excluído!");
        loadUsers();
      }
    } catch { toast.error("Erro de conexão"); }
  };

  const openUserDetail = async (u: UserRow) => {
    setSelectedUser(u);
    setUserDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/history`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setUserHistory(data.history || []);
    } catch { setUserHistory([]); }
  };

  // ── Pricing ────────────────────────────────────────────────────────────────
  const savePrice = async (docType: string) => {
    const priceReais = parseFloat(editingPrice[docType] || "0");
    if (isNaN(priceReais) || priceReais < 0) { toast.error("Preço inválido"); return; }
    const price = Math.round(priceReais * 100); // Converter reais para centavos
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ document_type: docType, price }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Preço atualizado!");
        loadPricing();
      } else {
        toast.error(data.error || "Erro ao salvar preço");
      }
    } catch { toast.error("Erro de conexão"); }
  };

  const initDefaultPricing = async () => {
    const defaults = [
      { document_type: "atestado", display_name: "Atestado Médico", price: 500 },
      { document_type: "cnh", display_name: "CNH Digital", price: 800 },
      { document_type: "cha", display_name: "CHA Náutica", price: 600 },
      { document_type: "toxicologico", display_name: "Toxicológico", price: 700 },
      { document_type: "historico-sp", display_name: "Histórico SP", price: 600 },
      { document_type: "historico-uninter", display_name: "Histórico UNINTER", price: 600 },
    ];
    try {
      for (const item of defaults) {
        await fetch("/api/admin/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(item),
        });
      }
      toast.success("Preços padrão configurados!");
      loadPricing();
    } catch { toast.error("Erro ao configurar preços"); }
  };

  // ── Notices ────────────────────────────────────────────────────────────────
  const createNotice = async () => {
    if (!newNotice.title || !newNotice.message) {
      toast.error("Preencha título e mensagem");
      return;
    }
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newNotice),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Aviso criado!");
        setNewNotice({ title: "", message: "", type: "info", is_active: 1 });
        loadNotices();
      }
    } catch { toast.error("Erro de conexão"); }
  };

  const toggleNotice = async (id: number, current: number) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(current ? "Aviso desativado" : "Aviso ativado");
        loadNotices();
      }
    } catch { toast.error("Erro de conexão"); }
  };

  const deleteNotice = async (id: number) => {
    if (!confirm("Excluir este aviso?")) return;
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Aviso excluído!");
        loadNotices();
      }
    } catch { toast.error("Erro de conexão"); }
  };

  // ── Database ───────────────────────────────────────────────────────────────
  const deleteUserData = async () => {
    if (!deleteTargetUserId) return;
    if (deleteUserConfirm !== deleteTargetUsername) {
      toast.error("Nome de usuário não confere. Digite exatamente o nome para confirmar.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${deleteTargetUserId}/delete-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Dados do usuário excluídos!");
        setDeleteTargetUserId(null);
        setDeleteTargetUsername("");
        setDeleteUserConfirm("");
        loadUsers();
      } else {
        toast.error(data.error || "Erro ao excluir dados");
      }
    } catch { toast.error("Erro de conexão"); }
  };
  const deleteAllData = async () => {
    if (deleteConfirm !== "EXCLUIR TUDO") {
      toast.error('Digite "EXCLUIR TUDO" para confirmar');
      return;
    }
    try {
      const res = await fetch("/api/admin/delete-all-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: true, confirmation_text: "EXCLUIR TUDO" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Todos os dados excluídos!");
        setDeleteConfirm("");
      } else {
        toast.error(data.error || "Erro ao excluir dados");
      }
    } catch { toast.error("Erro de conexão"); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleString("pt-BR"); } catch { return d; }
  };

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    !logFilter ||
    (l.username || "").toLowerCase().includes(logFilter.toLowerCase()) ||
    l.action.toLowerCase().includes(logFilter.toLowerCase())
  );

  const filteredEmissions = emissions.filter(e =>
    !emissionsFilter ||
    (e.nome || e.paciente || "").toLowerCase().includes(emissionsFilter.toLowerCase()) ||
    (e.username || "").toLowerCase().includes(emissionsFilter.toLowerCase()) ||
    (e.codigo_qr || "").toLowerCase().includes(emissionsFilter.toLowerCase())
  );

  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const activeUsers = users.filter(u => u.is_active).length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Controle total do sistema DocMaster</p>
          </div>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{activeUsers}/{users.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Saldo Total</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                R$ {(totalBalance / 100).toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.key
                    ? "bg-yellow-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button onClick={loadUsers} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center overflow-hidden border-2 border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                          {u.profile_photo ? (
                            <img src={u.profile_photo} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                              {u.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{u.username}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              u.role === "admin"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            }`}>
                              {u.role === "admin" ? "Admin" : "Usuário"}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              u.is_active
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                            }`}>
                              {u.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Cadastro: {formatDate(u.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          R$ {(u.balance / 100).toFixed(2).replace(".", ",")}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="R$"
                              value={balanceInputs[u.id] || ""}
                              onChange={e => setBalanceInputs(prev => ({ ...prev, [u.id]: e.target.value }))}
                              className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            />
                            <button
                              onClick={() => {
                                const val = parseFloat(balanceInputs[u.id] || "0");
                                if (val > 0) adjustBalance(u.id, Math.round(val * 100));
                              }}
                              className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
                              title="Adicionar saldo"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const val = parseFloat(balanceInputs[u.id] || "0");
                                if (val > 0) adjustBalance(u.id, -Math.round(val * 100));
                              }}
                              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-200 transition-colors"
                              title="Remover saldo"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => openUserDetail(u)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Ver histórico"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserActive(u.id, u.is_active)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title={u.is_active ? "Desativar" : "Ativar"}
                          >
                            {u.is_active
                              ? <ToggleRight className="w-4 h-4 text-green-500" />
                              : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetUserId(u.id);
                              setDeleteTargetUsername(u.username);
                              setTab("database");
                            }}
                            className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                            title="Excluir dados do usuário"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.username)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRICING TAB ── */}
        {tab === "pricing" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Preços por Documento</h2>
              {pricing.length === 0 && (
                <button
                  onClick={initDefaultPricing}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Configurar Preços Padrão
                </button>
              )}
            </div>
            {pricing.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nenhum preço configurado.</p>
                <button
                  onClick={initDefaultPricing}
                  className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Configurar Preços Padrão
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pricing.map(p => (
                  <div key={p.document_type} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{p.display_name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{p.document_type}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPrice[p.document_type] || ""}
                        onChange={e => setEditingPrice(prev => ({ ...prev, [p.document_type]: e.target.value }))}
                        className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button
                        onClick={() => savePrice(p.document_type)}
                        className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 transition-colors"
                        title="Salvar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTICES TAB ── */}
        {tab === "notices" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Criar Novo Aviso</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
                  <div className="flex gap-2 flex-wrap">
                    {NOTICE_TYPES.map(nt => (
                      <button
                        key={nt.value}
                        onClick={() => setNewNotice(n => ({ ...n, type: nt.value as any }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          newNotice.type === nt.value
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        <nt.icon className="w-3.5 h-3.5" />
                        {nt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título</label>
                  <input
                    type="text"
                    value={newNotice.title}
                    onChange={e => setNewNotice(n => ({ ...n, title: e.target.value }))}
                    placeholder="Título do aviso"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mensagem</label>
                  <textarea
                    value={newNotice.message}
                    onChange={e => setNewNotice(n => ({ ...n, message: e.target.value }))}
                    placeholder="Mensagem do aviso"
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  />
                </div>
                <button
                  onClick={createNotice}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Publicar Aviso
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Avisos Publicados</h3>
              {notices.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhum aviso publicado</div>
              ) : (
                <div className="space-y-2">
                  {notices.map(n => (
                    <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border ${
                      n.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
                      n.type === "error" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" :
                      n.type === "success" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" :
                      "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    } ${!n.is_active ? "opacity-50" : ""}`}>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at || "")}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          n.is_active
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        }`}>
                          {n.is_active ? "Ativo" : "Inativo"}
                        </span>
                        <button
                          onClick={() => n.id && toggleNotice(n.id, n.is_active)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          {n.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => n.id && deleteNotice(n.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab === "logs" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar logs..."
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button onClick={loadLogs} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ação</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(l.created_at)}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{l.username || `#${l.user_id}` || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                            l.action.includes("delete") || l.action.includes("exclu")
                              ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              : l.action.includes("emit") || l.action.includes("create")
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : l.action.includes("login")
                              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">{l.details || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EMISSIONS TAB ── */}
        {tab === "emissions" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar por paciente, usuário ou código..."
                  value={emissionsFilter}
                  onChange={e => setEmissionsFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button onClick={loadEmissions} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">{filteredEmissions.length} emissões</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredEmissions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhuma emissão encontrada</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Código QR</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredEmissions.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(e.created_at)}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{e.username || e.user_id || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{e.nome || e.paciente || "—"}</td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                            {e.type || "atestado"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 font-mono hidden md:table-cell">{e.codigo_qr || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            e.status === "emitido"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          }`}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DATABASE TAB ── */}
        {tab === "database" && (
          <div className="space-y-6">
            {/* Delete specific user data */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Excluir Dados de Usuário Específico</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Exclui todos os documentos emitidos por um usuário específico. O usuário em si não será excluído.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Selecionar Usuário</label>
                  <select
                    value={deleteTargetUserId || ""}
                    onChange={e => {
                      const uid = parseInt(e.target.value);
                      setDeleteTargetUserId(uid || null);
                      const u = users.find(u => u.id === uid);
                      setDeleteTargetUsername(u?.username || "");
                      setDeleteUserConfirm("");
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Selecione um usuário...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                </div>
                {deleteTargetUserId && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Confirme digitando o nome do usuário: <strong className="text-orange-600">{deleteTargetUsername}</strong>
                      </label>
                      <input
                        type="text"
                        value={deleteUserConfirm}
                        onChange={e => setDeleteUserConfirm(e.target.value)}
                        placeholder={`Digite "${deleteTargetUsername}" para confirmar`}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <button
                      onClick={deleteUserData}
                      disabled={deleteUserConfirm !== deleteTargetUsername}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      Excluir Dados do Usuário
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Delete ALL data */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Excluir TODOS os Dados</h3>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 mb-4">
                <p className="text-xs text-red-700 dark:text-red-400 font-semibold">
                  ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os documentos emitidos de todos os usuários serão permanentemente excluídos.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Digite <strong className="text-red-600">EXCLUIR TUDO</strong> para confirmar
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder='Digite "EXCLUIR TUDO"'
                    className="w-full px-3 py-2 text-sm rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <button
                  onClick={deleteAllData}
                  disabled={deleteConfirm !== "EXCLUIR TUDO"}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Excluir TODOS os Dados
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div className="space-y-6">
            {/* Configurações Gerais */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Configurações Gerais</h3>
              <div className="space-y-4">
                {[
                  { key: "site_name", label: "Nome do Site", placeholder: "DocMaster" },
                  { key: "support_whatsapp", label: "WhatsApp de Suporte", placeholder: "5511999999999" },
                  { key: "max_documents_per_day", label: "Máx. Documentos por Dia", placeholder: "100" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                    <input
                      type="text"
                      value={settings[key as keyof typeof settings] as string}
                      onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo Manutenção</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bloqueia acesso de usuários não-admin</p>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenance_mode ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                <button
                  onClick={() => toast.success("Configurações salvas!")}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>

            {/* Upload de Logo */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Logo do Painel</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Faça upload de uma nova logo para o painel. A imagem será usada na sidebar e na página de login.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                  <img src="/assets/logo-icon.png" alt="Logo atual" className="w-16 h-16 object-contain" />
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Save className="w-4 h-4" />
                    Escolher Arquivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.info(`Logo "${file.name}" selecionada. Funcionalidade de upload será implementada com R2 Storage.`);
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-2">PNG, JPG ou WebP. Máximo 2MB.</p>
                </div>
              </div>
            </div>

            {/* Exclusão Automática por Tipo de Documento */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Exclusão Automática de Documentos</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Configure o período de retenção (em dias) para cada tipo de documento. Após esse período, os documentos serão excluídos automaticamente.
              </p>
              <div className="space-y-3">
                {[
                  { key: "auto_delete_atestado", label: "Atestados", defaultVal: "60" },
                  { key: "auto_delete_receita", label: "Receitas (Dr. Consulta)", defaultVal: "60" },
                  { key: "auto_delete_cnh", label: "CNH Digital", defaultVal: "365" },
                  { key: "auto_delete_cha", label: "CHA Náutica", defaultVal: "60" },
                  { key: "auto_delete_toxicologico", label: "Toxicológico", defaultVal: "60" },
                  { key: "auto_delete_historico", label: "Históricos Escolares", defaultVal: "90" },
                ].map(({ key, label, defaultVal }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 w-48 flex-shrink-0">{label}</label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={(settings as any)[key] || defaultVal}
                      onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                      className="w-24 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                    />
                    <span className="text-xs text-gray-400">dias</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.success("Configurações de exclusão automática salvas!")}
                className="w-full mt-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Salvar Configurações de Exclusão
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {userDetailOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser.username}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>
              <button onClick={() => setUserDetailOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Saldo</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    R$ {(selectedUser.balance / 100).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`text-sm font-bold ${selectedUser.is_active ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    {selectedUser.is_active ? "Ativo" : "Inativo"}
                  </p>
                </div>
              </div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Histórico de Emissões</h4>
              {userHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma emissão registrada</p>
              ) : (
                <div className="space-y-2">
                  {userHistory.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{h.paciente || h.nome || "—"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{h.type || "atestado"} · {formatDate(h.created_at)}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold">
                        {h.status || "emitido"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
