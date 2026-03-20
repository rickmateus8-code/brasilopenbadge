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
    const availableWidth = container.clientWidth - 16;
    const availableHeight = container.clientHeight - 16;
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
    const code = params.id as string;
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

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    border: "1.5px solid #d1d5db", fontSize: 15, outline: "none",
    fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase",
  };
  const btnBlue: React.CSSProperties = {
    background: "#005CA9", color: "#fff", border: "none",
    padding: "12px 24px", borderRadius: 8, fontSize: 14,
    fontWeight: 700, cursor: "pointer", width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#005CA9", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>🔍</span>
        </div>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: 1 }}>DocMaster</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>Validador Oficial de Documentos</p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
        {/* Card de validação */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Consultar Documento</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
            Digite o código de autenticação do documento para verificar sua autenticidade.
          </p>

          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            Código de Autenticação
          </label>
          <input
            style={inp}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex: ABCD.1234"
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />

          <button
            style={{ ...btnBlue, marginTop: 16 }}
            onClick={() => handleValidate()}
            disabled={isValidating}
          >
            {isValidating ? "⏳ Verificando..." : "🔍 VALIDAR DOCUMENTO"}
          </button>

          {errorMessage && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              ❌ {errorMessage}
            </div>
          )}
        </div>

        {/* Resultado */}
        {showViewer && validDoc && (
          <div style={{ marginTop: 24, background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div>
                <p style={{ fontWeight: 800, color: "#15803d", margin: 0, fontSize: 15 }}>VÁLIDO E AUTÊNTICO</p>
                <p style={{ color: "#166534", margin: 0, fontSize: 12 }}>Código: <strong>{validDoc.codigoQR}</strong></p>
              </div>
            </div>

            {/* Preview do documento */}
            <div
              ref={viewerContainerRef}
              style={{ width: "100%", height: 400, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#525659", borderRadius: 8, marginBottom: 16 }}
            >
              <div style={{ transform: `scale(${docScale})`, transformOrigin: "top center" }}>
                <AttestationDocument
                  ref={documentRef}
                  data={validDoc}
                  logoLeft={validDoc.logoUrl}
                  logoRight={validDoc.logoRight}
                  signatureColor={validDoc.signatureColor}
                />
              </div>
            </div>

            <button style={btnBlue} onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? "⏳ Gerando PDF..." : "⬇ BAIXAR PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
