import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import NovoDocumentoModal from "@/components/NovoDocumentoModal";
import {
  LayoutDashboard, FileText, CreditCard, Receipt, LogOut,
  ChevronDown, ChevronRight, Menu, X, Sun, Moon,
  Shield, GraduationCap, Car, Anchor, FlaskConical,
  User, Wallet, Settings, HelpCircle, Plus, Bell, Pill, Gift, FilePlus
} from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string; isCreation?: boolean }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },

  {
    icon: FileText, label: "Atestado",
    children: [
      { label: "Novo Atestado", path: "/atestadocria", isCreation: true },
      { label: "Atestados Salvos", path: "/atestadosalvos" },
    ],
  },
  {
    icon: Car, label: "CNH Digital",
    children: [
      { label: "Criar CNH", path: "/cnhcria", isCreation: true },
      { label: "CNHs Salvas", path: "/cnhsalvas" },
    ],
  },
  {
    icon: Anchor, label: "CHA Náutica",
    children: [
      { label: "Nova CHA", path: "/chacria", isCreation: true },
      { label: "CHAs Salvas", path: "/chasalvas" },
    ],
  },

  {
    icon: GraduationCap, label: "Histórico Escolar",
    children: [
      { label: "Histórico SP", path: "/historico-sp", isCreation: true },
      { label: "Históricos SP Salvos", path: "/historico-sp-salvos" },
      { label: "Histórico UNINTER", path: "/historico-uninter", isCreation: true },
      { label: "Históricos UNINTER Salvos", path: "/historico-uninter-salvos" },
    ],
  },
  {
    icon: Pill, label: "Receituário",
    children: [
      { label: "Dr. Consulta", path: "/receitacria", isCreation: true },
      { label: "Receitas Salvas", path: "/receitassalvas" },
    ],
  },
];

