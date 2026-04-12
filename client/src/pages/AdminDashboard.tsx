import React, { useState, useEffect } from "react";
import { 
  Users, 
  Settings, 
  Database, 
  TrendingUp, 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  Shield, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ArrowRight,
  UserPlus,
  MessageCircle,
  Clock,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText
} from "lucide-react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  balance: number;
  is_active: boolean;
  created_at: string;
}

interface Presence {
  user_id: number;
  is_online: boolean;
  last_seen: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState<any>({});
  const [balanceInputs, setBalanceInputs] = useState<Record<number, string>>({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordRevealLogged, setPasswordRevealLogged] = useState(false);
  const [changePwUserId, setChangePwUserId] = useState<string | null>(null);
  const [changePwUsername, setChangePwUsername] = useState("");
  const [changePwValue, setChangePwValue] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "admin" | "system">("all");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, settingsRes, presenceRes, logsRes] = await Promise.all([
        apiClient.get("/api/admin/users"),
        apiClient.get("/api/admin/settings"),
        apiClient.get("/api/admin/presence"),
        apiClient.get("/api/admin/system-logs?limit=50")
      ]);
      
      if (usersRes.data) setUsers(usersRes.data);
      if (settingsRes.data?.settings) {
        // Backend returns { success: true, settings: { key: value, ... } }
        setSettings(settingsRes.data.settings);
      }
      if (presenceRes.data?.presence) setPresence(presenceRes.data.presence);
      if (logsRes.data?.logs) setSystemLogs(logsRes.data.logs);
    } catch (error) {
      console.error("Erro ao buscar dados do admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async (type: "all" | "admin" | "system") => {
    if (!confirm(`Tem certeza que deseja limpar os logs ${type === "all" ? "de todos os tipos" : type}? Esta ação é irreversível.`)) return;
    setIsClearingLogs(true);
    try {
      await apiClient.delete(`/api/admin/system-logs?clear=${type}`);
      setSystemLogs([]);
      alert("Logs limpos com sucesso!");
    } catch (error) {
      alert("Erro ao limpar logs");
    } finally {
      setIsClearingLogs(false);
    }
  };

  const adjustBalance = async (userId: number, amount: number) => {
    try {
      await apiClient.post(`/api/admin/users/${userId}/balance`, { amount });
      setBalanceInputs(prev => ({ ...prev, [userId]: "" }));
      fetchData();
    } catch (error) {
      alert("Erro ao ajustar saldo");
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/admin/users/${userId}`, { is_active: !currentStatus });
      fetchData();
    } catch (error) {
      alert("Erro ao alterar status do usuário");
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await apiClient.post("/api/admin/settings", { key, value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      alert("Erro ao atualizar configuração");
    }
  };

  const handleChangePassword = async () => {
    if (!changePwValue || changePwValue.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsChangingPw(true);
    try {
      await apiClient.post(`/api/admin/users/${changePwUserId}/password`, { password: changePwValue });
      alert("Senha alterada com sucesso!");
      setChangePwUserId(null);
      setChangePwValue("");
      fetchData();
    } catch (error) {
      alert("Erro ao alterar senha");
    } finally {
      setIsChangingPw(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-yellow-500" />
            Painel Administrativo
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Gestão global do sistema DocMaster</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de Usuários</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</h3>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Total</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            R$ {(users.reduce((acc, curr) => acc + curr.balance, 0) / 100).toFixed(2).replace(".", ",")}
          </h3>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Usuários Online</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {presence.filter(p => p.is_online).length}
          </h3>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <Database className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Versão API</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1.2.0</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              Usuários
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const next = !showPasswords;
                  setShowPasswords(next);
                  // Log de auditoria ao revelar senhas (apenas uma vez por sessão)
                  if (next && !passwordRevealLogged) {
                    setPasswordRevealLogged(true);
                    try {
                      await apiClient.post("/api/admin/system-logs", {
                        user_id: user?.id,
                        action: "REVEAL_PASSWORDS",
                        category: "security",
                        severity: "warning",
                        details: `Admin ${user?.username} visualizou as senhas dos usuários em ${new Date().toLocaleString('pt-BR')}`
                      });
                    } catch (_) { /* silently ignore log errors */ }
                  }
                }}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${
                  showPasswords 
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                }`}
                title={showPasswords ? "Ocultar Senhas" : "Mostrar Senhas"}
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPasswords ? "Ocultar" : "Senhas"}
              </button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all w-full md:w-64"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map(u => (
                <div key={u.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      u.role === "admin" 
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{u.username}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          u.is_active 
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
                            : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        }`}>
                          {u.is_active ? "Ativo" : "Inativo"}
                        </span>
                        {presence.find(p => String(p.user_id) === String(u.id) && p.is_online) && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      {showPasswords && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {(u as any).plain_password || <span className="italic opacity-60">senha não registrada</span>}
                          </p>
                          <button 
                            onClick={() => {
                              setChangePwUserId(String(u.id));
                              setChangePwUsername(u.username);
                              setChangePwValue("");
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Alterar Senha"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
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
                          className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"
                          title="Remover saldo"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => toggleUserStatus(u.id, u.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.is_active 
                            ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                            : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`}
                        title={u.is_active ? "Desativar" : "Ativar"}
                      >
                        {u.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-yellow-500" />
            Configurações
          </h2>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Suporte
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={settings.support_whatsapp || ""}
                    onChange={e => setSettings({...settings, support_whatsapp: e.target.value})}
                    placeholder="Ex: 5511999999999"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                  <button 
                    onClick={() => updateSetting("support_whatsapp", settings.support_whatsapp)}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl transition-colors text-sm"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Auto-Exclusão (Dias)
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "auto_delete_atestado", label: "Atestados" },
                    { key: "auto_delete_cnh", label: "CNH/CHA" },
                    { key: "auto_delete_toxicologico", label: "Toxicológico" },
                    { key: "auto_delete_historico", label: "Históricos" }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={settings[item.key] || "0"}
                          onChange={e => setSettings({...settings, [item.key]: e.target.value})}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center"
                        />
                        <button 
                          onClick={() => updateSetting(item.key, settings[item.key])}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-gray-400 leading-relaxed italic">
                  * Use "0" para desativar a exclusão automática.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
            <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Atenção Admin
            </h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-500/80 leading-relaxed">
              As alterações de saldo e status de usuário são imediatas. O suporte via WhatsApp é exibido para todos os usuários na página de recargas.
            </p>
          </div>
        </div>
      </div>

      {/* System Logs Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" />
            Logs do Sistema
            <span className="text-xs font-normal text-gray-400 ml-1">({systemLogs.length} registros)</span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={logFilter}
              onChange={e => setLogFilter(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="all">Todos</option>
              <option value="system">Sistema</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => handleClearLogs(logFilter)}
              disabled={isClearingLogs || systemLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isClearingLogs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Limpar Logs
            </button>
          </div>
        </div>
        {systemLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-600">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum log registrado</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {systemLogs.map((log: any, i: number) => (
              <div key={log.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  log.severity === 'error' ? 'bg-red-500' :
                  log.severity === 'warning' ? 'bg-yellow-500' :
                  log.severity === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{log.action || log.category || 'LOG'}</span>
                    {log.severity && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        log.severity === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        log.severity === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{log.severity}</span>
                    )}
                    <span className="text-[10px] text-gray-400 ml-auto">{log.created_at ? formatDate(log.created_at) : ''}</span>
                  </div>
                  {log.details && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{log.details}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {changePwUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Alterar Senha</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Usuário: <span className="font-bold text-purple-600">{changePwUsername}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova Senha</label>
                <input 
                  type="text"
                  value={changePwValue}
                  onChange={e => setChangePwValue(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setChangePwUserId(null)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleChangePassword}
                  disabled={isChangingPw}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isChangingPw ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
