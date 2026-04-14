import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, RefreshCw, CheckCircle2, AlertTriangle, MessageCircle, Minus, Plus, QrCode, X } from "lucide-react";
import { toast } from "sonner";

const MIN_RECHARGE = 20;
const MAX_RECHARGE = 150;
const STEP_RECHARGE = 10;
const BONUS_PERCENT = 0.30; // 30% de bônus conforme imagem (20 -> 26)

type PaymentStatus = "idle" | "generating" | "waiting" | "paid" | "error" | "unavailable";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Recargas() {
  const { user, updateBalance } = useAuth();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState<number>(20);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [qrCode, setQrCode] = useState("");
  const [qrBase64, setQrBase64] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pixErrorMsg, setPixErrorMsg] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/settings/public", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.support_whatsapp) setSupportWhatsapp(data.support_whatsapp);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (status !== "waiting" || !expiresAt) return;
    const expiresMs = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus("error");
        setPixErrorMsg("O QR Code expirou. Gere um novo pagamento.");
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, expiresAt]);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function resetPaymentState() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("idle");
    setQrCode("");
    setQrBase64("");
    setTransactionId("");
    setExpiresAt("");
    setTimeLeft(0);
    setPixErrorMsg("");
    setCopied(false);
  }

  function startPolling(txId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?transaction_id=${encodeURIComponent(txId)}`, { credentials: "include" });
        const data = await res.json();
        if (data.paid) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus("paid");
          if (data.balance !== undefined && updateBalance) updateBalance(data.balance);
          toast.success("Pagamento confirmado!");
        }
      } catch {}
    }, 10000);
  }

  async function handleGeneratePix() {
    setStatus("generating");
    try {
      const res = await fetch("/api/pix/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!data.success) {
        setStatus("unavailable");
        setPixErrorMsg(data.error || "Erro ao gerar Pix.");
        return;
      }
      setQrCode(data.qr_code || "");
      setQrBase64(data.qr_code_base64 || "");
      setTransactionId(data.transaction_id || "");
      setExpiresAt(data.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString());
      setStatus("waiting");
      startPolling(data.transaction_id);
    } catch {
      setStatus("unavailable");
      setPixErrorMsg("Falha de comunicação.");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  const bonusAmount = amount * BONUS_PERCENT;
  const totalAmount = amount + bonusAmount;

  return (
    <DashboardLayout>
      <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
        
        {/* Modal Principal de Recarga Rápida */}
        <div style={{ width: "100%", maxWidth: 420, background: "#ffffff", borderRadius: 32, padding: "32px 24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", position: "relative" }}>
          
          <button onClick={() => navigate("/dashboard")} style={{ position: "absolute", top: 24, right: 24, background: "#f8fafc", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Recarga Rápida</h1>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Saldo disponível imediatamente.</p>
          </div>

          {/* Seletor de Valor */}
          <div style={{ background: "#f8fafc", borderRadius: 24, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <button 
              onClick={() => setAmount(prev => Math.max(MIN_RECHARGE, prev - STEP_RECHARGE))}
              style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 8 }}
            >
              <Minus size={24} strokeWidth={3} />
            </button>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#1e3a8a", letterSpacing: -1 }}>
              {formatBRL(amount)}
            </div>
            <button 
              onClick={() => setAmount(prev => Math.min(MAX_RECHARGE, prev + STEP_RECHARGE))}
              style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 8 }}
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>

          {/* Box de Bônus */}
          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 16, padding: 16, textAlign: "center", marginBottom: 32 }}>
            <div style={{ color: "#166534", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              Você ganha + {formatBRL(bonusAmount)} de bônus!
            </div>
            <div style={{ color: "#14532d", fontSize: 15, fontWeight: 700 }}>
              Saldo adicionado: {formatBRL(totalAmount)}
            </div>
          </div>

          {/* Botão de Ação */}
          <button 
            onClick={handleGeneratePix}
            disabled={status === "generating"}
            style={{ width: "100%", height: 64, background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}
          >
            {status === "generating" ? <RefreshCw className="animate-spin" /> : <QrCode size={20} />}
            GERAR PIX COPIA E COLA
          </button>

          <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 24, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <AlertTriangle size={16} />
              Não fazemos devolução ou transferência de saldo.
            </div>

            <a 
              href={supportWhatsapp ? `https://wa.me/${supportWhatsapp.replace(/\D/g, "")}` : "#"} 
              target="_blank" 
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 52, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, color: "#475569", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              <MessageCircle size={18} color="#22c55e" />
              Suporte com o Pagamento
            </a>
          </div>
        </div>

        {/* Overlay de Pagamento (Waiting) */}
        {status === "waiting" && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)", z_index: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 420, background: "#ffffff", borderRadius: 32, padding: "32px 24px", position: "relative" }}>
              <button onClick={resetPaymentState} style={{ position: "absolute", top: 24, right: 24, background: "#f8fafc", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>

              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>Recarga Rápida</h2>
                <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 20px" }}>Saldo disponível imediatamente.</p>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#ef4444", marginBottom: 24 }}>{formatTime(timeLeft)}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                <div style={{ padding: 16, background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 24, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
                  {qrBase64 ? (
                    <img src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`} alt="QR Code" style={{ width: 220, height: 220 }} />
                  ) : (
                    <div style={{ width: 220, height: 220, background: "#f8fafc", borderRadius: 12 }} />
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "#64748b", wordBreak: "break-all", marginBottom: 12, textAlign: "center" }}>
                  {qrCode}
                </div>
                <button 
                  onClick={handleCopy}
                  style={{ width: "100%", height: 56, background: copied ? "#16a34a" : "#22c55e", color: "#ffffff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  {copied ? "Copiado!" : "Copiar Código"}
                </button>
              </div>

              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 24, textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  <AlertTriangle size={16} />
                  Não fazemos devolução ou transferência de saldo.
                </div>
                <a 
                  href={supportWhatsapp ? `https://wa.me/${supportWhatsapp.replace(/\D/g, "")}` : "#"} 
                  target="_blank" 
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 52, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, color: "#475569", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
                >
                  <MessageCircle size={18} color="#22c55e" />
                  Suporte com o Pagamento
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Overlay de Sucesso */}
        {status === "paid" && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)", z_index: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 420, background: "#ffffff", borderRadius: 32, padding: "40px 24px", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <CheckCircle2 size={48} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Pagamento Confirmado!</h2>
              <p style={{ fontSize: 16, color: "#64748b", margin: "0 0 32px" }}>Seu saldo de {formatBRL(totalAmount)} foi creditado com sucesso.</p>
              <button onClick={() => navigate("/dashboard")} style={{ width: "100%", height: 56, background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Ir para o Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </DashboardLayout>
  );
}
