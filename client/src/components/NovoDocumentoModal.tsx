/**
 * NovoDocumentoModal — Pop-up "Novo Documento"
 *
 * Exibe lista de documentos disponíveis com preços (do Admin).
 * Fluxo:
 *  - Usuário tem saldo suficiente → navega para a página de criação
 *  - Usuário NÃO tem saldo → exibe pop-up "Saldo Insuficiente" com botão "Recarregar Agora"
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  X, FileText, Car, Anchor, FlaskConical, GraduationCap,
  Pill, AlertTriangle, Wallet, CreditCard
} from "lucide-react";

interface DocOption {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
  price: number;
  priceFormatted: string;
}

interface NovoDocumentoModalProps {
  open: boolean;
  onClose: () => void;
  userBalance: number;
}

// Mapeamento de ícones por tipo de documento
const DOC_ICONS: Record<string, React.ElementType> = {
  atestado: FileText,
  cnh: Car,
  cha: Anchor,
  toxicologico: FlaskConical,
  toxicria: FlaskConical,
  "historico-sp": GraduationCap,
  "historico-uninter": GraduationCap,
  receita: Pill,
};

// Mapeamento de rotas por tipo de documento
const DOC_PATHS: Record<string, string> = {
  atestado: "/atestadocria",
  cnh: "/cnhcria",
  cha: "/chacria",
  toxicologico: "/toxicologicocria",
  toxicria: "/toxicria",
  "historico-sp": "/historico-sp",
  "historico-uninter": "/historico-uninter",
  receita: "/receitacria",
};

export default function NovoDocumentoModal({ open, onClose, userBalance }: NovoDocumentoModalProps) {
  const [, setLocation] = useLocation();
  const [docs, setDocs] = useState<DocOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [insufficientDoc, setInsufficientDoc] = useState<DocOption | null>(null);

  // Buscar preços do backend
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/pricing", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.pricing) {
          const list: DocOption[] = Object.entries(data.pricing).map(([key, val]: [string, any]) => ({
            key,
            label: val.display_name,
            icon: DOC_ICONS[key] || FileText,
            path: DOC_PATHS[key] || "/dashboard",
            price: val.price,
            priceFormatted: val.price_formatted,
          }));
          // Ordenar por nome
          list.sort((a, b) => a.label.localeCompare(b.label));
          setDocs(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleSelectDoc = (doc: DocOption) => {
    if (userBalance < doc.price) {
      setInsufficientDoc(doc);
      return;
    }
    onClose();
    setLocation(doc.path);
  };

  const handleRecarregar = () => {
    onClose();
    setLocation("/recargas");
  };

  // Pop-up de Saldo Insuficiente
  if (insufficientDoc) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}
        onClick={() => setInsufficientDoc(null)}
      >
        <div
          style={{
            background: "#fff", borderRadius: 20, padding: "36px 32px",
            maxWidth: 380, width: "100%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Ícone de aviso */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            border: "3px solid #f97316", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
          }}>
            <AlertTriangle style={{ width: 36, height: 36, color: "#f97316" }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
            Saldo Insuficiente
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
            O valor deste documento é{" "}
            <strong style={{ color: "#dc2626" }}>{insufficientDoc.priceFormatted}</strong>.
            Seu saldo é insuficiente.
          </p>

          {/* Saldo atual */}
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "10px 16px", marginBottom: 24, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Wallet style={{ width: 16, height: 16, color: "#dc2626" }} />
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
              Saldo atual: R$ {(userBalance / 100).toFixed(2)}
            </span>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleRecarregar}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                background: "#16a34a", color: "#fff", fontWeight: 700,
                fontSize: 14, cursor: "pointer", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#15803d")}
              onMouseLeave={e => (e.currentTarget.style.background = "#16a34a")}
            >
              Recarregar Agora
            </button>
            <button
              onClick={() => { setInsufficientDoc(null); }}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                background: "#6b7280", color: "#fff", fontWeight: 700,
                fontSize: 14, cursor: "pointer", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#4b5563")}
              onMouseLeave={e => (e.currentTarget.style.background = "#6b7280")}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal principal — Lista de documentos
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, padding: "28px 28px 24px",
          maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e3a5f", margin: 0 }}>
            Novo Documento
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "#f3f4f6", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#374151", fontSize: 18, fontWeight: 700,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
          O que você deseja emitir hoje?
        </p>

        {/* Saldo do usuário */}
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
          padding: "8px 14px", marginBottom: 20, display: "flex",
          alignItems: "center", gap: 8,
        }}>
          <Wallet style={{ width: 15, height: 15, color: "#16a34a" }} />
          <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
            Seu saldo: <strong>R$ {(userBalance / 100).toFixed(2)}</strong>
          </span>
        </div>

        {/* Grade de documentos */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            Carregando documentos...
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
          }}>
            {docs.map(doc => {
              const Icon = doc.icon;
              const canAfford = userBalance >= doc.price;
              return (
                <button
                  key={doc.key}
                  onClick={() => handleSelectDoc(doc)}
                  style={{
                    background: "#fff", border: "1.5px solid #e5e7eb",
                    borderRadius: 14, padding: "18px 14px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 10, transition: "all 0.18s", textAlign: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#1e3a5f";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,58,95,0.12)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Icon style={{ width: 28, height: 28, color: "#1e3a5f" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                    {doc.label}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: canAfford ? "#16a34a" : "#dc2626",
                    background: canAfford ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${canAfford ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: 20, padding: "3px 12px",
                  }}>
                    {doc.priceFormatted}
                  </span>
                  {!canAfford && (
                    <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
                      Saldo insuficiente
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Rodapé */}
        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            onClick={() => { onClose(); setLocation("/recargas"); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8,
              padding: "8px 14px", cursor: "pointer", fontSize: 12,
              color: "#6b7280", fontWeight: 600, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
          >
            <CreditCard style={{ width: 14, height: 14 }} />
            Recarregar Saldo
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#9ca3af", fontWeight: 500,
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
