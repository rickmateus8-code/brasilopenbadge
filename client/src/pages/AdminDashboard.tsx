import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import AttestationDocument from "@/components/AttestationDocument";
import { toast } from "sonner";
import {
  Users, Settings, Plus, Minus, Shield,
  RefreshCw, DollarSign, Trash2, ToggleLeft, ToggleRight,
  Bell, AlertTriangle, CheckCircle, Info, FileText,
  Activity, Database, Search, Eye, EyeOff, X, Save, Layout,
  Download, Pencil, Wifi, WifiOff, Monitor, Globe,
  CreditCard, AlertCircle, Filter, Gift, Percent, Wallet,
  Link, Copy, Calendar, Trash, Lock, UserPlus, Clock, MinusCircle
} from "lucide-react";

type Tab = "users" | "pricing" | "notices" | "logs" | "emissions" | "monitoring" | "referral" | "settings" | "models";

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
  table_source?: string;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  is_active: number;
  created_at: string;
  profile_photo?: string;
  cashback_percentage?: number | null;
  referral_percentage?: number | null;
  free_documents?: string[];
  permissions?: any;
}

interface PricingRow {
  document_type: string;
  display_name: string;
  price: number;
  is_active?: boolean;
}

interface LogRow {
  id: string;
  user_id?: string;
  username?: string;
  action: string;
  category?: string;
  severity?: string;
  details?: string;
  target_type?: string;
  target_id?: string;
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

interface PresenceRow {
  user_id: string;
  username: string;
  email?: string;
  role?: string;
  balance?: number;
  profile_photo?: string;
  current_page: string;
  current_action: string;
  last_seen: string;
  is_online: number;
  first_seen?: string;
  timeline?: any[];
  page_totals?: any[];
  total_session_seconds?: number;
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "users", label: "Usuários", icon: Users },
  { key: "monitoring", label: "Monitoramento", icon: Monitor },
  { key: "pricing", label: "Preços", icon: DollarSign },
  { key: "models", label: "Modelos", icon: Layout },
  { key: "notices", label: "Avisos", icon: Bell },
  { key: "logs", label: "Logs", icon: Activity },
  { key: "emissions", label: "Emissões", icon: FileText },
  { key: "referral", label: "Indicações", icon: Gift },
  { key: "settings", label: "Configurações", icon: Settings },
];

const NOTICE_TYPES = [
  { value: "info", label: "Informação", icon: Info },
  { value: "warning", label: "Aviso", icon: AlertTriangle },
  { value: "error", label: "Urgente", icon: AlertTriangle },
  { value: "success", label: "Sucesso", icon: CheckCircle },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  atestado: "Atestado",
  receita: "Receita",
  cnh: "CNH",
  cha: "CHA Náutica",
  toxicologico: "Toxicológico",
  toxicria: "Toxicológico Sodré",
  laudocria: "Laudo Sodré",
  "historico-sp": "Histórico SP",
  "historico-uninter": "Histórico UNINTER",
  "peticao-stj": "Petição STJ",
  "peticaocria": "Petição Jurídica",
  "diploma-uninter": "Diploma UNINTER",
};

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/atestado": "Emitindo Atestado",
  "/atestadocria": "Emitindo Atestado",
  "/cnh": "Emitindo CNH",
  "/cnhcria": "Emitindo CNH",
  "/cha": "Emitindo CHA",
  "/chacria": "Emitindo CHA",
  "/toxicologico": "Emitindo Toxicológico",
  "/toxicologicocria": "Emitindo Toxicológico",
  "/receita": "Emitindo Receita",
  "/receitacria": "Emitindo Receita",
  "/historico-sp": "Emitindo Histórico SP",
  "/historicocria": "Emitindo Histórico UNINTER",
  "/admin": "Painel Admin",
  "/configuracoes": "Configurações",
  "/extrato": "Extrato",
  "/recargas": "Recargas",
};

