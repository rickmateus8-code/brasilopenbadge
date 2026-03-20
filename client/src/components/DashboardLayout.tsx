import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, FileText, CreditCard, Receipt, LogOut,
  ChevronDown, ChevronRight, Menu, X, Sun, Moon,
  Shield, GraduationCap, Car, Anchor, FlaskConical,
  MessageCircle, User
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

function SidebarItem({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = item.path ? location === item.path : item.children?.some(c => location === c.path);
  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
            ${isActive
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="ml-7 mt-1 space-y-1">
            {item.children.map(child => (
              <button
                key={child.path}
                onClick={() => setLocation(child.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                  ${location === child.path
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
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
      onClick={() => item.path && setLocation(item.path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${isActive
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const adminItems: MenuItem[] = isAdmin
    ? [{ icon: Shield, label: "Admin", path: "/admin" }]
    : [];

  const allItems = [...menuItems, ...adminItems];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "w-72" : collapsed ? "w-16" : "w-64"} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        {(!collapsed || mobile) && (
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">DocMaster</span>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allItems.map(item => (
          <SidebarItem key={item.label} item={item} collapsed={!mobile && collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {/* Saldo */}
        {(!collapsed || mobile) && (
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo Disponível</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              R$ {(user.balance / 100).toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}

        {/* User info */}
        <div className={`flex items-center gap-2 px-2 py-1.5 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {user.displayName || user.username}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 capitalize">{user.role}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`flex gap-1 ${collapsed && !mobile ? "flex-col items-center" : ""}`}>
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {(!collapsed || mobile) && <span>{theme === "dark" ? "Claro" : "Escuro"}</span>}
          </button>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-gray-600 dark:text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">DocMaster</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              R$ {(user.balance / 100).toFixed(2).replace(".", ",")}
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        title="Falar no WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>
    </div>
  );
}