function SidebarItem({
  item,
  collapsed,
  onNavigate,
  userBalance = 0,
  onInsufficientBalance,
}: {
  item: MenuItem;
  collapsed: boolean;
  onNavigate?: () => void;
  userBalance?: number;
  onInsufficientBalance?: () => void;
}) {
  const [location, setLocation] = useLocation();
  const isChildActive = item.children?.some(c => location === c.path) ?? false;
  const [open, setOpen] = useState(isChildActive);
  const isActive = item.path
    ? location === item.path
    : isChildActive;
  const Icon = item.icon;

  // Sincronizar estado open quando a rota muda (corrige bug de piscar)
  useEffect(() => {
    if (item.children) {
      const active = item.children.some(c => location === c.path);
      if (active) setOpen(true);
    }
  }, [location, item.children]);

  const navigate = useCallback((path: string, isCreation?: boolean) => {
    // Bloquear navegação para criação se saldo zerado
    if (isCreation && userBalance <= 0) {
      onInsufficientBalance?.();
      return;
    }
    setLocation(path);
    onNavigate?.();
  }, [setLocation, onNavigate, userBalance, onInsufficientBalance]);

  // Toggle manual — só alterna se não há filho ativo (evita fechar menu ativo)
  const handleToggle = useCallback(() => {
    setOpen(o => !o);
  }, []);

  if (item.children) {
    return (
      <div>
        <button
          onClick={handleToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
            ${isActive
              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open
                ? <ChevronDown className="w-3 h-3 opacity-60" />
                : <ChevronRight className="w-3 h-3 opacity-60" />}
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="ml-7 mt-1 space-y-0.5">
            {item.children.map(child => (
              <button
                key={child.path}
                onClick={() => navigate(child.path, child.isCreation)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                  ${location === child.path
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                    : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
              >
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => item.path && navigate(item.path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${isActive
          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

function UserDropdown({ user, logout, collapsed }: { user: AuthUser; logout: () => void; collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const avatarSrc = user.profilePhoto;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-red-300 dark:border-red-700">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user.displayName || user.username}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                {user.role === "admin" ? "Administrador" : "Usuário"}
              </p>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden min-w-[200px]">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{user.displayName || user.username}</p>
            <p className="text-[10px] text-gray-500">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setLocation("/configuracoes"); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button
              onClick={() => { setLocation("/indicacoes"); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Indicações
            </button>
            <button
              onClick={() => { setLocation("/extrato"); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              Extrato
            </button>
            <button
              onClick={() => { setLocation("/recargas"); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Recarregar Saldo
            </button>
            <a
              href="https://wa.me/5511965355468?text=Preciso+de+suporte"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Ajuda / Suporte
            </a>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  useHeartbeat();
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNovoDocModal, setShowNovoDocModal] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const adminItems: MenuItem[] = isAdmin
    ? [{ icon: Shield, label: "Admin", path: "/admin" }]
    : [];

  const allItems = [...menuItems, ...adminItems];
  // Garantir que balance nunca seja NaN — D1 pode retornar null/string
  const safeBalance = typeof user.balance === 'number' ? user.balance : (parseFloat(String(user.balance ?? '0')) || 0);
  const balanceFormatted = `R$ ${(safeBalance / 100).toFixed(2).replace('.', ',')}`;
  // Expor balance seguro para os componentes filhos
  const userBalanceSafe = safeBalance;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`flex flex-col h-full ${mobile ? "w-72" : collapsed ? "w-18" : "w-64"} 
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200`}
    >
      {/* Header com Logo */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800 min-h-[64px]">
        {(!collapsed || mobile) && (
          <div className="flex items-center cursor-pointer" onClick={() => setLocation("/dashboard")} title="Ir para Dashboard">
            <img
              src="/assets/logo-text.webp"
              alt="DocMaster"
              className="h-9 w-auto object-contain"
              draggable={false}
            />
          </div>
        )}
        {collapsed && !mobile && (
          <div className="flex items-center justify-center w-full cursor-pointer" onClick={() => setLocation("/dashboard")} title="Ir para Dashboard">
            <img
              src="/assets/logo-icon.png"
              alt="DM"
              className="h-9 w-9 object-contain"
              draggable={false}
            />
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4 rotate-90" />}
          </button>
        )}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Botão + NOVO DOCUMENTO — destaque no topo da nav */}
      <div className={`px-2 pt-3 pb-1 ${collapsed && !mobile ? "flex justify-center" : ""}`}>
        <button
          onClick={() => { setShowNovoDocModal(true); if (mobile) setMobileOpen(false); }}
          className={`
            flex items-center gap-2 rounded-xl font-bold text-sm transition-all shadow-sm
            bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
            text-white active:scale-95
            ${collapsed && !mobile
              ? "w-10 h-10 justify-center p-0"
              : "w-full px-4 py-2.5 justify-center"
            }
          `}
          title="Novo Documento"
        >
          <FilePlus className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>+ Novo Documento</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {allItems.map(item => (
          <SidebarItem
            key={item.label}
            item={item}
            collapsed={!mobile && collapsed}
            onNavigate={mobile ? () => setMobileOpen(false) : undefined}
            userBalance={userBalanceSafe}
            onInsufficientBalance={() => {
              if (mobile) setMobileOpen(false);
              setShowInsufficientBalance(true);
            }}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {/* Saldo com botão + */}
        {(!collapsed || mobile) && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">Saldo</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {balanceFormatted}
              </p>
            </div>
            <button
              onClick={() => setLocation("/recargas")}
              className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm"
              title="Adicionar saldo"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* User dropdown */}
        <UserDropdown user={user} logout={logout} collapsed={!mobile && collapsed} />
        {/* Theme toggle */}
        <div className={`flex gap-1 ${collapsed && !mobile ? "flex-col items-center" : ""}`}>
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5" />
              : <Moon className="w-3.5 h-3.5" />}
            {(!collapsed || mobile) && (
              <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 shadow-2xl">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/assets/logo-text.webp"
            alt="DocMaster"
            className="h-7 w-auto object-contain"
            draggable={false}
          />
          <div className="flex items-center gap-2">
            {/* Botão + Novo Documento no mobile header */}
            <button
              onClick={() => setShowNovoDocModal(true)}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
              title="Novo Documento"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Novo</span>
            </button>
            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
              <Wallet className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {balanceFormatted}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center overflow-hidden border-2 border-red-300 dark:border-red-700">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/5511965355468?text=Venho%20de%20https%3A%2F%2Fdocmaster.store.%20Voc%C3%AA%20poderia%20me%20ajudar%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 active:scale-95 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        title="Suporte via WhatsApp"
        aria-label="Contato WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Modal Novo Documento — disponível em qualquer página */}
      <NovoDocumentoModal
        open={showNovoDocModal}
        onClose={() => setShowNovoDocModal(false)}
        userBalance={userBalanceSafe}
        username={user.username}
      />

      {/* Modal Saldo Insuficiente — acionado pelo submenu */}
      {showInsufficientBalance && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowInsufficientBalance(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 20, padding: "36px 32px",
              maxWidth: 380, width: "100%", textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              border: "3px solid #f97316", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px",
            }}>
              <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
              Saldo Insuficiente
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
              Você não possui saldo suficiente para criar um novo documento.
              Recarregue seu saldo para continuar.
            </p>
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
              padding: "10px 16px", marginBottom: 24, display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Wallet style={{ width: 16, height: 16, color: "#dc2626" }} />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
                Saldo atual: R$ {(userBalanceSafe / 100).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setShowInsufficientBalance(false); setLocation("/recargas"); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#16a34a", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                Recarregar Agora
              </button>
              <button
                onClick={() => setShowInsufficientBalance(false)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#6b7280", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
