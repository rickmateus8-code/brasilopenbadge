/**
 * EmissionModal — Componente reutilizável para fluxo de emissão de documentos
 *
 * Fluxo:
 * 1. Modal de confirmação: "CONFIRMAR E EMITIR / CANCELAR"
 * 2. Se confirmar → executa emissão → mostra modal de sucesso
 * 3. Modal de sucesso: "DOCUMENTO EMITIDO COM SUCESSO!" → "Baixar {Documento}" → "FECHAR"
 * 4. FECHAR → redireciona para histórico do documento
 *
 * Props:
 * - docType: tipo do documento (cnh, cha, atestado, receita, etc.)
 * - docLabel: label legível ("CNH", "CHA Náutica", "Atestado", etc.)
 * - onConfirm: callback async que executa a emissão (retorna true se sucesso)
 * - onDownload: callback async para baixar o documento
 * - onClose: callback para fechar o modal
 * - historyPath: caminho para redirecionar ao histórico (ex: "/cnhsalvas")
 * - showConfirm: controla exibição do modal de confirmação
 * - showSuccess: controla exibição do modal de sucesso
 * - isEmitting: indica se está processando a emissão
 * - isDownloading: indica se está gerando o download
 */
import { useState } from "react";
import { useLocation } from "wouter";

interface EmissionModalProps {
  docLabel: string;
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

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 48px",
    textAlign: "center",
    maxWidth: 440,
    width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
    padding: "14px 0",
    transition: "opacity 0.2s",
  };

  const btnGreen: React.CSSProperties = {
    ...btnBase,
    background: "#16a34a",
    color: "#fff",
  };

  const btnRed: React.CSSProperties = {
    ...btnBase,
    background: "#ef4444",
    color: "#fff",
  };

  const btnBlue: React.CSSProperties = {
    ...btnBase,
    background: "#2563eb",
    color: "#fff",
    fontSize: 13,
    padding: "12px 0",
  };

  const btnGray: React.CSSProperties = {
    ...btnBase,
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    fontSize: 12,
    padding: "10px 0",
  };

  // ── Modal de Confirmação ──
  if (showConfirm) {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#fef3c7", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 8px" }}>
            CONFIRMAR EMISSAO
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
            Deseja emitir o documento <strong>{docLabel}</strong>?<br />
            O valor sera debitado do seu saldo.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              style={{ ...btnGreen, opacity: isEmitting ? 0.7 : 1 }}
              disabled={isEmitting}
              onClick={onConfirm}
            >
              {isEmitting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: "2px solid white",
                    borderTopColor: "transparent", borderRadius: "50%",
                    animation: "emspin 1s linear infinite", display: "inline-block",
                  }} />
                  Processando...
                </span>
              ) : (
                "CONFIRMAR E EMITIR"
              )}
            </button>
            <button
              style={btnGray}
              onClick={onCancel}
              disabled={isEmitting}
            >
              CANCELAR
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
            width: 64, height: 64, borderRadius: "50%",
            background: "#dcfce7", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              {isDownloading ? "Gerando..." : `BAIXAR ${docLabel.toUpperCase()}`}
            </button>
            <button
              style={btnBlue}
              onClick={() => {
                onClose();
                setLocation(historyPath);
              }}
            >
              IR PARA HISTORICO
            </button>
            <button
              style={btnGray}
              onClick={() => {
                onClose();
                setLocation(historyPath);
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
