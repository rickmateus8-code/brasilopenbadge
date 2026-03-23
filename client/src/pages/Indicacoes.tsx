import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "../components/DashboardLayout";
import {
  Gift, Copy, Share2, Users, DollarSign, TrendingUp,
  CheckCircle, Clock, RefreshCw, ExternalLink, QrCode,
  ChevronRight, AlertCircle, Wallet, Info
} from "lucide-react";
import toast from "react-hot-toast";

interface ReferralData {
  code: string;
  referralLink: string;
  totalReferred: number;
  totalEarnings: number;
  totalCashback: number;
  referredUsers: Array<{
    referred_id: string;
    name: string;
    email: string;
    created_at: string;
    total_earned: number;
  }>;
  globalReferralPercentage: number;
  globalCashbackPercentage: number;
  userReferralPercentage?: number;
  userCashbackPercentage?: number;
}

export default function Indicacoes() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [applyCode, setApplyCode] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referral", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) { setLocation("/login"); return; }
        toast.error("Erro ao carregar dados de indicação");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  useEffect(() => { loadData(); }, [loadData]);

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === "code" ? "Código copiado!" : "Link copiado!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const shareLink = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "DocMaster — Emissão de Documentos",
          text: `Use meu código ${data.code} e ganhe cashback no DocMaster!`,
          url: data.referralLink,
        });
      } catch {}
    } else {
      copyToClipboard(data.referralLink, "link");
    }
  };

  const applyReferralCode = async () => {
    if (!applyCode.trim()) { toast.error("Digite um código de indicação"); return; }
    setApplyLoading(true);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ referralCode: applyCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Código de indicação aplicado com sucesso! Você receberá cashback nas suas compras.");
        setApplyCode("");
        loadData();
      } else {
        toast.error(json.error || "Erro ao aplicar código");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setApplyLoading(false);
    }
  };

  const refPct = data?.userReferralPercentage ?? data?.globalReferralPercentage ?? 10;
  const cbPct = data?.userCashbackPercentage ?? data?.globalCashbackPercentage ?? 5;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-6 h-6 text-yellow-500" />
              Programa de Indicações
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Indique amigos e ganhe comissão em cada emissão deles
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : data ? (
          <>
            {/* Como funciona */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-5 text-white">
              <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" /> Como funciona
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: "1", title: "Compartilhe seu link", desc: "Envie seu código ou link para amigos" },
                  { step: "2", title: "Amigo se cadastra", desc: "Ele usa seu código ao criar a conta" },
                  { step: "3", title: "Você ganha", desc: `${refPct}% de comissão em cada emissão dele` },
                ].map(item => (
                  <div key={item.step} className="bg-white/20 rounded-xl p-3 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-white text-yellow-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-yellow-100">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Users, label: "Indicados", value: data.totalReferred, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                { icon: DollarSign, label: "Ganhos Totais", value: `R$ ${(data.totalEarnings / 100).toFixed(2).replace(".", ",")}`, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                { icon: Wallet, label: "Cashback Recebido", value: `R$ ${(data.totalCashback / 100).toFixed(2).replace(".", ",")}`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
                { icon: TrendingUp, label: "Sua Comissão", value: `${refPct}%`, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-4`}>
                  <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Seu código e link */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h2 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <QrCode className="w-4 h-4" /> Seu Código de Indicação
              </h2>

              {/* Código */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border-2 border-dashed border-yellow-400">
                  <p className="text-2xl font-mono font-bold text-yellow-600 dark:text-yellow-400 tracking-widest text-center">
                    {data.code}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(data.code, "code")}
                  className={`p-3 rounded-xl transition-colors ${
                    copied === "code"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Copiar código"
                >
                  {copied === "code" ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              {/* Link */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{data.referralLink}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(data.referralLink, "link")}
                  className={`p-2 rounded-xl transition-colors ${
                    copied === "link"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Copiar link"
                >
                  {copied === "link" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={shareLink}
                  className="p-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <a
                  href={data.referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Botões de compartilhamento rápido */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Use meu código *${data.code}* no DocMaster e ganhe cashback! 🎁\n${data.referralLink}`)}`, "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent(`Use meu código ${data.code} no DocMaster!`)}`, "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Telegram
                </button>
              </div>
            </div>

            {/* Aplicar código de indicação */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" /> Fui Indicado por Alguém
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Se alguém te indicou, insira o código deles para ativar o cashback de <strong>{cbPct}%</strong> nas suas emissões.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: ABC12345"
                  value={applyCode}
                  onChange={e => setApplyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="flex-1 px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                />
                <button
                  onClick={applyReferralCode}
                  disabled={applyLoading || !applyCode.trim()}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
                >
                  {applyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Aplicar
                </button>
              </div>
            </div>

            {/* Lista de indicados */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Meus Indicados ({data.totalReferred})
              </h2>
              {data.referredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum indicado ainda</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Compartilhe seu código e comece a ganhar!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.referredUsers.map(u => (
                    <div key={u.referred_id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.name || u.email}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          + R$ {(u.total_earned / 100).toFixed(2).replace(".", ",")}
                        </p>
                        <p className="text-xs text-gray-400">ganho</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aviso */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Como os ganhos funcionam</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Você recebe <strong>{refPct}%</strong> de comissão sobre cada emissão de documento realizada pelos seus indicados.
                  Os ganhos são creditados automaticamente no seu saldo DocMaster.
                  Seus indicados recebem <strong>{cbPct}%</strong> de cashback em suas próprias emissões.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Erro ao carregar dados</p>
            <button onClick={loadData} className="mt-3 px-4 py-2 text-sm rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors">
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
