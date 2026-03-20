import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText, Car, Anchor, FlaskConical, GraduationCap,
  CreditCard, ChevronRight, TrendingUp, BarChart3, Wallet
} from "lucide-react";

const quickActions = [
  { icon: FileText, label: "Criar Atestado", desc: "Novo atestado médico", path: "/atestadocria", color: "blue" },
  { icon: Car, label: "Criar CNH", desc: "Nova CNH digital", path: "/cnhcria", color: "amber" },
  { icon: Anchor, label: "Criar CHA", desc: "Nova CHA náutica", path: "/chacria", color: "cyan" },
  { icon: FlaskConical, label: "Toxicológico", desc: "Novo exame toxicológico", path: "/toxicologicocria", color: "purple" },
  { icon: GraduationCap, label: "Histórico SP", desc: "Histórico escolar SP", path: "/historico-sp", color: "green" },
  { icon: GraduationCap, label: "Histórico UNINTER", desc: "Histórico UNINTER", path: "/historico-uninter", color: "indigo" },
  { icon: CreditCard, label: "Recarregar", desc: "Adicionar créditos", path: "/recargas", color: "emerald" },
];

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-900/10",    text: "text-blue-600 dark:text-blue-400",    iconBg: "bg-blue-100 dark:bg-blue-900/30" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-900/10",  text: "text-amber-600 dark:text-amber-400",  iconBg: "bg-amber-100 dark:bg-amber-900/30" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-900/10",    text: "text-cyan-600 dark:text-cyan-400",    iconBg: "bg-cyan-100 dark:bg-cyan-900/30" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-900/10",text: "text-purple-600 dark:text-purple-400",iconBg: "bg-purple-100 dark:bg-purple-900/30" },
  green:   { bg: "bg-green-50 dark:bg-green-900/10",  text: "text-green-600 dark:text-green-400",  iconBg: "bg-green-100 dark:bg-green-900/30" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-900/10",text: "text-indigo-600 dark:text-indigo-400",iconBg: "bg-indigo-100 dark:bg-indigo-900/30" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10",text: "text-emerald-600 dark:text-emerald-400",iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-2xl font-bold">
            Olá, <span className="text-blue-100">{user?.displayName || user?.username}</span>! 👋
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            Bem-vindo ao maior e melhor painel da atualidade — <strong>DocMaster</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              Estatísticas
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: "Atestados Criados", value: "—", color: "blue" },
              { icon: Car, label: "CNHs Criadas", value: "—", color: "amber" },
              { icon: Anchor, label: "CHAs Criadas", value: "—", color: "cyan" },
              { icon: Wallet, label: "Saldo Disponível", value: `R$ ${((user?.balance || 0) / 100).toFixed(2).replace(".", ",")}`, color: "emerald" },
            ].map(({ icon: Icon, label, value, color }) => {
              const c = colorMap[color];
              return (
                <div key={label} className={`${c.bg} rounded-xl p-4 flex items-center gap-3`}>
                  <div className={`${c.iconBg} rounded-lg p-2.5 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
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

        {/* Quick Access */}
        <div>
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
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all group text-left"
                >
                  <div className={`${c.iconBg} rounded-lg p-2.5 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
