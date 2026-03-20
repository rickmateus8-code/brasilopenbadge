import { useState, useEffect, useRef, useCallback } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import { useParams } from "wouter";
import { exportElementToPDF, generatePDFFilename, DOC_REAL_WIDTH } from "@/lib/pdfExport";

const DOC_A4_RATIO = 297 / 210;
const DOC_A4_HEIGHT = Math.round(DOC_REAL_WIDTH * DOC_A4_RATIO);

export default function Validation() {
  const params = useParams();
  const [codigo, setCodigo] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [validDoc, setValidDoc] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [docScale, setDocScale] = useState(1);

  const calcScale = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;
    const availableWidth = container.clientWidth - 24;
    const availableHeight = container.clientHeight - 24;
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const scaleByWidth = availableWidth / DOC_REAL_WIDTH;
    const scaleByHeight = availableHeight / DOC_A4_HEIGHT;
    setDocScale(Math.min(scaleByWidth, scaleByHeight, 1));
  }, []);

  useEffect(() => {
    if (!showViewer) return;
    const t1 = setTimeout(calcScale, 50);
    const t2 = setTimeout(calcScale, 300);
    window.addEventListener("resize", calcScale);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", calcScale); };
  }, [showViewer, calcScale]);

  const handleValidate = async (codeOverride?: string) => {
    const code = (codeOverride || codigo).trim().toUpperCase();
    if (!code) { alert("Informe o código de validação."); return; }
    setIsValidating(true);
    setErrorMessage(null);
    setValidDoc(null);
    setShowViewer(false);
    try {
      const res = await fetch(`/api/validate/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.valid && json.data) {
        setValidDoc(json.data);
        setShowViewer(true);
      } else {
        setErrorMessage(json.message || "Documento não encontrado na base de dados oficial.");
      }
    } catch {
      setErrorMessage("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    const code = (params.id as string).trim().toUpperCase();
    setCodigo(code);
    handleValidate(code);
  }, [params.id]);

  const handleDownloadPdf = async () => {
    if (!documentRef.current || !validDoc) return;
    setIsDownloading(true);
    try {
      await exportElementToPDF(documentRef.current, {
        filename: generatePDFFilename(validDoc.paciente || "DOCUMENTO", "VALIDADO"),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Estilos ───────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: "Arial, Helvetica, sans-serif",
    } as React.CSSProperties,

    header: {
      background: "#005CA9",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    } as React.CSSProperties,

    headerIcon: {
      width: 40,
      height: 40,
      background: "#fff",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      flexShrink: 0,
    } as React.CSSProperties,

    card: {
      background: "#fff",
      borderRadius: 14,
      padding: "28px 32px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    } as React.CSSProperties,

    label: {
      fontSize: 12,
      fontWeight: 700,
      color: "#374151",
      display: "block",
      marginBottom: 6,
    } as React.CSSProperties,

    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 8,
      border: "1.5px solid #d1d5db",
      fontSize: 15,
      outline: "none",
      fontFamily: "monospace",
      letterSpacing: 2,
      textTransform: "uppercase" as const,
      boxSizing: "border-box" as const,
    } as React.CSSProperties,

    btnBlue: {
      background: "#005CA9",
      color: "#fff",
      border: "none",
      padding: "13px 24px",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      width: "100%",
      letterSpacing: 0.5,
    } as React.CSSProperties,

    btnGray: {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #e5e7eb",
      padding: "13px 24px",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
    } as React.CSSProperties,

    // Modal fullscreen
    modal: {
      position: "fixed" as const,
      inset: 0,
      background: "#000",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column" as const,
    } as React.CSSProperties,

    modalHeader: {
      background: "#fff",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #e5e7eb",
      flexShrink: 0,
    } as React.CSSProperties,

    modalBody: {
      flex: 1,
      background: "#525659",
      overflow: "auto",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: 12,
    } as React.CSSProperties,

    modalFooter: {
      background: "#fff",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderTop: "1px solid #e5e7eb",
      flexShrink: 0,
    } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      {/* ── Header azul ── */}
      <div style={S.header}>
        <div style={S.headerIcon}>🛡️</div>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: 0.5 }}>
            validaratestado.digital
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>
            Validador Oficial de Documentos Médicos
          </p>
        </div>
      </div>

      {/* ── Conteúdo central ── */}
      <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>

        {/* Card de validação */}
        <div style={S.card}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>
            Consultar Documento
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
            Digite o código de autenticação do documento para verificar sua autenticidade.
          </p>

          <label style={S.label}>Código de Autenticação</label>
          <input
            style={S.input}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex: ABCD.1234"
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              style={{ ...S.btnBlue, flex: 1 }}
              onClick={() => handleValidate()}
              disabled={isValidating}
            >
              {isValidating ? "⏳ Verificando..." : "🔍 VALIDAR DOCUMENTO"}
            </button>
            <button
              style={{ ...S.btnGray, flexShrink: 0 }}
              onClick={() => {
                setCodigo("");
                setErrorMessage(null);
                setValidDoc(null);
                setShowViewer(false);
              }}
            >
              LIMPAR
            </button>
          </div>

          {errorMessage && (
            <div style={{
              marginTop: 16, padding: "12px 16px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 600,
            }}>
              ❌ {errorMessage}
            </div>
          )}
        </div>

        {/* Informações de segurança */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          {[
            { icon: "🔒", title: "Seguro", desc: "Validação criptografada" },
            { icon: "✅", title: "Oficial", desc: "Base de dados certificada" },
            { icon: "⚡", title: "Instantâneo", desc: "Resultado em segundos" },
          ].map(item => (
            <div key={item.title} style={{
              flex: 1, background: "#fff", borderRadius: 10, padding: "14px 12px",
              textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>{item.title}</p>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal Fullscreen (após validação bem-sucedida) ── */}
      {showViewer && validDoc && (
        <div style={S.modal}>

          {/* Header do modal */}
          <div style={S.modalHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, background: "#f0fdf4",
                border: "2px solid #86efac", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>
                ✅
              </div>
              <div>
                <p style={{ fontWeight: 800, color: "#15803d", margin: 0, fontSize: 14, lineHeight: 1.2 }}>
                  VÁLIDO E AUTÊNTICO
                </p>
                <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>
                  Código: <strong style={{ fontFamily: "monospace", letterSpacing: 1 }}>{validDoc.codigoQR}</strong>
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: 700, color: "#111", margin: 0, fontSize: 13 }}>
                {validDoc.paciente || "—"}
              </p>
              <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>
                {validDoc.dataEmissao || ""}
              </p>
            </div>
          </div>

          {/* Body — documento renderizado */}
          <div
            ref={viewerContainerRef}
            style={S.modalBody}
          >
            <div style={{
              transform: `scale(${docScale})`,
              transformOrigin: "top center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <AttestationDocument
                ref={documentRef}
                data={validDoc}
                logoLeft={validDoc.logoUrl}
                logoRight={validDoc.logoRight}
                signatureColor={validDoc.signatureColor}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={S.modalFooter}>
            <button
              style={{ ...S.btnGray, flexShrink: 0, padding: "11px 20px" }}
              onClick={() => setShowViewer(false)}
            >
              FECHAR
            </button>
            <button
              style={{ ...S.btnBlue, flex: 1, opacity: isDownloading ? 0.7 : 1 }}
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? "⏳ Gerando PDF..." : "⬇ BAIXAR PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
