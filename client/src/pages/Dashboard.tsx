import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import NovoDocumentoModal from "@/components/NovoDocumentoModal";
import RecarregaModal from "@/components/RecarregaModal";
import { toast } from "sonner";
import CNHDocument, { CNHDocumentHandle, CNHDocumentProps } from "@/components/CNHDocument";
import {
  FileText, Car, Anchor, FlaskConical, GraduationCap,
  Wallet, TrendingUp, BarChart3, ChevronRight, Plus,
  Clock, CheckCircle, Bell, Download, Trash2, Pill, Pencil, QrCode,
  Copy, X, Send, RefreshCw, Search, Save, Smartphone, AlertTriangle, Gift, Users, Loader2
} from "lucide-react";
import AttestationActionButtons from "@/components/AttestationActionButtons";
import AttestationViewerModal from "@/components/AttestationViewerModal";
import { downloadAttestationPdf, fetchLatestAttestationRecord } from "@/lib/attestationActions";

const quickActions = [
  { icon: FileText, label: "Novo Atestado", desc: "Emitir atestado médico", path: "/atestadocria", color: "yellow" },
  { icon: Car, label: "Nova CNH", desc: "Emitir CNH digital", path: "/cnhcria", color: "amber" },
  { icon: Anchor, label: "Nova CHA", desc: "Emitir CHA náutica", path: "/chacria", color: "cyan" },
  { icon: FlaskConical, label: "Laudo Toxicológico Sodré", desc: "Emitir laudo toxicológico Sodré", path: "/toxicria", color: "emerald" },
  { icon: GraduationCap, label: "Histórico SP", desc: "Emitir histórico escolar SP", path: "/historico-sp", color: "green" },
  { icon: GraduationCap, label: "Histórico UNINTER", desc: "Emitir histórico UNINTER", path: "/historico-uninter", color: "indigo" },
  { icon: Pill, label: "Dr. Consulta", desc: "Emitir receituário médico", path: "/receitacria", color: "violet" },
  { icon: FileText, label: "STJ Petição", desc: "Emitir petição jurídica STJ", path: "/peticaocria", color: "indigo" },
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

const INITIAL_HISTORY_TABS = [
  { key: "atestado", label: "Atestado", icon: FileText, color: "yellow" },
  { key: "cnh", label: "CNH", icon: Car, color: "amber" },
  { key: "cha", label: "CHA", icon: Anchor, color: "cyan" },
  { key: "historico-sp", label: "Histórico SP", icon: GraduationCap, color: "green" },
  { key: "historico-uninter", label: "UNINTER", icon: GraduationCap, color: "indigo" },
  { key: "receita", label: "Receitas", icon: Pill, color: "violet" },
];

const APP_LINKS = {
  gov: "https://www.mediafire.com/file/uf6pnzm1br84o4v/cnh_gov.apk/file",
  detran: "https://www.mediafire.com/file/igjyktevpyb1sh1/cnh_digital_detran.apk/file",
  webapp: "https://carteira-digital-transito-vio.digital",
};

const FICHA_FIELDS = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "rg", label: "RG" },
  { key: "orgaoEmissor", label: "Órgão Emissor" },
  { key: "ufRG", label: "UF RG" },
  { key: "sexo", label: "Sexo" },
  { key: "nacionalidade", label: "Nacionalidade" },
  { key: "dataNascimento", label: "Data Nascimento" },
  { key: "localNascimento", label: "Local Nascimento" },
  { key: "ufNascimento", label: "UF Nascimento" },
  { key: "nomePai", label: "Nome do Pai" },
  { key: "nomeMae", label: "Nome da Mãe" },
  { key: "categoria", label: "Categoria" },
  { key: "tipo", label: "Tipo" },
  { key: "registro", label: "Nº Registro" },
  { key: "espelho", label: "Nº CNH (Espelho)" },
  { key: "validade", label: "Validade" },
  { key: "dataEmissao", label: "Data Emissão" },
  { key: "primeiraHabilitacao", label: "1ª Habilitação" },
  { key: "localEmissao", label: "Local Emissão" },
  { key: "ufEmissao", label: "UF Emissão" },
  { key: "assDigital1", label: "Ass. Digital 1" },
  { key: "assDigital2", label: "Ass. Digital 2" },
  { key: "senhaApp", label: "Senha App" },
  { key: "observacoes", label: "Observações" },
];

