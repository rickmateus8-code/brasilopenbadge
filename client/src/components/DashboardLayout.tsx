import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, FileText, CreditCard, Receipt, LogOut,
  ChevronDown, ChevronRight, Menu, X, Sun, Moon,
  Shield, GraduationCap, Car, Anchor, FlaskConical,
  MessageCircle, User, Wallet
} from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  {
    icon: FileText, label: "Atestados",
    children: [
      { label: "Novo Atestado", path: "/atestadocria" },
      { label: "Histórico", path: "/historico/atestados" },
    ],
  },
  {
    icon: Car, label: "CNH Digital",
    children: [
      { label: "Nova CNH", path: "/cnhcria" },
    ],
  },
  {
    icon: Anchor, label: "CHA Náutica",
    children: [
      { label: "Nova CHA", path: "/chacria" },
    ],
  },
  {
    icon: FlaskConical, label: "Toxicológico",
    children: [
      { label: "Novo Exame", path: "/toxicologicocria" },
    ],
  },
  {
    icon: GraduationCap, label: "Histórico Escolar",
    children: [
      { label: "Histórico SP", path: "/historico-sp" },
      { label: "Histórico UNINTER", path: "/historico-uninter" },
    ],
  },
  { icon: Receipt, label: "Extrato", path: "/extrato" },
  { icon: CreditCard, label: "Recargas", path: "/recargas" },
];

function SidebarItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: MenuItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(() =>
    item.children?.some(c => location === c.path) ?? false
  );
  const isActive = item.path
    ? location === item.path
    : item.children?.some(c => location === c.path);
  const Icon = item.icon;

  const navigate = (path: string) => {
    setLocation(path);
    onNavigate?.();
  };

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
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
                onClick={() => navigate(child.path)}
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fechar sidebar mobile ao redimensionar para desktop
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

  const balanceFormatted = `R$ ${(user.balance / 100).toFixed(2).replace(".", ",")}`;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`flex flex-col h-full ${mobile ? "w-72" : collapsed ? "w-16" : "w-60"} 
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200`}
    >
      {/* Header com Logo 02 */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800 min-h-[60px]">
        {(!collapsed || mobile) && (
          <div className="flex items-center">
            <img
              src="/assets/logo-text.webp"
              alt="DocMaster"
              className="h-8 w-auto object-contain"
              draggable={false}
            />
          </div>
        )}
        {collapsed && !mobile && (
          <div className="flex items-center justify-center w-full">
            <img
              src="/assets/logo-icon.png"
              alt="DM"
              className="h-8 w-8 object-contain"
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

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {allItems.map(item => (
          <SidebarItem
            key={item.label}
            item={item}
            collapsed={!mobile && collapsed}
            onNavigate={mobile ? () => setMobileOpen(false) : undefined}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {/* Saldo */}
        {(!collapsed || mobile) && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
            <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">Saldo</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {balanceFormatted}
            </p>
          </div>
        )}

        {/* User info */}
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user.displayName || user.username}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                {user.role === "admin" ? "Administrador" : "Usuário"}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
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
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
            {(!collapsed || mobile) && <span>Sair</span>}
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

          {/* Logo no header mobile */}
          <img
            src="/assets/logo-text.webp"
            alt="DocMaster"
            className="h-7 w-auto object-contain"
            draggable={false}
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
              <Wallet className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {balanceFormatted}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <User className="w-4 h-4 text-red-600 dark:text-red-400" />
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
        {/* Ícone WhatsApp SVG nativo */}
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
