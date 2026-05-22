/**
 * EmissaoConfirmModal.tsx
 * Modal de confirmação reutilizável para emissão de qualquer documento DocMaster.
 * Exibe custo, saldo atual e saldo após emissão.
 * Suporta a prop 'isFree' para ignorar saldo insuficiente em planos admin.
 */

interface EmissaoConfirmModalProps {
  documentoNome: string;       // Ex: "Atestado Médico", "CNH Digital"
  documentoEmoji: string;      // Ex: "📄", "🚗", "🧪"
  documentPrice: number;       // Em centavos
  userBalance: number;         // Em centavos
  isFree?: boolean;            // Se o documento é gratuito para o usuário
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EmissaoConfirmModal({
  documentoNome,
  documentoEmoji,
  documentPrice,
  userBalance,
  isFree = false,
  isLoading,
  onConfirm,
  onCancel,
}: EmissaoConfirmModalProps) {
  const saldoInsuficiente = !isFree && documentPrice > 0 && userBalance < documentPrice;
  const saldoApos = isFree ? userBalance : userBalance - documentPrice;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9998, backdropFilter: "blur(3px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: "36px 32px 28px",
        textAlign: "center", maxWidth: 380, width: "90%",
        boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
      }}>
        {/* Ícone do documento */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#fef3c7", border: "3px solid #fcd34d",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px", fontSize: 32,
        }}>
          {documentoEmoji}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
          Confirmar Emissão
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
          Você está prestes a emitir um <strong>{documentoNome}</strong>.
        </p>

        {/* Tabela de custo */}
        <div style={{
          background: "#f8fafc", borderRadius: 10, padding: "14px 18px",
          marginBottom: 20, border: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Custo do documento:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: (isFree || documentPrice === 0) ? "#16a34a" : "#dc2626" }}>
              {isFree ? "Grátis (Plano Admin)" : documentPrice > 0 ? `R$ ${(documentPrice / 100).toFixed(2).replace(".", ",")}` : "Grátis"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Seu saldo atual:</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: (isFree || userBalance >= documentPrice) ? "#16a34a" : "#dc2626" }}>
              R$ {(userBalance / 100).toFixed(2).replace(".", ",")}
            </span>
          </div>
          {!isFree && documentPrice > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Saldo após emissão:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: saldoApos >= 0 ? "#374151" : "#dc2626" }}>
                R$ {(saldoApos / 100).toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}
        </div>

        {/* Aviso de saldo insuficiente */}
        {saldoInsuficiente && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
            padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626", fontWeight: 600,
          }}>
            ⚠️ Saldo insuficiente! Recarregue seu saldo para continuar.
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              border: "1px solid #d1d5db", background: "#f9fafb",
              color: "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saldoInsuficiente || isLoading}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
              background: saldoInsuficiente || isLoading ? "#9ca3af" : "#16a34a",
              color: "#fff", fontWeight: 700, fontSize: 14,
              cursor: saldoInsuficiente || isLoading ? "not-allowed" : "pointer",
            }}
            onClick={onConfirm}
          >
            {isLoading ? "⏳ Emitindo..." : "✅ Confirmar e Emitir"}
          </button>
        </div>
      </div>
    </div>
  );
}
