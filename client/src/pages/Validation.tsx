import { useState, useEffect, useRef } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useParams } from "wouter";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { findByCode, validateAttestation } from "@/lib/attestationStore";
import { validateAttestationApi, fetchAttestationByCode } from "@/lib/apiClient";

type Language = "pt" | "en";

const labels = {
  pt: {
    title: "Validador Oficial",
    queryDocument: "Consultar Documento",
    authenticationCode: "Código de Autenticação",
    issueDate: "Data de Emissão (DD/MM/AAAA)",
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
    connectionError: "Erro de conexão.",
    downloadError: "Erro ao baixar o arquivo. Tente novamente.",
  },
  en: {
    title: "Official Validator",
    queryDocument: "Query Document",
    authenticationCode: "Authentication Code",
    issueDate: "Issue Date (DD/MM/YYYY)",
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
    connectionError: "Connection error.",
    downloadError: "Error downloading the file. Please try again.",
  },
};

export default function Validation() {
  const params = useParams();
  const [codigo, setCodigo] = useState("");
  const [data, setData] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [validAttestation, setValidAttestation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { language, setLanguage } = useLanguageWithSetter();
  const documentRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [docScale, setDocScale] = useState(1);
  const [docHeight, setDocHeight] = useState(1400);

  // Calcula o scale para enquadrar o documento na tela do dispositivo
  useEffect(() => {
    if (!showViewer) return;

    const calcScale = () => {
      const container = viewerContainerRef.current;
      if (!container) return;
      // Largura real do documento (maxWidth do AttestationDocument ~1010px)
      const docWidth = 1010;
      const availableWidth = container.clientWidth - 32; // padding 16px cada lado
      if (availableWidth < docWidth) {
        setDocScale(availableWidth / docWidth);
      } else {
        setDocScale(1);
      }
      // Captura a altura real do documento após render
      if (documentRef.current) {
        setDocHeight(documentRef.current.scrollHeight || 1400);
      }
    };

    // Aguarda render para ter as dimensões corretas
    const timer = setTimeout(calcScale, 100);
    // Recalcula após imagens carregarem
    const timer2 = setTimeout(calcScale, 800);
    window.addEventListener("resize", calcScale);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener("resize", calcScale);
    };
  }, [showViewer]);

  const t = labels[language];

  // Validate via API (D1) with local fallback
  const handleValidate = async (codeToUse?: string, dateToUse?: string) => {
    const code = codeToUse || codigo;
    const date = dateToUse || data;

    if (!code || !date) {
      alert(t.fillAllFields);
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    setValidAttestation(null);
    setShowViewer(false);

    try {
      // Tentar via API primeiro
      const apiResult = await validateAttestationApi(code, date);
      if (apiResult.valid && apiResult.data) {
        setValidAttestation(apiResult.data);
        setShowViewer(true);
        setIsValidating(false);
        return;
      }
    } catch (_) {
      // API indisponível, usar fallback local
    }

    // Fallback: busca local
    const result = validateAttestation(code, date);
    if (result.valid && result.data) {
      setValidAttestation(result.data);
      setShowViewer(true);
    } else {
      setErrorMessage(t.documentNotFound);
    }
    setIsValidating(false);
  };

  // Auto-validate when accessing via /v/:id (QR Code route)
  useEffect(() => {
    if (params.id) {
      const code = params.id;
      setCodigo(code);
      setIsValidating(true);

      // Tentar via API primeiro, fallback local
      (async () => {
        try {
          const apiAtt = await fetchAttestationByCode(code);
          if (apiAtt) {
            setValidAttestation(apiAtt);
            setData(apiAtt.dataAssinatura || "");
            setShowViewer(true);
            setIsValidating(false);
            return;
          }
        } catch (_) {
          // fallback
        }
        // Fallback local
        const att = findByCode(code);
        if (att) {
          setValidAttestation(att);
          setData(att.dataAssinatura || "");
          setShowViewer(true);
        } else {
          setErrorMessage(t.documentNotFound);
        }
        setIsValidating(false);
      })();
    }
  }, [params.id]);

  const handleClose = () => {
    setShowViewer(false);
    setValidAttestation(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setCodigo("");
    setData("");
    setErrorMessage(null);
    setValidAttestation(null);
    setShowViewer(false);
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current || !validAttestation) return;

    setIsDownloading(true);

    try {
      const filename = generatePDFFilename(validAttestation.paciente, "VALIDADO");
      await exportElementToPDF(documentRef.current, {
        filename,
        scale: 2,
        quality: 0.95,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      alert(t.downloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== VIEWER MODE (after successful validation) =====
  if (showViewer && validAttestation) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f0f2f5",
          zIndex: 9999,
        }}
      >
        {/* GREEN HEADER BAR */}
        <div
          style={{
            backgroundColor: "#166534",
            color: "#ffffff",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#22c55e",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>
              {t.validAndAuthentic}
            </span>
          </div>
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            {validAttestation.paciente}
          </span>
        </div>

        {/* DOCUMENT VIEWER AREA */}
        <div
          ref={viewerContainerRef}
          style={{
            flex: 1,
            overflow: "auto",
            overflowX: "hidden",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            backgroundColor: "#525659",
          }}
        >
          {/*
            Estratégia de escala responsiva:
            - Em mobile: o documento (1010px) é escalado para caber na tela via CSS transform
            - O wrapper externo recebe a largura/altura APÓS o scale para que o scroll funcione
            - O documentRef permanece sem scale para que o PDF seja gerado em alta resolução
          */}
          <div
            style={{
              // Largura do wrapper = largura real do doc * scale
              width: `${1010 * docScale}px`,
              // Altura do wrapper = altura real do doc * scale (para scroll correto)
              height: `${docHeight * docScale}px`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Documento com transform scale — origin top left para alinhar corretamente */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "top left",
                transform: `scale(${docScale})`,
                width: "1010px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div ref={documentRef}>
                  <AttestationDocument
                    data={validAttestation}
                    logoUrl={validAttestation.logoUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BAR - FECHAR + BAIXAR PDF */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            flexShrink: 0,
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "16px 24px",
              backgroundColor: "#ffffff",
              color: "#333",
              border: "none",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {t.close}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              flex: 1,
              padding: "16px 24px",
              backgroundColor: "#166534",
              color: "#ffffff",
              border: "none",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: isDownloading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: isDownloading ? 0.7 : 1,
            }}
          >
            <span>⬇</span>
            {isDownloading ? t.downloading : t.downloadPdf}
          </button>
        </div>
      </div>
    );
  }

  // ===== FORM MODE (initial state) - Responsive =====
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Roboto, Arial, Helvetica, sans-serif",
      }}
    >
      {/* HEADER - Blue bar */}
      <div
        style={{
          backgroundColor: "#1e40af",
          color: "#ffffff",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          🛡
        </div>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          {t.title}
        </span>

        {/* Language Toggle */}
        <div
          style={{
            position: "absolute",
            right: "16px",
            display: "flex",
            gap: "6px",
          }}
        >
          <button
            onClick={() => setLanguage("pt")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "4px",
              border: "1px solid #fff",
              backgroundColor: language === "pt" ? "#ffffff" : "transparent",
              color: language === "pt" ? "#1e40af" : "#ffffff",
              cursor: "pointer",
            }}
          >
            PT-BR
          </button>
          <button
            onClick={() => setLanguage("en")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "4px",
              border: "1px solid #fff",
              backgroundColor: language === "en" ? "#ffffff" : "transparent",
              color: language === "en" ? "#1e40af" : "#ffffff",
              cursor: "pointer",
            }}
          >
            EN
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "32px",
            width: "100%",
            maxWidth: "480px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "24px",
              color: "#111",
            }}
          >
            {t.queryDocument}
          </h2>

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                color: "#991b1b",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Authentication Code */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
                color: "#374151",
              }}
            >
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
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                textAlign: "center",
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Issue Date */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              {t.issueDate}
            </label>
            <input
              id="data"
              type="text"
              placeholder="DD/MM/AAAA"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                textAlign: "center",
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* VALIDATE BUTTON */}
          <button
            onClick={() => handleValidate()}
            disabled={!codigo || !data || isValidating}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: !codigo || !data || isValidating ? "#86efac" : "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: !codigo || !data || isValidating ? "not-allowed" : "pointer",
              marginBottom: "8px",
              letterSpacing: "0.5px",
            }}
          >
            {isValidating ? t.verifying : t.validateDocument}
          </button>

          {/* CLEAR BUTTON */}
          <button
            onClick={handleClear}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            {t.clear}
          </button>
        </div>
      </div>
    </div>
  );
}
