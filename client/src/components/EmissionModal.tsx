/**
 * EmissionModal — Componente reutilizável para fluxo de emissão de documentos
 *
 * Fluxo:
 * 1. Modal de confirmação: exibe custo, saldo atual e saldo após emissão
 * 2. Se confirmar → executa emissão → mostra modal de sucesso
 * 3. Modal de sucesso: "DOCUMENTO EMITIDO COM SUCESSO!" → "Baixar {Documento}" → "FECHAR"
 * 4. FECHAR → redireciona para histórico do documento
 *
 * Props:
 * - docLabel: label legível ("CNH Digital", "CHA Náutica", etc.)
 * - docEmoji: emoji do documento (ex: "🚗", "⚓", "🧪")
 * - documentPrice: custo em centavos (buscado via /api/pricing)
 * - userBalance: saldo atual do usuário em centavos
 * - showConfirm: controla exibição do modal de confirmação
 * - showSuccess: controla exibição do modal de sucesso
 * - isEmitting: indica se está processando a emissão
 * - isDownloading: indica se está gerando o download
 * - onConfirm: callback async que executa a emissão
 * - onCancel: callback para cancelar
 * - onDownload: callback async para baixar o documento
 * - onClose: callback para fechar o modal
 * - historyPath: caminho para redirecionar ao histórico
 */
import { useLocation } from "wouter";

interface EmissionModalProps {
  docLabel: string;
  docEmoji?: string;
  documentPrice?: number;
  userBalance?: number;
  showConfirm: boolean;
  showSuccess: boolean;
  isEmitting: boolean;
  isDownloading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onClose: () => void;
  historyPath: string;
}

export default function EmissionModal({
  docLabel,
  docEmoji = "📄",
  documentPrice = 0,
  userBalance = 0,
  showConfirm,
  showSuccess,
  isEmitting,
  isDownloading,
  onConfirm,
  onCancel,
  onDownload,
  onClose,
  historyPath,
}: EmissionModalProps) {
  const [, setLocation] = useLocation();

  const saldoInsuficiente = documentPrice > 0 && userBalance < documentPrice;
  const saldoApos = userBalance - documentPrice;

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(3px)",
  };

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 18,
    padding: "36px 32px 28px",
    textAlign: "center",
    maxWidth: 400,
    width: "90%",
    boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    padding: "12px 0",
    transition: "opacity 0.2s",
  };

  const btnGreen: React.CSSProperties = { ...btnBase, background: "#16a34a", color: "#fff" };
  const btnBlue: React.CSSProperties = { ...btnBase, background: "#2563eb", color: "#fff", fontSize: 13, padding: "11px 0" };
  const btnGray: React.CSSProperties = { ...btnBase, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", fontSize: 12, padding: "10px 0" };

  // ── Modal de Confirmação ──
  if (showConfirm) {
    return (
      <div style={overlay}>
        <div style={card}>
          {/* Ícone do documento */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#fef3c7", border: "3px solid #fcd34d",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px", fontSize: 32,
          }}>
            {docEmoji}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
            Confirmar Emissão
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
            Você está prestes a emitir um <strong>{docLabel}</strong>.
          </p>

          {/* Tabela de custo */}
          <div style={{
            background: "#f8fafc", borderRadius: 10, padding: "14px 18px",
            marginBottom: 20, border: "1px solid #e2e8f0", textAlign: "left",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Custo do documento:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: documentPrice > 0 ? "#dc2626" : "#16a34a" }}>
                {documentPrice > 0 ? `R$ ${(documentPrice / 100).toFixed(2).replace(".", ",")}` : "Grátis"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Seu saldo atual:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: userBalance >= documentPrice ? "#16a34a" : "#dc2626" }}>
                R$ {(userBalance / 100).toFixed(2).replace(".", ",")}
              </span>
            </div>
            {documentPrice > 0 && (
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

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{ ...btnGray, flex: 1, width: "auto" }}
              onClick={onCancel}
              disabled={isEmitting}
            >
              Cancelar
            </button>
            <button
              style={{
                ...btnGreen, flex: 2, width: "auto",
                opacity: saldoInsuficiente || isEmitting ? 0.6 : 1,
                cursor: saldoInsuficiente || isEmitting ? "not-allowed" : "pointer",
                background: saldoInsuficiente || isEmitting ? "#9ca3af" : "#16a34a",
              }}
              disabled={saldoInsuficiente || isEmitting}
              onClick={onConfirm}
            >
              {isEmitting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, border: "2px solid white",
                    borderTopColor: "transparent", borderRadius: "50%",
                    animation: "emspin 1s linear infinite", display: "inline-block",
                  }} />
                  Emitindo...
                </span>
              ) : (
                "✅ Confirmar e Emitir"
              )}
            </button>
          </div>
        </div>
        <style>{`@keyframes emspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Modal de Sucesso ──
  if (showSuccess) {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#dcfce7", border: "3px solid #86efac",
            display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 18px",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: "0 0 20px" }}>
            DOCUMENTO EMITIDO COM SUCESSO!
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              style={{ ...btnGreen, opacity: isDownloading ? 0.7 : 1 }}
              disabled={isDownloading}
              onClick={onDownload}
            >
              {isDownloading ? "Gerando PDF..." : `⬇️ BAIXAR ${docLabel.toUpperCase()}`}
            </button>
            <button
              style={btnBlue}
              onClick={() => {
                onClose();
                setLocation(historyPath);
              }}
            >
              📋 IR PARA HISTÓRICO
            </button>
            <button
              style={btnGray}
              onClick={() => {
                onClose();
                setLocation("/dashboard");
              }}
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
