import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, RefreshCw, CheckCircle2, Clock3, AlertCircle, MessageCircle, Minus, Plus, QrCode, Wallet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const MIN_RECHARGE = 20;
const MAX_RECHARGE = 150;
const STEP_RECHARGE = 10;

type PaymentStatus = "idle" | "generating" | "waiting" | "paid" | "error" | "unavailable";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Recargas() {
  const { user, updateBalance } = useAuth();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState<number>(20);
  const [cpf, setCpf] = useState("");
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

  const currentBalance = Number(user?.balance || 0) / 100;

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
        setPixErrorMsg("O QR Code expirou. Gere um novo pagamento para continuar.");
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, expiresAt]);

  function maskCPF(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

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
          if (data.balance !== undefined && updateBalance) {
            updateBalance(data.balance);
          }
          toast.success("Pagamento confirmado! Saldo creditado com sucesso.");
        }
      } catch {
        // Mantém polling silencioso para evitar ruído visual.
      }
    }, 10000);
  }

  async function handleGeneratePix() {
    if (amount < MIN_RECHARGE || amount > MAX_RECHARGE) {
      toast.error(`Escolha um valor entre ${formatBRL(MIN_RECHARGE)} e ${formatBRL(MAX_RECHARGE)}.`);
      return;
    }

    setStatus("generating");
    setPixErrorMsg("");

    try {
      const res = await fetch("/api/pix/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          user_name: user?.displayName || user?.username || "CLIENTE DOCMASTER",
          user_cpf: cpf.replace(/\D/g, "") || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setStatus("unavailable");
        setPixErrorMsg(data.error || "Não foi possível gerar o pagamento Pix agora.");
        return;
      }

      setQrCode(data.qr_code || "");
      setQrBase64(data.qr_code_base64 || "");
      setTransactionId(data.transaction_id || "");
      setExpiresAt(data.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString());
      setStatus("waiting");
      startPolling(data.transaction_id);
      toast.success("QR Code gerado com sucesso.");
    } catch (error) {
      setStatus("unavailable");
      setPixErrorMsg("Falha de comunicação com o gateway de pagamento.");
    }
  }

  function handleCopy() {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success("Código Pix copiado.");
    setTimeout(() => setCopied(false), 2500);
  }

  const whatsappLink = useMemo(() => {
    if (!supportWhatsapp) return null;
    return `https://wa.me/${supportWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
      `Olá! Preciso adicionar saldo no DocMaster.\nUsuário: ${user?.username || ""}\nValor desejado: ${formatBRL(amount)}`
    )}`;
  }, [supportWhatsapp, user?.username, amount]);

  const showPixPopup = status !== "idle";

  return (
    <DashboardLayout>
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px 16px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 999, background: "#ecfdf5", color: "#166534", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
              <ShieldCheck size={15} />
              Pagamento seguro e confirmação automática
            </div>
            <h1 style={{ fontSize: 30, lineHeight: 1.1, color: "#0f172a", margin: "0 0 8px", fontWeight: 800 }}>Adicionar saldo via Pix</h1>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0, maxWidth: 560 }}>
              Ajuste o valor em passos de R$ 10,00, gere seu QR Code instantaneamente e use o saldo para emitir documentos no DocMaster.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.85fr", gap: 18 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 28, boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 18, color: "#0f172a", margin: "0 0 4px", fontWeight: 800 }}>Escolha o valor da recarga</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Mínimo de {formatBRL(MIN_RECHARGE)} e máximo de {formatBRL(MAX_RECHARGE)}.</p>
                </div>
                <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 700, background: "#eff6ff", borderRadius: 999, padding: "8px 12px" }}>
                  Etapas de R$ 10,00
                </div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, padding: 22, background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <button
                    onClick={() => setAmount((prev) => Math.max(MIN_RECHARGE, prev - STEP_RECHARGE))}
                    disabled={amount <= MIN_RECHARGE}
                    style={{ width: 52, height: 52, borderRadius: 16, border: "1px solid #cbd5e1", background: amount <= MIN_RECHARGE ? "#f8fafc" : "#ffffff", color: amount <= MIN_RECHARGE ? "#94a3b8" : "#0f172a", cursor: amount <= MIN_RECHARGE ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Minus size={18} />
                  </button>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>Valor selecionado</div>
                    <div style={{ fontSize: 40, color: "#0f172a", fontWeight: 900, letterSpacing: -1 }}>{formatBRL(amount)}</div>
                  </div>

                  <button
                    onClick={() => setAmount((prev) => Math.min(MAX_RECHARGE, prev + STEP_RECHARGE))}
                    disabled={amount >= MAX_RECHARGE}
                    style={{ width: 52, height: 52, borderRadius: 16, border: "1px solid #cbd5e1", background: amount >= MAX_RECHARGE ? "#f8fafc" : "#ffffff", color: amount >= MAX_RECHARGE ? "#94a3b8" : "#0f172a", cursor: amount >= MAX_RECHARGE ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
                {[20, 50, 80, 100, 120, 150].map((quickValue) => {
                  const active = amount === quickValue;
                  return (
                    <button
                      key={quickValue}
                      onClick={() => setAmount(quickValue)}
                      style={{
                        borderRadius: 14,
                        border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: active ? "#eff6ff" : "#ffffff",
                        color: active ? "#2563eb" : "#0f172a",
                        fontWeight: 800,
                        fontSize: 13,
                        padding: "12px 8px",
                        cursor: "pointer",
                      }}
                    >
                      {formatBRL(quickValue)}
                    </button>
                  );
                })}
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 18, padding: 18, background: "#ffffff" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                  CPF do pagador <span style={{ color: "#64748b", fontWeight: 500 }}>(opcional)</span>
                </label>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>
                  Informe apenas se quiser associar o pagamento ao documento fiscal do pagador.
                </p>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  style={{ width: "100%", height: 48, borderRadius: 14, border: "1px solid #cbd5e1", padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc", color: "#0f172a" }}
                />
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 24, boxShadow: "0 12px 32px rgba(15,23,42,0.06)", height: "fit-content" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                  <Wallet size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>Saldo atual</div>
                  <div style={{ fontSize: 24, color: "#0f172a", fontWeight: 900 }}>{formatBRL(currentBalance)}</div>
                </div>
              </div>

              <div style={{ borderRadius: 18, background: "#0f172a", padding: 18, color: "#ffffff", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Resumo da recarga</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: "#cbd5e1" }}>Valor a adicionar</span>
                  <strong>{formatBRL(amount)}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: "#cbd5e1" }}>Saldo após confirmação</span>
                  <strong>{formatBRL(currentBalance + amount)}</strong>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                  O saldo é creditado automaticamente assim que o pagamento Pix for confirmado pelo gateway.
                </div>
              </div>

              <button
                onClick={handleGeneratePix}
                disabled={status === "generating"}
                style={{ width: "100%", height: 52, border: "none", borderRadius: 16, background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#ffffff", fontSize: 15, fontWeight: 900, cursor: status === "generating" ? "wait" : "pointer", boxShadow: "0 14px 30px rgba(22,163,74,0.24)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              >
                {status === "generating" ? <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />Gerando pagamento...</> : <><QrCode size={18} />Gerar QR Code Pix</>}
              </button>

              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: "14px 0 0" }}>
                Ao gerar o pagamento, você receberá um QR Code e o código copia e cola em um pop-up de pagamento dedicado.
              </p>
            </div>
          </div>
        </div>

        {showPixPopup && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.58)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
            <div style={{ width: "100%", maxWidth: 470, borderRadius: 28, overflow: "hidden", background: "#ffffff", boxShadow: "0 30px 80px rgba(15,23,42,0.35)" }}>
              <div style={{ background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)", color: "#ffffff", padding: "22px 24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Pagamento Pix</div>
                    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.8 }}>{formatBRL(amount)}</div>
                    <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 6 }}>DocMaster · confirmação automática</div>
                  </div>
                  <div style={{ width: 58, height: 58, borderRadius: 18, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {status === "paid" ? <CheckCircle2 size={28} color="#4ade80" /> : status === "error" || status === "unavailable" ? <AlertCircle size={28} color="#fca5a5" /> : <QrCode size={28} color="#ffffff" />}
                  </div>
                </div>
              </div>

              <div style={{ padding: 24 }}>
                {status === "generating" && (
                  <div style={{ textAlign: "center", padding: "28px 12px" }}>
                    <RefreshCw size={34} color="#2563eb" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
                    <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#0f172a", fontWeight: 800 }}>Gerando QR Code</h3>
                    <p style={{ margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>Estamos preparando sua cobrança Pix com a nova integração de pagamento.</p>
                  </div>
                )}

                {status === "waiting" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Clock3 size={18} color="#d97706" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Aguardando pagamento</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>O crédito entra automaticamente ao confirmar.</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#d97706" }}>{formatTime(timeLeft)}</div>
                    </div>

                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 18, textAlign: "center", marginBottom: 18 }}>
                      {qrBase64 ? (
                        <img
                          src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                          alt="QR Code Pix"
                          style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 18, background: "#ffffff", padding: 12, border: "1px solid #e2e8f0" }}
                        />
                      ) : (
                        <div style={{ width: 220, height: 220, borderRadius: 18, background: "#f8fafc", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                          <QrCode size={54} />
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 }}>Pix copia e cola</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                        <div style={{ flex: 1, borderRadius: 16, border: "1px solid #cbd5e1", background: "#f8fafc", padding: "12px 14px", fontSize: 11, lineHeight: 1.55, color: "#0f172a", wordBreak: "break-all", maxHeight: 118, overflow: "auto" }}>
                          {qrCode}
                        </div>
                        <button onClick={handleCopy} style={{ minWidth: 108, border: "none", borderRadius: 16, background: copied ? "#16a34a" : "#2563eb", color: "#ffffff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 14px" }}>
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </div>

                    <div style={{ borderRadius: 18, background: "#eff6ff", border: "1px solid #bfdbfe", padding: 16, marginBottom: 18 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8", marginBottom: 6 }}>Como pagar</div>
                      <p style={{ margin: 0, fontSize: 12, color: "#1e3a8a", lineHeight: 1.7 }}>
                        Abra o aplicativo do seu banco, escolha Pix, escaneie o QR Code ou use o código copia e cola. Assim que o pagamento for confirmado, o novo saldo ficará disponível automaticamente no DocMaster.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={resetPaymentState} style={{ flex: 1, height: 48, borderRadius: 16, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 800, cursor: "pointer" }}>
                        Fechar
                      </button>
                      <button onClick={handleGeneratePix} style={{ flex: 1, height: 48, borderRadius: 16, border: "none", background: "#0f172a", color: "#ffffff", fontWeight: 800, cursor: "pointer" }}>
                        Gerar novamente
                      </button>
                    </div>
                  </>
                )}

                {status === "paid" && (
                  <div style={{ textAlign: "center", padding: "20px 8px 6px" }}>
                    <CheckCircle2 size={54} color="#16a34a" style={{ marginBottom: 14 }} />
                    <h3 style={{ margin: "0 0 8px", fontSize: 22, color: "#0f172a", fontWeight: 900 }}>Pagamento confirmado</h3>
                    <p style={{ margin: "0 0 18px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                      Sua recarga de <strong>{formatBRL(amount)}</strong> já foi creditada com sucesso.
                    </p>
                    <button onClick={() => navigate("/dashboard")} style={{ width: "100%", height: 50, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#ffffff", fontWeight: 900, cursor: "pointer" }}>
                      Ir para o Dashboard
                    </button>
                  </div>
                )}

                {(status === "error" || status === "unavailable") && (
                  <div style={{ textAlign: "center", paddingTop: 8 }}>
                    <AlertCircle size={50} color="#ef4444" style={{ marginBottom: 14 }} />
                    <h3 style={{ margin: "0 0 8px", fontSize: 22, color: "#0f172a", fontWeight: 900 }}>
                      {status === "error" ? "QR Code expirado" : "Gateway indisponível"}
                    </h3>
                    <p style={{ margin: "0 0 18px", fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
                      {pixErrorMsg || "Não foi possível concluir a geração do pagamento Pix neste momento."}
                    </p>
                    <div style={{ display: "grid", gap: 10 }}>
                      <button onClick={resetPaymentState} style={{ width: "100%", height: 48, borderRadius: 16, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 800, cursor: "pointer" }}>
                        Voltar
                      </button>
                      <button onClick={handleGeneratePix} style={{ width: "100%", height: 48, borderRadius: 16, border: "none", background: "#0f172a", color: "#ffffff", fontWeight: 800, cursor: "pointer" }}>
                        Tentar novamente
                      </button>
                      {whatsappLink && (
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ width: "100%", height: 48, borderRadius: 16, background: "#16a34a", color: "#ffffff", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <MessageCircle size={16} />
                          Falar com suporte
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {transactionId && status === "waiting" && (
                  <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
                    Transação: {transactionId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .recargas-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </DashboardLayout>
  );
}