interface DocRecord {
  id: string;
  seq_id?: number;
  type: string;
  paciente?: string;
  nome?: string;
  cpf?: string;
  senha?: string;
  categoria?: string;
  created_at: string;
  status: string;
  codigo_qr?: string;
  codigo_validacao?: string;
  data_emissao?: string;
  medico?: string;
  data?: any;
}

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("atestado");
  const [historyTabs, setHistoryTabs] = useState(INITIAL_HISTORY_TABS);
  const [history, setHistory] = useState<DocRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [showNovoDocModal, setShowNovoDocModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // CNH-specific states (replicated from CNHSalvas)
  const [cnhSearch, setCnhSearch] = useState("");
  const [appModal, setAppModal] = useState<DocRecord | null>(null);
  const [previewModal, setPreviewModal] = useState<DocRecord | null>(null);
  const [fichaModal, setFichaModal] = useState<DocRecord | null>(null);
  const [fichaData, setFichaData] = useState<Record<string, string>>({});
  const [fichaSaving, setFichaSaving] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [directDownloadCnh, setDirectDownloadCnh] = useState<DocRecord | null>(null);
  const cnhDocRef = useRef<CNHDocumentHandle>(null);
  const directDownloadRef = useRef<CNHDocumentHandle>(null);

  // Atestado/generic doc viewer state
  const [viewAtestado, setViewAtestado] = useState<DocRecord | null>(null);
  const [downloadingAtestadoId, setDownloadingAtestadoId] = useState<string | null>(null);

  // Recarrega modal state
  const [showRecarregaModal, setShowRecarregaModal] = useState(false);
  
  useEffect(() => {
    refresh();
    loadStats();
    loadNotifications();
    loadDynamicTabs();
  }, [refresh]);

  const loadDynamicTabs = async () => {
    try {
      const res = await fetch("/api/templates");
      const result = await res.json();
      if (result.success && result.data) {
        // Filtragem agressiva para evitar duplicidade
        const initialKeys = new Set(INITIAL_HISTORY_TABS.map(t => t.key.toLowerCase()));
        const initialLabels = new Set(INITIAL_HISTORY_TABS.map(t => t.label.toLowerCase()));
        
        const dynamicTabs = result.data
          .map((t: any) => {
            let label = t.name;
            // Padronização de nomes conhecidos para detecção de duplicidade
            if (label.toLowerCase().includes("petição")) label = "Petição STJ";
            
            return {
              key: t.slug,
              label: label,
              icon: FileText,
              color: "indigo"
            };
          })
          .filter((t: any) => {
            const lowLabel = t.label.toLowerCase();
            const lowKey = t.key.toLowerCase();
            // Se já existe na lista inicial ou se o label já foi adicionado
            if (initialKeys.has(lowKey) || initialLabels.has(lowLabel)) return false;
            
            // Marcar como processado
            initialLabels.add(lowLabel);
            return true;
          });

        setHistoryTabs([...INITIAL_HISTORY_TABS, ...dynamicTabs]);
      }
    } catch (err) {
      console.error("Erro ao carregar abas dinâmicas:", err);
    }
  };

  useEffect(() => {
    loadHistory(activeTab);
  }, [activeTab]);

  // Direct PDF download effect
  useEffect(() => {
    if (directDownloadCnh && directDownloadRef.current) {
      const timer = setTimeout(async () => {
        try {
          await directDownloadRef.current?.exportAsPdf();
          toast.success("PDF baixado!");
        } catch {
          toast.error("Erro ao gerar PDF");
        } finally {
          setDirectDownloadCnh(null);
          setDownloadingId(null);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [directDownloadCnh]);

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
      let endpoint = `/api/attestations/${id}`;
      if (activeTab === "receita") endpoint = `/api/receitas/${id}`;
      else if (["cnh", "cha", "toxicologico", "toxicria", "historico-sp", "historico-uninter"].includes(activeTab)) endpoint = `/api/documents/${id}`;
      const res = await fetch(endpoint, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setHistory(prev => prev.filter(d => d.id !== id));
        setConfirmDeleteId(null);
        toast.success("Documento excluído com sucesso!");
      } else {
        toast.error("Erro ao excluir documento.");
      }
    } catch {
      toast.error("Erro ao excluir documento.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return dateStr.slice(0, 10);
      if (dateStr.includes("-") && dateStr.length >= 10) {
        const [y, m, d] = dateStr.slice(0, 10).split("-");
        return `${d}/${m}/${y}`;
      }
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch { return dateStr; }
  };

  // ── CNH-specific helpers ──
  const parseCnhData = (doc: DocRecord) => {
    let parsed: any = {};
    try { parsed = typeof doc.data === "string" ? JSON.parse(doc.data) : (doc.data || {}); } catch {}
    return parsed;
  };

  const buildCNHProps = (doc: DocRecord): CNHDocumentProps => {
    const d = parseCnhData(doc);
    return {
      nome: d.nome || doc.nome || "",
      cpf: d.cpf || doc.cpf || "",
      rg: d.rg || "",
      orgaoEmissor: d.orgaoEmissor || "",
      ufRG: d.ufRG || "",
      sexo: d.sexo || "",
      nacionalidade: d.nacionalidade || "BRASILEIRA",
      dataNascimento: d.dataNascimento || "",
      localNascimento: d.localNascimento || "",
      ufNascimento: d.ufNascimento || "",
      nomePai: d.nomePai || "",
      nomeMae: d.nomeMae || "",
      categoria: d.categoria || doc.categoria || "",
      tipo: d.tipo || "Definitiva",
      registro: d.registro || "",
      espelho: d.espelho || "",
      validade: d.validade || "",
      dataEmissao: d.dataEmissao || "",
      primeiraHabilitacao: d.primeiraHabilitacao || "",
      localEmissao: d.localEmissao || "",
      ufEmissao: d.ufEmissao || "",
      assDigital1: d.assDigital1 || "",
      assDigital2: d.assDigital2 || "",
      senhaApp: d.senhaApp || doc.senha || "",
      observacoes: d.observacoes || "",
      fotoUrl: d.fotoUrl || "",
      assinaturaUrl: d.assinaturaUrl || "",
      codigoQR: doc.id,
      blurred: false,
    };
  };

  const handleDownloadCNH = async () => {
    if (!cnhDocRef.current) return;
    try {
      await cnhDocRef.current.exportAsPdf();
      toast.success("PDF da CNH baixado com sucesso!");
    } catch {
      toast.error("Erro ao baixar PDF da CNH");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const generateMessage = (doc: DocRecord) => {
    const d = parseCnhData(doc);
    const cpf = doc.cpf || d.cpf || "";
    const senha = doc.senha || d.senhaApp || "";
    return `Olá! Aqui estão seus dados de acesso para o App CNH:\nCPF: ${cpf}\nSenha: ${senha}\n\nLinks para download:\nAndroid (GOV): ${APP_LINKS.gov}\nAndroid (DETRAN): ${APP_LINKS.detran}\nWebApp (DETRAN): ${APP_LINKS.webapp}\n\nUm abraço da equipe DocMaster!`;
  };

  const shareWhatsApp = (doc: DocRecord) => {
    if (!whatsappPhone) { toast.error("Digite o número do telefone"); return; }
    const phone = whatsappPhone.replace(/\D/g, "");
    const msg = encodeURIComponent(generateMessage(doc));
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const openFicha = (doc: DocRecord) => {
    const d = parseCnhData(doc);
    setFichaData({
      nome: d.nome || doc.nome || "",
      cpf: d.cpf || doc.cpf || "",
      rg: d.rg || "",
      orgaoEmissor: d.orgaoEmissor || "",
      ufRG: d.ufRG || "",
      sexo: d.sexo || "",
      nacionalidade: d.nacionalidade || "BRASILEIRA",
      dataNascimento: d.dataNascimento || "",
      localNascimento: d.localNascimento || "",
      ufNascimento: d.ufNascimento || "",
      nomePai: d.nomePai || "",
      nomeMae: d.nomeMae || "",
      categoria: d.categoria || doc.categoria || "",
      tipo: d.tipo || "Definitiva",
      registro: d.registro || "",
      espelho: d.espelho || "",
      validade: d.validade || "",
      dataEmissao: d.dataEmissao || "",
      primeiraHabilitacao: d.primeiraHabilitacao || "",
      localEmissao: d.localEmissao || "",
      ufEmissao: d.ufEmissao || "",
      assDigital1: d.assDigital1 || "",
      assDigital2: d.assDigital2 || "",
      senhaApp: d.senhaApp || doc.senha || "",
      observacoes: d.observacoes || "",
    });
    setFichaModal(doc);
  };

  const saveFicha = async () => {
    if (!fichaModal) return;
    setFichaSaving(true);
    try {
      const res = await fetch(`/api/documents/${fichaModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: fichaData }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Ficha Técnica salva com sucesso!");
        setFichaModal(null);
        loadHistory("cnh");
      } else {
        toast.error(result.error || "Erro ao salvar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setFichaSaving(false);
    }
  };

  const openViewAtestado = async (doc: DocRecord) => {
    const latestDoc = await fetchLatestAttestationRecord(doc);
    setHistory((prev) => prev.map((item) => (item.id === latestDoc.id ? latestDoc : item)));
    setViewAtestado(latestDoc);
  };

  const handleDirectDownloadAtestado = async (doc: DocRecord) => {
    setDownloadingAtestadoId(doc.id);
    try {
      const latestDoc = await downloadAttestationPdf(doc);
      setHistory((prev) => prev.map((item) => (item.id === latestDoc.id ? latestDoc : item)));
      toast.success("PDF baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloadingAtestadoId(null);
    }
  };

  // CNH filtered list
  const cnhFiltered = activeTab === "cnh"
    ? history.filter(c => {
        const d = parseCnhData(c);
        const nome = (c.nome || d.nome || "").toLowerCase();
        const cpf = c.cpf || d.cpf || "";
        const id = String(c.seq_id || c.id);
        const q = cnhSearch.toLowerCase();
        return nome.includes(q) || cpf.includes(q) || id.includes(q);
      })
    : history;

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
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 md:p-7 mb-6 md:mb-7 text-white shadow-lg">
          <h1 className="text-xl md:text-2xl font-bold">
            Olá, <span className="text-red-100">{user?.displayName || user?.username}</span>!
          </h1>
          <p className="text-red-100 mt-1 text-xs md:text-sm">
            Bem-vindo ao maior e melhor painel da atualidade — <strong>DocMaster</strong>
          </p>
          <div className="mt-4 flex items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                if (user && user.balance < 100) {
                  setShowRecarregaModal(true);
                } else {
                  setShowNovoDocModal(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs md:text-sm font-semibold transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Novo Documento
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 md:mb-7">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              Estatísticas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: FileText, label: "Atestados Emitidos", value: stats.atestado ?? 0, color: "yellow" },
              { icon: Car, label: "CNHs Emitidas", value: stats.cnh ?? 0, color: "amber" },
              { icon: Anchor, label: "CHAs Emitidas", value: stats.cha ?? 0, color: "cyan" },
              { icon: Wallet, label: "Total Depositado", value: `R$ ${((user?.balance || 0) / 100).toFixed(2).replace(".", ",")}`, color: "emerald" },
            ].map(({ icon: Icon, label, value, color }) => {
              const c = colorMap[color];
              return (
                <div key={label} className={`${c.bg} rounded-xl p-4 md:p-5 flex items-center gap-3 md:gap-4 border border-transparent dark:border-white/5`}>
                  <div className={`${c.iconBg} rounded-lg p-2.5 md:p-3 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${c.text}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase font-medium tracking-tight truncate">{label}</p>
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
            {historyTabs.map(tab => {
              const c = colorMap[tab.color] || colorMap.indigo;
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

          {/* ═══ CNH TAB — FULL CNHSALVAS FLOW ═══ */}
          {activeTab === "cnh" ? (
            <div>
              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Atenção:</strong> As CNHs tem uma validade de <strong>30 dias</strong>, após esse período elas são{" "}
                  <strong>excluídas do sistema</strong> e não podem ser mais utilizadas.
                </p>
              </div>

              {/* Search + Refresh */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou ID..."
                    value={cnhSearch}
                    onChange={e => setCnhSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <button onClick={() => loadHistory("cnh")} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* CNH Table */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full" />
                  </div>
                ) : cnhFiltered.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500">Nenhuma CNH emitida ainda</p>
                    <button
                      onClick={() => setShowNovoDocModal(true)}
                      className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Novo Documento
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">ID</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Nome</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">CPF</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Senha</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Categoria</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {cnhFiltered.map(doc => {
                          const d = parseCnhData(doc);
                          const nome = doc.nome || d.nome || d.nomeCompleto || "—";
                          const cpf = doc.cpf || d.cpf || "—";
                          const senha = doc.senha || d.senhaApp || d.senha || "—";
                          const categoria = doc.categoria || d.categoria || "AB";
                          const seqId = doc.seq_id || doc.id;

                          return (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 font-bold">{seqId}</td>
                              <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 uppercase">{nome}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cpf}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">{senha}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">{categoria}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => setPreviewModal(doc)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white transition-colors"
                                  >
                                    Preview CNH
                                  </button>
                                  <button
                                    onClick={() => { setAppModal(doc); setWhatsappPhone(""); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                                  >
                                    App CNH
                                  </button>
                                  <button
                                    onClick={() => openFicha(doc)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-400 hover:bg-orange-500 text-white transition-colors"
                                  >
                                    Ficha Técnica
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(doc.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> DELETAR
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
          ) : (
            /* ═══ OTHER TABS — DEFAULT TABLE ═══ */
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
                    onClick={() => setShowNovoDocModal(true)}
                    className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Novo Documento
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente/Nome</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Código Emissão</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Emissão</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Criação (Painel)</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {history.map(doc => {
                        const codigoQR = doc.codigo_qr || doc.codigo_validacao || "";
                        const dataEmissao = doc.data_emissao || doc.dataEmissao || doc.data?.dataEmissao || doc.created_at;
                        const creationDate = new Date(doc.created_at);
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                              {doc.paciente || doc.nome || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                              <div className="flex items-center gap-1.5">
                                {codigoQR ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800" title="Código Ativo">
                                    <QrCode className="w-3 h-3" />
                                    {codigoQR}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400" title="Sem Código">
                                    <QrCode className="w-3 h-3 opacity-40" />
                                    {doc.id?.slice(0, 8) || "—"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-semibold">
                              {formatDate(dataEmissao)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {creationDate.toLocaleDateString("pt-BR")}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {creationDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                {doc.status || "emitido"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <AttestationActionButtons
                                onView={() => {
                                  if (activeTab === "atestado") openViewAtestado(doc);
                                  else setLocation(`/v/${doc.codigo_qr || doc.id}`);
                                }}
                                onEdit={activeTab === "atestado" || activeTab === "receita" ? () => setLocation(`/${activeTab}/editar/${doc.id}`) : undefined}
                                onDownload={activeTab === "atestado" ? () => handleDirectDownloadAtestado(doc) : undefined}
                                isDownloading={downloadingAtestadoId === doc.id}
                                onDelete={() => setConfirmDeleteId(doc.id)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Indicações Banner */}
        <div
          className="mb-7 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-5 flex items-center justify-between gap-4 cursor-pointer hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-sm"
          onClick={() => setLocation("/indicacoes")}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">Programa de Indicações</p>
              <p className="text-yellow-100 text-xs mt-0.5">Indique amigos e ganhe comissão em cada emissão deles</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1.5">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-semibold">Ver Painel</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
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

      {/* ══════════════════════════════════════════════ */}
      {/* ═══ MODALS (CNH-specific + generic delete) ═══ */}
      {/* ══════════════════════════════════════════════ */}

      {/* Hidden CNH renderer for direct PDF download */}
      {directDownloadCnh && (
        <div className="fixed -left-[9999px] top-0" aria-hidden>
          <CNHDocument ref={directDownloadRef} {...buildCNHProps(directDownloadCnh)} />
        </div>
      )}

      {/* ── ATESTADO VIEWER MODAL ── */}
      {viewAtestado && (
        <AttestationViewerModal
          doc={viewAtestado}
          isDownloading={downloadingAtestadoId === viewAtestado.id}
          onClose={() => setViewAtestado(null)}
          onDownload={() => handleDirectDownloadAtestado(viewAtestado)}
          onEdit={() => {
            setViewAtestado(null);
            setLocation(`/atestado/editar/${viewAtestado.id}`);
          }}
        />
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Excluir Documento?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir este documento permanentemente? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={!!deletingId}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW CNH MODAL ── */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-3xl w-full shadow-xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preview CNH - {previewModal.nome || parseCnhData(previewModal).nome}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCNH}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" /> Baixar PDF
                </button>
                <button onClick={() => setPreviewModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <CNHDocument ref={cnhDocRef} {...buildCNHProps(previewModal)} />
            </div>
          </div>
        </div>
      )}

      {/* ── APP CNH MODAL ── */}
      {appModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAppModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Download App CNH</h3>
              <button onClick={() => setAppModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Dados de acesso:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">CPF: <strong>{appModal.cpf || parseCnhData(appModal).cpf}</strong></p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Senha: <strong>{appModal.senha || parseCnhData(appModal).senhaApp}</strong></p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" /> Baixe o App (Android):
              </p>
              <div className="space-y-2">
                {[{ label: "Opção GOV:", link: APP_LINKS.gov }, { label: "Opção DETRAN:", link: APP_LINKS.detran }].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={item.link} className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400" />
                      <button onClick={() => copyToClipboard(item.link)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">Copiar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">WebApp:</p>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={APP_LINKS.webapp} className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400" />
                <button onClick={() => copyToClipboard(APP_LINKS.webapp)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">Copiar</button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {generateMessage(appModal)}
              </pre>
            </div>

            <button
              onClick={() => copyToClipboard(generateMessage(appModal))}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors mb-4"
            >
              <Copy className="w-4 h-4" /> Copiar mensagem
            </button>

            <div className="text-center text-sm text-gray-400 dark:text-gray-500 mb-4">OU</div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Enviar via WhatsApp:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Número do telefone do cliente"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  onClick={() => shareWhatsApp(appModal)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" /> Enviar
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setAppModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FICHA TÉCNICA MODAL ── */}
      {fichaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setFichaModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ficha Técnica - {fichaModal.nome || parseCnhData(fichaModal).nome}</h3>
              <button onClick={() => setFichaModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FICHA_FIELDS.map(field => (
                <div key={field.key} className={field.key === "observacoes" ? "col-span-full" : ""}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    {field.label}
                    {field.locked && <span className="ml-1 text-red-500">(bloqueado)</span>}
                  </label>
                  {field.key === "observacoes" ? (
                    <textarea
                      value={fichaData[field.key] || ""}
                      onChange={e => setFichaData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  ) : (
                    <input
                      type="text"
                      value={fichaData[field.key] || ""}
                      onChange={e => setFichaData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={field.locked}
                      className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 ${field.locked ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed" : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white"} focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setFichaModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={saveFicha}
                disabled={fichaSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {fichaSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Novo Documento */}
      <NovoDocumentoModal
        open={showNovoDocModal}
        onClose={() => setShowNovoDocModal(false)}
        userBalance={typeof user?.balance === 'number' ? user.balance : (parseFloat(String(user?.balance ?? '0')) || 0)}
        username={user?.username}
      />
      {/* Modal Recarrega */}
      <RecarregaModal
        isOpen={showRecarregaModal}
        onClose={() => setShowRecarregaModal(false)}
        userName={user?.displayName || user?.username || ""}
        userCpf={user?.cpf || ""}
      />
    </DashboardLayout>
  );
}
