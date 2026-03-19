import { useState, useEffect, useRef, useCallback } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useParams } from "wouter";
import { exportElementToPDF, generatePDFFilename, DOC_REAL_WIDTH } from "@/lib/pdfExport";
import { findByCode, validateAttestation } from "@/lib/attestationStore";
import { validateAttestationApi, fetchAttestationByCode } from "@/lib/apiClient";
import { handleDateInput } from "@/lib/dateMask";

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
    downloadError: "Erro ao gerar o PDF. Tente novamente.",
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
    downloadError: "Error generating PDF. Please try again.",
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

  // Ref do documento — usado para exportar o PDF
  const documentRef = useRef<HTMLDivElement>(null);
  // Ref do container do viewer — usado para calcular o scale de exibição
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Scale de exibição: ajusta o documento para caber na tela
  const [docScale, setDocScale] = useState(1);
  // Altura do documento em pixels (para o wrapper externo manter o espaço correto)
  const [docNaturalHeight, setDocNaturalHeight] = useState(1400);

  const t = labels[language];

  // ─── Calcula o scale para enquadrar o documento na tela ─────────────────
  // O documento tem largura real de DOC_REAL_WIDTH px.
  // O scale é calculado como: availableWidth / DOC_REAL_WIDTH
  // Isso garante que o que é exibido na tela tem a mesma proporção do PDF exportado.
  const calcScale = useCallback(() => {
    const container = viewerContainerRef.current;
    const doc = documentRef.current;
    if (!container) return;

    // clientWidth retorna CSS pixels (independente do DPR do dispositivo)
    const padding = 16; // 8px cada lado
    const availableWidth = container.clientWidth - padding;
    const newScale = availableWidth < DOC_REAL_WIDTH
      ? availableWidth / DOC_REAL_WIDTH
      : 1;

    setDocScale(newScale);

    // Captura a altura natural do documento após render
    if (doc && doc.scrollHeight > 0) {
      setDocNaturalHeight(doc.scrollHeight);
    }
  }, []);

  useEffect(() => {
    if (!showViewer) return;

    // Múltiplos timers para garantir que o documento renderizou completamente
    const t1 = setTimeout(calcScale, 100);
    const t2 = setTimeout(calcScale, 500);
    const t3 = setTimeout(calcScale, 1000);
    const t4 = setTimeout(calcScale, 2000);

    window.addEventListener("resize", calcScale);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", calcScale);
    };
  }, [showViewer, calcScale]);

  // ─── Validação via API (D1) com fallback local ───────────────────────────
  const handleValidate = async (codeToUse?: string, dateToUse?: string) => {
    const code = (codeToUse || codigo).trim().toUpperCase();
    const date = (dateToUse || data).trim();

    if (!code || !date) {
      alert(t.fillAllFields);
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    setValidAttestation(null);
    setShowViewer(false);

    try {
      // Tenta a API primeiro
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
          setData(apiAtt.dataAssinatura || "");
          setShowViewer(true);
          setIsValidating(false);
          return;
        }
      } catch (_) {
        // fallback
      }
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

  // ─── Download PDF ────────────────────────────────────────────────────────
  // O exportElementToPDF cria um container independente com largura fixa DOC_REAL_WIDTH,
  // garantindo que o PDF gerado tem a mesma proporção da visualização na tela.
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
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#525659",
          zIndex: 9999,
          // Permite scroll vertical no iOS sem interferir com o touch
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {/* ── BARRA VERDE SUPERIOR ── */}
        <div
          style={{
            backgroundColor: "#166534",
            color: "#ffffff",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "8px",
            minHeight: "52px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                minWidth: "24px",
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
            <span style={{ fontWeight: "bold", fontSize: "13px", whiteSpace: "nowrap" }}>
              {t.validAndAuthentic}
            </span>
          </div>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "55%",
            }}
          >
            {validAttestation.paciente}
          </span>
        </div>

        {/* ── ÁREA DE VISUALIZAÇÃO DO DOCUMENTO ── */}
        {/*
          Layout de escala responsiva:
          - viewerContainerRef: container com scroll, mede a largura disponível
          - O wrapper interno tem width/height = DOC_REAL_WIDTH * docScale / DOC_REAL_HEIGHT * docScale
            para que o scroll funcione corretamente
          - O documentRef fica em tamanho real (DOC_REAL_WIDTH) com transform: scale(docScale)
            aplicado a partir do canto superior esquerdo
          - O PDF é gerado a partir do documentRef em tamanho real, garantindo
            que a proporção visual == proporção do PDF
        */}
        <div
          ref={viewerContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            backgroundColor: "#525659",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >
          {/* Wrapper externo: ocupa o espaço correto após o scale */}
          <div
            style={{
              width: `${DOC_REAL_WIDTH * docScale}px`,
              height: `${docNaturalHeight * docScale}px`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Wrapper de posicionamento: aplica o scale a partir do topo-esquerdo */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "top left",
                transform: `scale(${docScale})`,
                width: `${DOC_REAL_WIDTH}px`,
              }}
            >
              {/* Documento em tamanho real — mesma largura do PDF exportado */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  width: `${DOC_REAL_WIDTH}px`,
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

        {/* ── BARRA INFERIOR: FECHAR + BAIXAR PDF ── */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flexShrink: 0,
            borderTop: "2px solid #e5e7eb",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            backgroundColor: "#ffffff",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "18px 24px",
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "none",
              borderRight: "1px solid #e5e7eb",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              flexShrink: 0,
              letterSpacing: "0.5px",
              fontFamily: "inherit",
            }}
          >
            {t.close}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              flex: 1,
              padding: "18px 20px",
              backgroundColor: isDownloading ? "#14532d" : "#166534",
              color: "#ffffff",
              border: "none",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: isDownloading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: isDownloading ? 0.8 : 1,
              transition: "opacity 0.2s",
              letterSpacing: "0.5px",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: "16px" }}>⬇</span>
            {isDownloading ? t.downloading : t.downloadPdf}
          </button>
        </div>
      </div>
    );
  }

  // ===== FORMULÁRIO DE VALIDAÇÃO =====
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
      {/* HEADER */}
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
          }}
        >
          🛡
        </div>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          {t.title}
        </span>

        {/* Seletor de idioma */}
        <div style={{ position: "absolute", right: "16px", display: "flex", gap: "6px" }}>
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

      {/* CONTEÚDO PRINCIPAL */}
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

          {/* Mensagem de erro */}
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

          {/* Campo: Código de Autenticação */}
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

          {/* Campo: Data de Emissão */}
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
              maxLength={10}
              inputMode="numeric"
              onChange={(e) => setData(handleDateInput(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                textAlign: "center",
                fontFamily: "monospace",
                letterSpacing: "2px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Botão VALIDAR */}
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
              fontFamily: "inherit",
            }}
          >
            {isValidating ? t.verifying : t.validateDocument}
          </button>

          {/* Botão LIMPAR */}
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
              fontFamily: "inherit",
            }}
          >
            {t.clear}
          </button>
        </div>
      </div>
    </div>
  );
}
