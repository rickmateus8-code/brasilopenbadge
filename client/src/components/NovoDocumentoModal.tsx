/**
 * NovoDocumentoModal — Pop-up "Novo Documento"
 *
 * Exibe lista de documentos disponíveis com preços (do Admin).
 * Fluxo:
 *  - Usuário tem saldo suficiente → navega para a página de criação
 *  - Usuário NÃO tem saldo → exibe pop-up "Saldo Insuficiente" com botão "Recarregar Agora"
 *    e, se configurado, botão de WhatsApp para solicitar recarga manual
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { openRecarregaModal } from "@/components/RecarregaModal";
import {
  X, FileText, Car, Anchor, FlaskConical, GraduationCap,
  Pill, AlertTriangle, Wallet, CreditCard, MessageCircle
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
  username?: string;
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

export default function NovoDocumentoModal({ open, onClose, userBalance, username }: NovoDocumentoModalProps) {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();
  const [docs, setDocs] = useState<DocOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [insufficientDoc, setInsufficientDoc] = useState<DocOption | null>(null);
  const [supportWhatsapp, setSupportWhatsapp] = useState("");

  // Buscar preços do backend e atualizar saldo ao abrir
  useEffect(() => {
    if (!open) return;
    
    // Sincroniza o saldo do usuário com o servidor ao abrir o modal
    refresh();

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
            price: Number(val.price) || 0,
            priceFormatted: val.price_formatted,
          }));
          // Ordenar por nome
          list.sort((a, b) => a.label.localeCompare(b.label));
          setDocs(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, refresh]);

  // Buscar WhatsApp de suporte
  useEffect(() => {
    if (!open) return;
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(data => {
        if (data.support_whatsapp) setSupportWhatsapp(data.support_whatsapp);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleSelectDoc = (doc: DocOption) => {
    // Normalização defensiva do saldo (sempre em centavos no DocMaster)
    const currentBalance = Number(userBalance) || 0;
    const docPrice = Number(doc.price) || 0;

    if (currentBalance < docPrice) {
      setInsufficientDoc(doc);
      return;
    }
    onClose();
    setLocation(doc.path);
  };

  const handleRecarregar = () => {
    onClose();
    openRecarregaModal();
  };

  // Montar link WhatsApp com mensagem pré-preenchida
  const whatsappLink = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Preciso adicionar saldo no DocMaster.\nUsuário: ${username || ""}\nDocumento desejado: ${insufficientDoc?.label || ""}`
      )}`
    : null;

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
            maxWidth: 400, width: "100%", textAlign: "center",
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
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
            O valor deste documento é{" "}
            <strong style={{ color: "#dc2626" }}>{insufficientDoc.priceFormatted}</strong>.
            Seu saldo atual é insuficiente.
          </p>

          {/* Saldo atual */}
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "10px 16px", marginBottom: 20, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Wallet style={{ width: 16, height: 16, color: "#dc2626" }} />
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
              Saldo atual: R$ {((Number(userBalance) || 0) / 100).toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleRecarregar}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#16a34a", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                Recarregar Agora
              </button>
              <button
                onClick={() => setInsufficientDoc(null)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#6b7280", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>

            {/* Fallback WhatsApp */}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "12px 0", borderRadius: 10, border: "1px solid #d1d5db",
                  background: "#fff", color: "#374151", fontWeight: 600,
                  fontSize: 13, textDecoration: "none",
                }}
              >
                <MessageCircle style={{ width: 16, height: 16, color: "#16a34a" }} />
                Solicitar via WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 24, padding: "32px",
          maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
              Novo Documento
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
              Selecione o documento que deseja emitir
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto", padding: 8, borderRadius: 12, border: "none",
              background: "#f3f4f6", color: "#9ca3af", cursor: "pointer",
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ overflowY: "auto", paddingRight: 4 }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div style={{
                width: 32, height: 32, border: "3px solid #ef4444",
                borderTopColor: "transparent", borderRadius: "50%",
                animation: "spin 0.8s linear infinite", margin: "0 auto",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12, paddingBottom: 10,
            }}>
              {docs.map(doc => {
                const Icon = doc.icon;
                const canPay = (Number(userBalance) || 0) >= (Number(doc.price) || 0);

                return (
                  <button
                    key={doc.key}
                    onClick={() => handleSelectDoc(doc)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      padding: "20px", borderRadius: 16, border: "1.5px solid #f3f4f6",
                      background: "#fff", textAlign: "left", cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "#fecaca";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "#f3f4f6";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "#fef2f2", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      marginBottom: 16,
                    }}>
                      <Icon style={{ width: 22, height: 22, color: "#dc2626" }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
                      {doc.label}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "between", width: "100%" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: canPay ? "#16a34a" : "#dc2626" }}>
                        {doc.priceFormatted}
                      </span>
                      {!canPay && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", background: "#fef2f2", padding: "2px 6px", borderRadius: 4, marginLeft: "auto" }}>
                          SALDO INSUFICIENTE
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#fef2f2", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Wallet style={{ width: 20, height: 20, color: "#dc2626" }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.025em" }}>Seu Saldo</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                R$ {((Number(userBalance) || 0) / 100).toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
          <button
            onClick={handleRecarregar}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: "#dc2626", color: "#fff", fontWeight: 700,
              fontSize: 13, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 8,
            }}
          >
            <CreditCard style={{ width: 16, height: 16 }} />
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
}
