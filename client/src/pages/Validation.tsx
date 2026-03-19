import { useState, useEffect, useRef } from "react";
import { attestations } from "@/data/attestations";
import AttestationDocument from "@/components/AttestationDocument";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useParams } from "wouter";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
    officialValidation: "Validação Oficial de Atestados Médicos",
    fillAllFields: "Preencha todos os campos.",
    connectionError: "Erro de conexão.",
    downloadError: "Erro ao baixar o arquivo. Tente novamente.",
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
    officialValidation: "Official Validation of Medical Certificates",
    fillAllFields: "Please fill in all fields.",
    connectionError: "Connection error.",
    downloadError: "Error downloading the file. Please try again.",
  },
};

export default function Validation() {
  const params = useParams();
  const [codigo, setCodigo] = useState(params.id || "");
  const [data, setData] = useState(params.id ? "2026-03-16" : "");
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [validAttestation, setValidAttestation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { language, setLanguage } = useLanguageWithSetter();
  const documentRef = useRef<HTMLDivElement>(null);

  const t = labels[language];

  const handleValidate = async (codeToUse = codigo, dateToUse = data) => {
    if (!codeToUse || !dateToUse) {
      alert(t.fillAllFields);
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    setValidAttestation(null);
    setShowViewer(false);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const attestation = Object.values(attestations).find(
      (a) => a.codigoQR === codeToUse.trim().toUpperCase()
    );

    if (attestation && dateToUse === "2026-03-16") {
      setValidAttestation(attestation);
      setShowViewer(true);
    } else {
      setErrorMessage(t.documentNotFound);
    }

    setIsValidating(false);
  };

  useEffect(() => {
    if (params.id) {
      handleValidate(params.id, "2026-03-16");
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
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const nomeFormatado = validAttestation.paciente
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
      pdf.save(`ATESTADO_${nomeFormatado}.pdf`);
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
        {/* GREEN HEADER BAR - Replicating original site */}
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
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#525659",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              maxWidth: "900px",
              width: "100%",
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
          {/* FECHAR button */}
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

          {/* BAIXAR PDF button */}
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

  // ===== FORM MODE (initial state) =====
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
      {/* HEADER - Blue bar with shield icon */}
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
              placeholder="XXXX-XXXX"
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
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
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