const LOG_CATEGORIES = [
  { value: "all", label: "Todos", icon: Activity },
  { value: "admin", label: "Admin", icon: Shield },
  { value: "payment", label: "Saldo", icon: CreditCard },
  { value: "error", label: "Erros", icon: AlertCircle },
  { value: "system", label: "Sistema", icon: Monitor },
];

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("users");

  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [balanceModalUser, setBalanceModalUser] = useState<UserRow | null>(null);
  const [balanceModalValue, setBalanceModalValue] = useState("");
  const [balanceModalType, setBalanceModalType] = useState<"credit" | "debit">("credit");
  const [savingBalance, setSavingBalance] = useState(false);
  const [aclSelectedUser, setAclSelectedUser] = useState<any>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>({ editaveis: [], ferramentas: [] });
  const [userFreeDocs, setUserFreeDocs] = useState<string[]>([]);

  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [newNotice, setNewNotice] = useState<NoticeRow>({
    title: "", message: "", type: "info", is_active: 1
  });

  // Models management
  const [emissionModels, setEmissionModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/admin/models", { credentials: "include" });
      const json = await res.json();
      if (json.success) setEmissionModels(json.models || []);
    } catch {
      toast.error("Erro ao carregar modelos.");
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (tab === "models") loadModels();
  }, [tab]);

  const handleUpdateModelImages = async (modelId: string, images: string[]) => {
    try {
      const res = await fetch("/api/admin/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: modelId, images }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Modelo atualizado!");
        loadModels();
      } else {
        toast.error(json.error || "Erro ao atualizar.");
      }
    } catch {
      toast.error("Erro na requisição.");
    }
  };

  const handleOpenPermissions = (user: any) => {
    setAclSelectedUser(user);
    setUserPermissions(user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : { editaveis: [], ferramentas: [] });
    setUserFreeDocs(user.free_documents || []);
    setShowPermissionsModal(true);
  };

  const savePermissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          user_id: aclSelectedUser.id, 
          permissions: userPermissions,
          free_documents: userFreeDocs 
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Acessos liberados com sucesso!");
        setUsers(prev => prev.map(u => u.id === aclSelectedUser.id ? { 
          ...u, 
          permissions: userPermissions,
          free_documents: userFreeDocs
        } : u));
        setShowPermissionsModal(false);
      } else {
        toast.error(data.error || "Erro ao salvar permissões.");
      }
    } catch (err: any) {
      toast.error(`Falha ao salvar: ${err.message || "Erro de conexão"}`);
    } finally {
      setLoading(false);
    }
  };

  const selectAllDocs = (selected: boolean) => {
    const all = ["atestado", "cnh", "cha", "toxicologico", "toxicria", "laudocria", "receita", "historico-sp", "historicocria", "diploma-uninter", "peticaocria"];
    setUserPermissions({ ...userPermissions, editaveis: selected ? all : [] });
  };

  const selectAllTools = (selected: boolean) => {
    const all = ["bot-adv", "peticao-stj"];
    setUserPermissions({ ...userPermissions, ferramentas: selected ? all : [] });
  };

  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
  const [editingDisplayName, setEditingDisplayName] = useState<Record<string, string>>({});
  const [editingIsActive, setEditingIsActive] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logFilter, setLogFilter] = useState("");
  const [logCategory, setLogCategory] = useState("all");
  const [logCategories, setLogCategories] = useState<Record<string, number>>({});
  const [emissions, setEmissions] = useState<EmissionRow[]>([]);
  const [emissionsFilter, setEmissionsFilter] = useState("");
  const [emissionsTypeFilter, setEmissionsTypeFilter] = useState("all");
  const [emissionsDateFrom, setEmissionsDateFrom] = useState("");
  const [emissionsDateTo, setEmissionsDateTo] = useState("");
  const [presence, setPresence] = useState<PresenceRow[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [totalTracked, setTotalTracked] = useState(0);
  const [referralData, setReferralData] = useState<any>({});
  const [referralTab, setReferralTab] = useState<any>("overview");
  const [referralSettings, setReferralSettings] = useState<any>({ referral_percentage: 10, cashback_percentage: 5 });
  const [gatewayFinancial, setGatewayFinancial] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [confirmModal, setConfirmModal] = useState<any>({ open: false });

  // Data Loaders
  const loadUsers = useCallback(async (withPasswords = false, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = withPasswords ? "/api/admin/users?show_passwords=1" : "/api/admin/users";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch { toast.error("Erro ao carregar usuários."); }
    finally { if (!silent) setLoading(false); }
  }, []);

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPricing(data.pricing || []);
        const ep: any = {}; const edn: any = {}; const eia: any = {};
        data.pricing.forEach((p: any) => {
          ep[p.document_type] = (p.price / 100).toFixed(2);
          edn[p.document_type] = p.display_name;
          eia[p.document_type] = p.is_active !== false;
        });
        setEditingPrice(ep); setEditingDisplayName(edn); setEditingIsActive(eia);
      }
    } catch {}
  }, []);

  const loadFinancial = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/financial", { credentials: "include" });
      const data = await res.json();
      if (data.success) setGatewayFinancial(data.data);
    } catch {}
  }, []);

  const loadPresence = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/presence", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPresence(data.presence || []);
        setOnlineCount(data.online_count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers(showPasswords);
    if (tab === "pricing") loadPricing();
    if (tab === "models") loadModels();
    loadFinancial();
  }, [tab, showPasswords, loadUsers, loadPricing, loadFinancial]);

  if (!isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-7 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-5 mb-8 animate-in fade-in duration-700">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 shadow-xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
            <img src="/assets/logo-elite-dm.png" alt="DM Elite" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Painel Admin</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Gestão de Operações — <span className="text-red-600 font-bold tracking-tighter">DOCMASTER ELITE</span></p>
          </div>
          <div className="ml-auto flex items-center gap-4 flex-wrap">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 shadow-sm min-w-[120px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuários</p>
              <p className="text-xl font-black text-red-600 dark:text-red-500 mt-1">{users.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 shadow-sm min-w-[140px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Total</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-500 mt-1">R$ {(totalBalance / 100).toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 no-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive ? "bg-red-600 text-white shadow-lg" : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"}`}>
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
             {users.map(u => (
               <div key={u.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                       <User size={24} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{u.username}</p>
                      <p className="text-[10px] text-gray-400 font-mono">#{u.id.slice(0,8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo</p>
                      <p className="text-lg font-black text-emerald-600">R$ {(u.balance / 100).toFixed(2)}</p>
                    </div>
                    <button onClick={() => handleOpenPermissions(u)} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-500 transition-all border-none cursor-pointer"><Shield size={20} /></button>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* ── MODELS TAB ── */}
        {tab === "models" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight m-0">Gerenciar Modelos</h2>
                <p className="text-sm text-gray-500 font-medium">Imagens de layout exibidas aos usuários no Dashboard.</p>
              </div>
              <button onClick={loadModels} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-500 transition-all border-none cursor-pointer">
                <RefreshCw size={20} className={loadingModels ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emissionModels.map((model) => (
                <div key={model.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                         <Layout size={20} />
                       </div>
                       <span className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">{model.doc_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const images = typeof model.images === 'string' ? JSON.parse(model.images || "[]") : (model.images || []);
                        return images.map((img: string, idx: number) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5">
                            <img src={img} className="w-full h-full object-cover" alt="Preview" />
                            <button 
                              onClick={() => {
                                handleUpdateModelImages(model.id, images.filter((_: any, i: number) => i !== idx));
                              }}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border-none cursor-pointer hover:scale-110 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ));
                      })()}
                      
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-all">
                          <Plus size={20} className="text-gray-400" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adicionar</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = reader.result as string;
                                const images = typeof model.images === 'string' ? JSON.parse(model.images || "[]") : (model.images || []);
                                handleUpdateModelImages(model.id, [...images, base64]);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && aclSelectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-indigo-100 dark:border-indigo-900 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-sm">Permissões: {aclSelectedUser.username}</h3>
              <button onClick={() => setShowPermissionsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border-none bg-transparent cursor-pointer"><X size={20} /></button>
            </div>
            <div className="space-y-6">
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["atestado", "cnh", "cha", "toxicologico", "toxicria", "laudocria", "receita", "historico-sp", "historicocria", "diploma-uninter", "peticaocria"].map(doc => (
                    <label key={doc} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-indigo-300">
                      <input type="checkbox" checked={userPermissions.editaveis.includes(doc)} onChange={() => {}} className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase truncate">{DOC_TYPE_LABELS[doc] || doc}</span>
                    </label>
                  ))}
               </div>
               <button onClick={savePermissions} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 border-none cursor-pointer">SALVAR ACESSOS</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
