import { useState, useEffect } from "react";
import { X, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RecarregaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userCpf?: string;
}

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
    if (!amount || amount < 20 || amount > 150) {
      toast.error("Valor deve estar entre R$ 20,00 e R$ 150,00");
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
      toast.success("PIX gerado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PIX:", err);
      toast.error("Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("amount");
    setPixData(null);
    setAmount(50);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            💳 Recarregar Saldo
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "amount" ? (
            <div className="space-y-4">
              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Escolha o valor da recarga e escaneie o QR Code com seu app de banco.
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Valor da Recarga (R$)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">R$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="20"
                    max="150"
                    step="5"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mínimo: R$ 20,00 | Máximo: R$ 150,00
                </p>
              </div>

              {/* Preset Amounts */}
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Valores rápidos:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 150].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                        amount === val
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGeneratePix}
                disabled={loading}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  "Gerar PIX"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code */}
              {pixData?.qr_code_base64 && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Copy Button for QR Code */}
              <button
                onClick={() => copyToClipboard(pixData?.qr_code || "")}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Código PIX
                  </>
                )}
              </button>

              {/* Amount Display */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Valor a pagar:
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  R$ {pixData?.amount?.toFixed(2) || "0,00"}
                </p>
              </div>

              {/* Info */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Escaneie o QR Code com seu app de banco ou copie o código PIX.
                </p>
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  setStep("amount");
                  setPixData(null);
                }}
                className="w-full py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                ← Voltar
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
