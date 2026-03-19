import { useState, useEffect, useRef, useCallback } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useParams } from "wouter";
import { exportElementToPDF, generatePDFFilename, DOC_REAL_WIDTH } from "@/lib/pdfExport";
import { findByCode, validateAttestation } from "@/lib/attestationStore";
import { validateAttestationApi, fetchAttestationByCode } from "@/lib/apiClient";

type Language = "pt" | "en";

const labels = {
  pt: {
    title: "Validador Oficial",
    queryDocument: "Consultar Documento",
    authenticationCode: "Código de Autenticação",
    issueDate: "Data de Emissão",
    validateDocument: "VALIDAR DOCUMENTO",
    verifying: "Verificando...",
    clear: "LIMPAR",
    validAndAuthentic: "VÁLIDO E AUTÊNTICO",
    invalid: "INVÁLIDO",
    documentNotFound: "Documento não encontrado na base de dados oficial.",
    downloadPdf: "BAIXAR PDF",
    downloading: "BAIXANDO...",
    close: "FECHAR",
    fillAllFields: "Preencha todos os campos.",
    downloadError: "Erro ao gerar o PDF. Tente novamente.",
  },
  en: {
    title: "Official Validator",
    queryDocument: "Query Document",
    authenticationCode: "Authentication Code",
    issueDate: "Issue Date",
    validateDocument: "VALIDATE DOCUMENT",
    verifying: "Verifying...",
    clear: "CLEAR",
    validAndAuthentic: "VALID AND AUTHENTIC",
    invalid: "INVALID",
    documentNotFound: "Document not found in the official database.",
    downloadPdf: "DOWNLOAD PDF",
    downloading: "DOWNLOADING...",
    close: "CLOSE",
    fillAllFields: "Please fill in all fields.",
    downloadError: "Error generating PDF. Please try again.",
  },
};

/**
 * Converte data do formato YYYY-MM-DD (retornado pelo input type="date")
 * para DD/MM/YYYY (formato esperado pelo banco D1).
 */
function isoToDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

// Proporção A4: 210mm × 297mm
// DOC_REAL_WIDTH = 1010px → altura A4 = 1010 × (297/210) ≈ 1428px
const DOC_A4_RATIO = 297 / 210;
const DOC_A4_HEIGHT = Math.round(DOC_REAL_WIDTH * DOC_A4_RATIO); // ≈ 1428px

