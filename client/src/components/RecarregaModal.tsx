import { useState, useEffect } from "react";
import { X, Copy, Check, AlertCircle, Loader2, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const RECARREGA_MODAL_EVENT = "docmaster:open-recarrega-modal";
export const RECARREGA_MODAL_PENDING_KEY = "docmaster:pending-recarrega-modal";

/**
 * Função global para abrir o modal de recarga de qualquer lugar.
 */
export function openRecarregaModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RECARREGA_MODAL_EVENT));
}

/**
 * Enfileira a abertura do modal de recarga para a próxima carga de página (ou imediato).
 */
export function queueRecarregaModalOpen() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RECARREGA_MODAL_PENDING_KEY, "1");
  openRecarregaModal();
}

interface RecarregaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userCpf?: string;
}

/**
 * RecarregaModal — Interface de recarga de saldo via PIX.
 * Seguindo a nova identidade visual "Elite" (Red Theme).
 */
export default function RecarregaModal({
  isOpen,
  onClose,
  userName = "",
  userCpf = "",
}: RecarregaModalProps) {
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"amount" | "pix">("amount");

  const handleGeneratePix = async () => {
    if (!amount || amount < 20 || amount > 1000) {
      toast.error("Valor deve estar entre R$ 20,00 e R$ 1.000,00");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pix/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount,
          user_name: userName,
          user_cpf: userCpf,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Erro ao gerar PIX");
        return;
      }

      setPixData(data);
      setStep("pix");
    } catch (err) {
      console.error("Erro ao gerar PIX:", err);
      toast.error("Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("amount");
    setPixData(null);
    setAmount(50);
    setCopied(false);
    onClose();
  };

  // Atalho teclado (Esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10"
        style={{
          borderRadius: 24,
          padding: "32px",
          maxWidth: 440,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-[#059669]">
              <Wallet className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#059669] tracking-tight m-0">
              Recarga PIX
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full border-none bg-gray-100 dark:bg-white/5 cursor-pointer flex items-center justify-center text-gray-500 hover:text-[#059669] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {step === "amount"
            ? "Selecione ou digite o valor que deseja recarregar agora."
            : "Pagamento via PIX com aprovação imediata em sua conta."}
        </p>

        {step === "amount" ? (
          <div className="space-y-6">
            {/* Grid de Valores Predefinidos */}
            <div className="grid grid-cols-2 gap-3">
              {[20, 50, 100, 150].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`group relative py-4 px-4 rounded-2xl font-bold text-sm transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                    amount === val
                      ? "bg-green-50 border-[#059669] text-[#059669] dark:bg-green-950/20"
                      : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 dark:bg-white/5 dark:border-transparent dark:text-gray-400 dark:hover:bg-white/10"
                  }`}
                >
                  <span className="opacity-60 text-[10px] uppercase tracking-widest font-black">VALOR</span>
                  <span className="text-lg">R$ {val},00</span>
                  {amount === val && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Input Manual Estilo Clean */}
            <div className="pt-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 px-1">
                Ou informe outro valor
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black group-focus-within:text-[#059669] transition-colors text-xl">
                  R$
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="20"
                  placeholder="0,00"
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-[#059669] focus:bg-white dark:focus:bg-transparent rounded-2xl text-2xl font-black text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                />
              </div>
              <div className="flex items-center gap-2 mt-3 px-1">
                <AlertCircle className="w-4 h-4 text-[#059669]" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Mínimo de <span className="text-gray-900 dark:text-gray-200">R$ 20,00</span>
                </span>
              </div>
            </div>

            {/* Botão Principal */}
            <button
              onClick={handleGeneratePix}
              disabled={loading || !amount || amount < 20}
              className="w-full py-5 bg-[#059669] hover:bg-[#047857] disabled:bg-gray-200 dark:disabled:bg-white/5 disabled:text-gray-400 text-white font-black text-base rounded-2xl shadow-xl shadow-green-500/20 transition-all flex items-center justify-center gap-3 mt-4 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>PROCESSANDO...</span>
                </>
              ) : (
                <>
                  <span>GERAR PAGAMENTO PIX</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Box do QR Code */}
            <div className="flex flex-col items-center gap-5">
              <div className="bg-white p-6 rounded-[32px] border-2 border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {pixData?.qr_code_base64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-52 h-52 relative z-10"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-gray-50 rounded-2xl">
                    <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                  Total a Pagar
                </div>
                <div className="text-4xl font-black text-gray-900 dark:text-white flex items-baseline justify-center gap-1">
                  <span className="text-lg opacity-40">R$</span>
                  {pixData?.amount?.toFixed(2).replace(".", ",")}
                </div>
              </div>
            </div>

            {/* Ações do PIX */}
            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(pixData?.qr_code || "")}
                className={`w-full py-5 font-black rounded-2xl transition-all flex items-center justify-center gap-3 border-2 ${
                  copied
                    ? "bg-green-50 border-green-500 text-green-600 dark:bg-green-950/10"
                    : "bg-white border-gray-200 text-gray-700 hover:border-[#059669] hover:text-[#059669] dark:bg-white/5 dark:border-white/10 dark:text-gray-300"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-6 h-6" />
                    CÓDIGO COPIADO!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    COPIAR CÓDIGO PIX
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("amount");
                    setPixData(null);
                  }}
                  className="flex-1 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  VOLTAR
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 hover:border-gray-400 text-gray-500 font-black rounded-xl transition-all text-sm"
                >
                  FECHAR
                </button>
              </div>
            </div>

            {/* Alerta de confirmação */}
            <div className="bg-green-50/50 dark:bg-green-950/10 rounded-2xl p-4 flex gap-4 items-start border border-green-100 dark:border-green-900/20">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shrink-0 shadow-sm">
                <AlertCircle className="w-5 h-5 text-[#059669]" />
              </div>
              <p className="text-[13px] text-green-900/70 dark:text-green-300/60 leading-relaxed font-medium">
                Seu saldo será atualizado <span className="text-[#059669] font-bold">automaticamente</span> após a confirmação do pagamento.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
