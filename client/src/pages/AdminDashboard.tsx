import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  Users, CreditCard, Settings, Plus, Minus, Shield,
  RefreshCw, DollarSign, Trash2, ToggleLeft, ToggleRight,
  ClipboardList, Bell, Percent
} from "lucide-react";

type Tab = "users" | "pricing" | "notices" | "settings";

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  balance: number;
  is_active: number;
  created_at: string;
}

interface PricingRow {
  document_type: string;
  display_name: string;
  price: number;
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "users", label: "Usuários", icon: Users },
  { key: "pricing", label: "Preços", icon: DollarSign },
  { key: "notices", label: "Avisos", icon: Bell },
  { key: "settings", label: "Configurações", icon: Settings },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceInputs, setBalanceInputs] = useState<Record<number, string>>({});

  if (!isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch { toast.error("Erro ao carregar usuários"); }
    finally { setLoading(false); }
  };

  const loadPricing = async () => {
    try {
      const res = await fetch("/api/admin/pricing", { credentials: "include" });
      const data = await res.json();
      if (data.success) setPricing(data.pricing || []);
    } catch { toast.error("Erro ao carregar preços"); }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "pricing") loadPricing();
  }, [tab]);

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
        toast.success(`Saldo ajustado: ${delta > 0 ? "+" : ""}R$ ${(delta / 100).toFixed(2)}`);
        loadUsers();
      } else {
        toast.error(data.error || "Erro ao ajustar saldo");
      }
    } catch { toast.error("Erro ao ajustar saldo"); }
  };

  const toggleUserActive = async (userId: number, currentActive: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentActive ? "Usuário desativado" : "Usuário ativado");
        loadUsers();
      }
    } catch { toast.error("Erro ao alterar status"); }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Usuário excluído");
        loadUsers();
      }
    } catch { toast.error("Erro ao excluir usuário"); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciamento completo do DocMaster</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center
                ${tab === key
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Usuários ({users.length})
              </h2>
              <button onClick={loadUsers} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Carregando...</div>
            ) : (
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.username}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            u.role === "admin"
                              ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                              : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          }`}>
                            {u.role}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            u.is_active
                              ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          }`}>
                            {u.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{u.email || "—"}</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          Saldo: R$ {(u.balance / 100).toFixed(2).replace(".", ",")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Balance adjustment */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="R$"
                            value={balanceInputs[u.id] || ""}
                            onChange={e => setBalanceInputs(prev => ({ ...prev, [u.id]: e.target.value }))}
                            className="w-20 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              const val = parseFloat(balanceInputs[u.id] || "0");
                              if (val > 0) adjustBalance(u.id, Math.round(val * 100));
                            }}
                            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40"
                            title="Adicionar saldo"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const val = parseFloat(balanceInputs[u.id] || "0");
                              if (val > 0) adjustBalance(u.id, -Math.round(val * 100));
                            }}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40"
                            title="Remover saldo"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleUserActive(u.id, u.is_active)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={u.is_active ? "Desativar" : "Ativar"}
                        >
                          {u.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pricing Tab */}
        {tab === "pricing" && (
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Preços por Documento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pricing.map(p => (
                <div key={p.document_type} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{p.display_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.document_type}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    R$ {(p.price / 100).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
              {pricing.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400 text-sm">
                  Nenhum preço configurado. Configure via API.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notices Tab */}
        {tab === "notices" && (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Gestão de avisos em breve</p>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="text-center py-12 text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Configurações avançadas em breve</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
