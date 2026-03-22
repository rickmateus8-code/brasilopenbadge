/**
 * ConfirmDialog — Pop-up de confirmação universal
 *
 * Usado para todas as ações que requerem confirmação:
 * - Excluir documentos
 * - Editar documentos
 * - Limpar logs
 * - Cancelar emissões
 * - Qualquer ação destrutiva ou importante
 */
import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = "Confirmar Acao",
  message,
  confirmLabel = "CONFIRMAR",
  cancelLabel = "CANCELAR",
  variant = "warning",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = {
    danger: { bg: "#fef2f2", icon: "#dc2626", title: "#991b1b", btn: "#dc2626", btnHover: "#b91c1c" },
    warning: { bg: "#fef3c7", icon: "#d97706", title: "#92400e", btn: "#d97706", btnHover: "#b45309" },
    info: { bg: "#dbeafe", icon: "#2563eb", title: "#1e40af", btn: "#2563eb", btnHover: "#1d4ed8" },
  };

  const c = colors[variant];

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  };

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 14,
    padding: "32px 36px",
    textAlign: "center",
    maxWidth: 400,
    width: "90%",
    boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
  };

  const iconStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: c.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
  };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}>
      <div style={card}>
        <div style={iconStyle}>
          {variant === "danger" ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          ) : variant === "warning" ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          )}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: c.title, margin: "0 0 8px" }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid #e5e7eb",
              background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 13,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
              background: c.btn, color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{
                  width: 14, height: 14, border: "2px solid white",
                  borderTopColor: "transparent", borderRadius: "50%",
                  animation: "cdspin 1s linear infinite", display: "inline-block",
                }} />
                Aguarde...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes cdspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
