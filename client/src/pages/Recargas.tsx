import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { CreditCard, Copy, Check, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const RECHARGE_OPTIONS = [
  { label: "R$ 10,00", value: 10 },
  { label: "R$ 25,00", value: 25 },
  { label: "R$ 50,00", value: 50 },
  { label: "R$ 100,00", value: 100 },
  { label: "R$ 200,00", value: 200 },
  { label: "R$ 500,00", value: 500 },
];

type PaymentStatus = "idle" | "generating" | "waiting" | "paid" | "error";

export default function Recargas() {
  const { user, updateBalance } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  const [selected, setSelected] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [qrCode, setQrCode] = useState("");
  const [qrBase64, setQrBase64] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amount = selected ?? (customValue ? parseFloat(customValue) : null);

  function maskCPF(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (status !== "waiting" || !expiresAt) return;
    const expDate = new Date(expiresAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expDate - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setStatus("error");
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, expiresAt]);

  const startPolling = (txId: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const res = await fetch(`/api/pix/status?transaction_id=${txId}`);
        const data = await res.json() as any;
        if (data.paid) {
          clearInterval(pollRef.current!);
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus("paid");
          if (data.balance !== undefined && updateBalance) {
            updateBalance(data.balance);
          }
          toast.success("Pagamento confirmado! Saldo creditado.");
        }
      } catch { /* silenciar */ }
      if (count >= 20) clearInterval(pollRef.current!);
    }, 30000);
  };

  const handleGeneratePix = async () => {
    if (!amount || amount < 5) { toast.error("Valor mínimo: R$ 5,00"); return; }
    if (amount > 10000) { toast.error("Valor máximo: R$ 10.000,00"); return; }
    setStatus("generating");
    try {
      const res = await fetch("/api/pix/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          user_name: user?.display_name || user?.username || "CLIENTE",
          user_cpf: cpf.replace(/\D/g, "") || undefined,
        }),
      });
      const data = await res.json() as any;
      if (!data.success) throw new Error(data.error || "Erro ao gerar PIX");
      setQrCode(data.qr_code || "");
      setQrBase64(data.qr_code_base64 || "");
      setTransactionId(data.transaction_id || "");
      setExpiresAt(data.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString());
      setStatus("waiting");
      startPolling(data.transaction_id);
      toast.success("PIX gerado! Escaneie o QR Code para pagar.");
    } catch (err: any) {
      setStatus("error");
      toast.error(err.message || "Erro ao gerar PIX. Tente novamente.");
    }
  };

  const handleCopy = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("idle"); setQrCode(""); setQrBase64(""); setTransactionId(""); setExpiresAt(""); setTimeLeft(0); setPollCount(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const bg = isDark ? "#0f172a" : "#f1f5f9";
  const card = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e2e8f0";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const muted = isDark ? "#94a3b8" : "#64748b";

  return (
    <DashboardLayout>
      <div style={{ minHeight: "100vh", background: bg, padding: "24px 16px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={22} color="#16a34a" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: textColor, margin: 0 }}>Recarregar Saldo</h1>
              <p style={{ fontSize: 13, color: muted, margin: 0 }}>Pagamento instantâneo via PIX</p>
            </div>
          </div>

          {/* PAGO */}
          {status === "paid" && (
            <div style={{ background: "#dcfce7", border: "2px solid #16a34a", borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 16 }}>
              <CheckCircle size={56} color="#16a34a" style={{ marginBottom: 12 }} />
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: "0 0 8px" }}>Pagamento Confirmado!</h2>
              <p style={{ fontSize: 15, color: "#166534", margin: "0 0 20px" }}>
                R$ {amount?.toFixed(2).replace(".", ",")} creditado no seu saldo.
              </p>
              <button onClick={() => navigate("/dashboard")} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                IR PARA O DASHBOARD
              </button>
            </div>
          )}

          {/* AGUARDANDO */}
          {status === "waiting" && (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                  <Clock size={18} color="#f59e0b" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>
                    Aguardando pagamento — {timeLeft > 0 ? formatTime(timeLeft) : "Verificando..."}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: muted, margin: 0 }}>
                  Valor: <strong style={{ color: textColor }}>R$ {amount?.toFixed(2).replace(".", ",")}</strong>
                  {" · "}Verificação automática a cada 30s{pollCount > 0 && ` (${pollCount}x)`}
                </p>
              </div>

              {qrBase64 ? (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <img
                    src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                    alt="QR Code PIX"
                    style={{ width: 200, height: 200, border: "4px solid #16a34a", borderRadius: 12, objectFit: "contain" }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: "center", marginBottom: 20, padding: 20, background: isDark ? "#0f172a" : "#f8fafc", borderRadius: 12 }}>
                  <div style={{ fontSize: 48 }}>📱</div>
                  <p style={{ fontSize: 12, color: muted, margin: "8px 0 0" }}>Use o código abaixo para pagar</p>
                </div>
              )}

              {qrCode && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: muted, marginBottom: 6, fontWeight: 600 }}>CÓDIGO PIX (COPIA E COLA):</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                    <div style={{ flex: 1, background: isDark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px", fontSize: 11, fontFamily: "monospace", color: textColor, wordBreak: "break-all", maxHeight: 80, overflow: "auto" }}>
                      {qrCode}
                    </div>
                    <button onClick={handleCopy} style={{ background: copied ? "#16a34a" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ background: isDark ? "#0f172a" : "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.6 }}>
                  <strong>Como pagar:</strong><br />
                  1. Abra o app do seu banco<br />
                  2. Acesse PIX → Pagar → Ler QR Code ou Copia e Cola<br />
                  3. Cole o código acima ou escaneie o QR Code<br />
                  4. Confirme o pagamento de <strong>R$ {amount?.toFixed(2).replace(".", ",")}</strong><br />
                  5. O saldo será creditado automaticamente em segundos
                </p>
              </div>

              <button onClick={handleReset} style={{ width: "100%", background: "transparent", color: muted, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 0", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                Cancelar e gerar novo PIX
              </button>
            </div>
          )}

          {/* ERRO */}
          {status === "error" && (
            <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16 }}>
              <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", margin: "0 0 8px" }}>PIX expirado ou erro</h3>
              <p style={{ fontSize: 13, color: "#7f1d1d", margin: "0 0 16px" }}>O QR Code expirou ou houve um erro. Gere um novo PIX.</p>
              <button onClick={handleReset} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Tentar Novamente
              </button>
            </div>
          )}

          {/* FORMULÁRIO */}
          {(status === "idle" || status === "generating") && (
            <>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 16 }}>Escolha o valor</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  {RECHARGE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelected(opt.value); setCustomValue(""); }}
                      style={{ padding: "12px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `2px solid ${selected === opt.value ? "#2563eb" : border}`, background: selected === opt.value ? (isDark ? "#1e3a8a" : "#eff6ff") : "transparent", color: selected === opt.value ? "#2563eb" : textColor, cursor: "pointer" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Outro valor (mín. R$ 5,00)"
                  value={customValue}
                  onChange={e => { setCustomValue(e.target.value); setSelected(null); }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, border: `1px solid ${border}`, background: isDark ? "#0f172a" : "#f8fafc", color: textColor, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 4 }}>
                  CPF do pagador <span style={{ color: muted, fontWeight: 400 }}>(opcional)</span>
                </h2>
                <p style={{ fontSize: 12, color: muted, margin: "0 0 12px" }}>Necessário para emissão de comprovante fiscal</p>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(maskCPF(e.target.value))}
                  maxLength={14}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, border: `1px solid ${border}`, background: isDark ? "#0f172a" : "#f8fafc", color: textColor, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={handleGeneratePix}
                disabled={!amount || amount < 5 || status === "generating"}
                style={{
                  width: "100%", padding: "16px 0", borderRadius: 12, fontSize: 15, fontWeight: 800, border: "none",
                  cursor: (!amount || amount < 5 || status === "generating") ? "not-allowed" : "pointer",
                  background: (!amount || amount < 5) ? (isDark ? "#334155" : "#e2e8f0") : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: (!amount || amount < 5) ? muted : "#fff",
                  boxShadow: (!amount || amount < 5) ? "none" : "0 4px 14px rgba(22,163,74,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
              >
                {status === "generating" ? (
                  <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />Gerando PIX...</>
                ) : (
                  <><span style={{ fontSize: 20 }}>⚡</span>{amount && amount >= 5 ? `GERAR PIX — R$ ${amount.toFixed(2).replace(".", ",")}` : "GERAR PIX"}</>
                )}
              </button>

              <p style={{ fontSize: 11, color: muted, textAlign: "center", marginTop: 12 }}>
                Pagamento 100% seguro · Confirmação automática em segundos
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
