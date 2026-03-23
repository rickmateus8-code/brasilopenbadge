import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CreditCard, MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const RECHARGE_OPTIONS = [
  { label: "R$ 10,00", value: 10 },
  { label: "R$ 25,00", value: 25 },
  { label: "R$ 50,00", value: 50 },
  { label: "R$ 100,00", value: 100 },
];

export default function Recargas() {
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const whatsappMsg = encodeURIComponent(
    `Venho de https://docmaster.store. Quero recarregar R$ ${selected?.toFixed(2) || "___"} no meu saldo.`
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recarregar Saldo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Adicione créditos à sua conta</p>
          </div>
        </div>

        {/* Value Selection */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Escolha o valor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {RECHARGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  selected === opt.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Outro valor (R$)"
              onChange={e => setSelected(parseFloat(e.target.value) || null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Como recarregar</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Escolha o valor desejado acima" },
              { step: "2", text: "Entre em contato via WhatsApp clicando no botão abaixo" },
              { step: "3", text: "Realize o pagamento via PIX conforme instruído" },
              { step: "4", text: "Seu saldo será creditado em até 5 minutos" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{step}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/5511965355468?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg ${
            selected
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
          }`}
          onClick={e => !selected && e.preventDefault()}
        >
          <MessageCircle className="w-5 h-5" />
          {selected
            ? `Recarregar R$ ${selected.toFixed(2).replace(".", ",")} via WhatsApp`
            : "Selecione um valor primeiro"
          }
        </a>

        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-4">
          Atendimento via WhatsApp: (11) 96535-5468
        </p>
      </div>
    </DashboardLayout>
  );
}
