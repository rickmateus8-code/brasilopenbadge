import { Gift, Search, FileText, Settings, Layout, Users, ClipboardList, BookOpen, AlertCircle } from "lucide-react";

export interface MenuItem {
  icon: any;
  label: string;
  path: string;
}

export const menuItems: MenuItem[] = [
  { icon: Layout, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Atestados", path: "/atestados" },
  { icon: FileText, label: "Receitas", path: "/receitas" },
  { icon: ClipboardList, label: "Petições", path: "/peticaocria" },
  { icon: Search, label: "Bot Adv", path: "/bot-adv" },
  { icon: Users, label: "Médicos", path: "/medicos" },
  { icon: BookOpen, label: "Histórico SP", path: "/historico-sp" },
  { icon: AlertCircle, label: "Validação", path: "/validacao" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
  { icon: Gift, label: "Indique e Ganhe", path: "/indicacoes" },
];