export default function Validation() {
  const params = useParams();
  const [codigo, setCodigo] = useState("");
  const [dataISO, setDataISO] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [validAttestation, setValidAttestation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { language, setLanguage } = useLanguageWithSetter();

  const documentRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const [docScale, setDocScale] = useState(1);

  const t = labels[language];

  // ─── Calcula o scale para exibir o documento A4 INTEIRO na tela ──────────
  // O documento deve aparecer completamente visível, com a mesma proporção
  // do PDF exportado (210×297mm), sem scroll e sem cortes.
  const calcScale = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const paddingH = 16; // padding horizontal total (8px cada lado)
    const paddingV = 16; // padding vertical total (8px cada lado)
    const availableWidth  = container.clientWidth  - paddingH;
    const availableHeight = container.clientHeight - paddingV;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    // Scale para caber na largura disponível
    const scaleByWidth  = availableWidth  / DOC_REAL_WIDTH;
    // Scale para caber na altura disponível (mantendo proporção A4)
    const scaleByHeight = availableHeight / DOC_A4_HEIGHT;

    // Usa o menor dos dois → documento cabe inteiro na tela sem cortes
    const newScale = Math.min(scaleByWidth, scaleByHeight, 1);

    setDocScale(newScale);
  }, []);

  useEffect(() => {
    if (!showViewer) return;
    const t1 = setTimeout(calcScale, 50);
    const t2 = setTimeout(calcScale, 200);
    const t3 = setTimeout(calcScale, 600);
    const t4 = setTimeout(calcScale, 1200);
    window.addEventListener("resize", calcScale);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      clearTimeout(t3); clearTimeout(t4);
      window.removeEventListener("resize", calcScale);
    };
  }, [showViewer, calcScale]);

  // ─── Validação ───────────────────────────────────────────────────────────
  const handleValidate = async (codeOverride?: string, isoDateOverride?: string) => {
    const code = (codeOverride || codigo).trim().toUpperCase();
    const iso = isoDateOverride || dataISO;
    const dateForApi = isoToDisplay(iso);

    if (!code || !iso) {
      alert(t.fillAllFields);
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    setValidAttestation(null);
    setShowViewer(false);

    try {
      const apiResult = await validateAttestationApi(code, dateForApi);
      if (apiResult.valid && apiResult.data) {
        setValidAttestation(apiResult.data);
        setShowViewer(true);
        setIsValidating(false);
        return;
      }
    } catch (_) {}

    // Fallback local
    const result = validateAttestation(code, dateForApi);
    if (result.valid && result.data) {
      setValidAttestation(result.data);
      setShowViewer(true);
    } else {
      setErrorMessage(t.documentNotFound);
    }
    setIsValidating(false);
  };

  // ─── Auto-validação via QR Code (/v/:id) ────────────────────────────────
  useEffect(() => {
    if (!params.id) return;
    const code = params.id;
    setCodigo(code);
    setIsValidating(true);

    (async () => {
      try {
        const apiAtt = await fetchAttestationByCode(code);
        if (apiAtt) {
          setValidAttestation(apiAtt);
          if (apiAtt.dataAssinatura) {
            const [d, m, y] = apiAtt.dataAssinatura.split("/");
            if (d && m && y) setDataISO(`${y}-${m}-${d}`);
          }
          setShowViewer(true);
          setIsValidating(false);
          return;
        }
      } catch (_) {}
      const att = findByCode(code);
      if (att) {
        setValidAttestation(att);
        if ((att as any).dataAssinatura) {
          const [d, m, y] = (att as any).dataAssinatura.split("/");
          if (d && m && y) setDataISO(`${y}-${m}-${d}`);
        }
        setShowViewer(true);
      } else {
        setErrorMessage(t.documentNotFound);
      }
      setIsValidating(false);
    })();
  }, [params.id]);

  const handleClose = () => {
    setShowViewer(false);
    setValidAttestation(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setCodigo("");
    setDataISO("");
    setErrorMessage(null);
    setValidAttestation(null);
    setShowViewer(false);
  };

  // ─── Download PDF ────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!documentRef.current || !validAttestation) return;
    setIsDownloading(true);
    try {
      const filename = generatePDFFilename(validAttestation.paciente, "VALIDADO");
      await exportElementToPDF(documentRef.current, {
        filename,
        scale: 2,
        quality: 0.92,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      alert(t.downloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== VIEWER MODE =====
  if (showViewer && validAttestation) {
    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#525659",
        zIndex: 9999,
        fontFamily: "Roboto, sans-serif",
      }}>

        {/* ── VIEWER HEADER ── */}
        <div style={{
          background: "#ffffff",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          zIndex: 10,
          flexShrink: 0,
          gap: "8px",
        }}>
          {/* Status VÁLIDO */}
          <div style={{
            fontWeight: "bold",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {t.validAndAuthentic}
          </div>
          {/* Nome do paciente */}
          <div style={{
            fontSize: "11px",
            color: "#64748b",
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "55%",
          }}>
            {validAttestation.paciente}
          </div>
        </div>

        {/* ── VIEWER BODY ──────────────────────────────────────────────────────
            O documento A4 é exibido INTEIRO na área disponível entre o header
            e o footer, com a mesma proporção do PDF exportado (210×297mm).
            Não há scroll — o scale é calculado para caber tudo na tela.
        ─────────────────────────────────────────────────────────────────────── */}
        <div
          ref={viewerContainerRef}
          style={{
            flex: 1,
            overflow: "hidden",
            background: "#525659",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px",
          } as React.CSSProperties}
        >
          {/*
            Wrapper externo: ocupa exatamente o espaço visual do documento escalado.
            width  = DOC_REAL_WIDTH × docScale
            height = DOC_A4_HEIGHT  × docScale  (proporção A4 exata: 297/210)
          */}
          <div style={{
            width: `${DOC_REAL_WIDTH * docScale}px`,
            height: `${DOC_A4_HEIGHT * docScale}px`,
            flexShrink: 0,
            position: "relative",
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}>
            {/*
              Wrapper de escala: aplica transform a partir do topo-esquerdo.
              O documento real tem DOC_REAL_WIDTH × DOC_A4_HEIGHT pixels,
              e é escalado para caber no espaço disponível.
            */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              transformOrigin: "top left",
              transform: `scale(${docScale})`,
              width: `${DOC_REAL_WIDTH}px`,
              height: `${DOC_A4_HEIGHT}px`,
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}>
              {/* Documento em tamanho real — capturado pelo exportElementToPDF */}
              <div ref={documentRef}>
                <AttestationDocument
                  data={validAttestation}
                  logoUrl={validAttestation.logoUrl}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── VIEWER FOOTER ── */}
        <div style={{
          background: "#ffffff",
          padding: "12px 16px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          gap: "10px",
          zIndex: 10,
          flexShrink: 0,
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}>
          {/* Botão FECHAR */}
          <button
            onClick={handleClose}
            style={{
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "Roboto, sans-serif",
              flexShrink: 0,
              letterSpacing: "0.3px",
            }}
          >
            {t.close}
          </button>

          {/* Botão BAIXAR PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              flex: 1,
              background: isDownloading ? "#1565c0" : "#005CA9",
              color: "#ffffff",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: isDownloading ? "wait" : "pointer",
              fontSize: "14px",
              fontFamily: "Roboto, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: isDownloading ? 0.85 : 1,
              transition: "opacity 0.2s",
              letterSpacing: "0.3px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {isDownloading ? t.downloading : t.downloadPdf}
          </button>
        </div>
      </div>
    );
  }

  // ===== FORMULÁRIO DE VALIDAÇÃO =====
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Roboto, sans-serif",
      margin: 0,
      padding: 0,
    }}>

      {/* ── HEADER AZUL GOV ── */}
      <div style={{
        backgroundColor: "#005CA9",
        color: "#ffffff",
        padding: "15px 20px",
        fontSize: "18px",
        fontWeight: 700,
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        position: "relative",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        </svg>
        {t.title}

        {/* Seletor de idioma */}
        <div style={{ position: "absolute", right: "16px", display: "flex", gap: "6px" }}>
          <button
            onClick={() => setLanguage("pt")}
            style={{
              padding: "3px 8px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.6)",
              backgroundColor: language === "pt" ? "#ffffff" : "transparent",
              color: language === "pt" ? "#005CA9" : "#ffffff",
              cursor: "pointer",
              fontFamily: "Roboto, sans-serif",
            }}
          >
            PT-BR
          </button>
          <button
            onClick={() => setLanguage("en")}
            style={{
              padding: "3px 8px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.6)",
              backgroundColor: language === "en" ? "#ffffff" : "transparent",
              color: language === "en" ? "#005CA9" : "#ffffff",
              cursor: "pointer",
              fontFamily: "Roboto, sans-serif",
            }}
          >
            EN
          </button>
        </div>
      </div>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "20px",
      }}>
        {/* Card de busca */}
        <div style={{
          padding: "20px",
          maxWidth: "500px",
          width: "100%",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#334155",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: 700,
          }}>
            {t.queryDocument}
          </h3>

          {/* Mensagem de erro */}
          {errorMessage && (
            <div style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "16px",
              color: "#991b1b",
              fontSize: "14px",
              textAlign: "center",
            }}>
              {errorMessage}
            </div>
          )}

          {/* Campo: Código de Autenticação */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#64748b",
              marginBottom: "8px",
              fontWeight: "bold",
            }}>
              {t.authenticationCode}
            </label>
            <input
              id="codigo"
              type="text"
              placeholder="XXXX.XXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "16px",
                outline: "none",
                textTransform: "uppercase",
                textAlign: "center",
                letterSpacing: "2px",
                fontFamily: "Roboto, sans-serif",
                boxSizing: "border-box",
                color: "#333333",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#005CA9";
                e.target.style.boxShadow = "0 0 0 2px rgba(0,92,169,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Campo: Data de Emissão — input type="date" com calendário nativo */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#64748b",
              marginBottom: "8px",
              fontWeight: "bold",
            }}>
              {t.issueDate}
            </label>
            <input
              id="data"
              type="date"
              value={dataISO}
              onChange={(e) => setDataISO(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "16px",
                outline: "none",
                fontFamily: "Roboto, sans-serif",
                boxSizing: "border-box",
                color: "#333333",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#005CA9";
                e.target.style.boxShadow = "0 0 0 2px rgba(0,92,169,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Botão VALIDAR */}
          <button
            onClick={() => handleValidate()}
            disabled={!codigo || !dataISO || isValidating}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: !codigo || !dataISO || isValidating ? "not-allowed" : "pointer",
              backgroundColor: !codigo || !dataISO || isValidating ? "#86efac" : "#16a34a",
              color: "#ffffff",
              marginBottom: "10px",
              fontFamily: "Roboto, sans-serif",
              letterSpacing: "0.3px",
              transition: "background-color 0.2s",
            }}
          >
            {isValidating ? t.verifying : t.validateDocument}
          </button>

          {/* Botão LIMPAR */}
          <button
            onClick={handleClear}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: "#e2e8f0",
              color: "#475569",
              fontFamily: "Roboto, sans-serif",
              letterSpacing: "0.3px",
            }}
          >
            {t.clear}
          </button>
        </div>
      </div>
    </div>
  );
}
