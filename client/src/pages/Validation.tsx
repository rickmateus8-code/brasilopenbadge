import { useState, useEffect, useRef, useCallback } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useParams } from "wouter";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
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

// Largura real do documento em pixels (850 * 1.1875)
const DOC_WIDTH = 1010;

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

  // Ref do documento real (sem escala) — usado para gerar o PDF
  const documentRef = useRef<HTMLDivElement>(null);
  // Ref do container visível (com escala) — usado para calcular o scale
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const [docScale, setDocScale] = useState(1);
  const [docHeight, setDocHeight] = useState(1400);

  // ─── Calcula o scale para enquadrar o documento na tela do dispositivo ───
  const calcScale = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    // clientWidth já é em CSS pixels (independente do DPR do dispositivo)
    const availableWidth = container.clientWidth - 16; // 8px padding cada lado
    const newScale = availableWidth < DOC_WIDTH
      ? availableWidth / DOC_WIDTH
      : 1;

    setDocScale(newScale);

    // Captura a altura real do documento após render
    if (documentRef.current) {
      const h = documentRef.current.scrollHeight;
      if (h > 0) setDocHeight(h);
    }
  }, []);

  useEffect(() => {
    if (!showViewer) return;

    // Aguarda render inicial
    const t1 = setTimeout(calcScale, 80);
    // Aguarda imagens/QR carregarem
    const t2 = setTimeout(calcScale, 600);
    // Aguarda fontes e layout estabilizar
    const t3 = setTimeout(calcScale, 1200);

    window.addEventListener("resize", calcScale);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", calcScale);
    };
  }, [showViewer, calcScale]);

  const t = labels[language];

  // ─── Validate via API (D1) with local fallback ───
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

    const result = validateAttestation(code, date);
    if (result.valid && result.data) {
      setValidAttestation(result.data);
      setShowViewer(true);
    } else {
      setErrorMessage(t.documentNotFound);
    }
    setIsValidating(false);
  };

  // ─── Auto-validate when accessing via /v/:id (QR Code route) ───
  useEffect(() => {
    if (params.id) {
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

  // ─── Download PDF ───
  // O elemento capturado pelo html2canvas é o documentRef (sem transform scale),
  // garantindo que o PDF seja gerado em resolução total independente do zoom visual.
  const handleDownloadPDF = async () => {
    if (!documentRef.current || !validAttestation) return;

    setIsDownloading(true);

    try {
      const filename = generatePDFFilename(validAttestation.paciente, "VALIDADO");

      // Garante que o elemento está visível para o html2canvas capturar corretamente.
      // O documentRef está dentro de um container com overflow hidden + transform scale,
      // então precisamos torná-lo temporariamente visível em tamanho real para a captura.
      const el = documentRef.current;

      // Salva estilos originais do wrapper
      const wrapper = el.parentElement as HTMLElement | null;
      let prevWrapperStyle = "";
      let prevContainerOverflow = "";
      const container = viewerContainerRef.current;

      if (wrapper) {
        prevWrapperStyle = wrapper.getAttribute("style") || "";
        wrapper.style.transform = "none";
        wrapper.style.position = "static";
        wrapper.style.width = `${DOC_WIDTH}px`;
      }
      if (container) {
        prevContainerOverflow = container.style.overflow;
        container.style.overflow = "visible";
      }

      // Pequeno delay para o browser aplicar os estilos
      await new Promise((r) => setTimeout(r, 60));

      await exportElementToPDF(el, {
        filename,
        scale: 2,
        quality: 0.95,
      });

      // Restaura estilos
      if (wrapper) {
        wrapper.setAttribute("style", prevWrapperStyle);
      }
      if (container) {
        container.style.overflow = prevContainerOverflow;
      }
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
          // Evita zoom indesejado em iOS/Android
          touchAction: "pan-y",
        }}
      >
        {/* ── GREEN HEADER BAR ── */}
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div
              style={{
                width: "22px",
                height: "22px",
                minWidth: "22px",
                backgroundColor: "#22c55e",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
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

        {/* ── DOCUMENT VIEWER AREA ── */}
        <div
          ref={viewerContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            // Padding mínimo para não encostar nas bordas
            padding: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            backgroundColor: "#525659",
            // Suporte a scroll suave em iOS
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >
          {/*
            Estratégia de escala responsiva:
            - O wrapper externo recebe width/height APÓS o scale para que o scroll funcione corretamente
            - O documento interno (documentRef) permanece em tamanho real (DOC_WIDTH)
              para que o html2canvas gere o PDF em alta resolução sem distorção
          */}
          <div
            style={{
              // Largura do wrapper = largura real do doc × scale
              width: `${DOC_WIDTH * docScale}px`,
              // Altura do wrapper = altura real do doc × scale (para scroll correto)
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
                width: `${DOC_WIDTH}px`,
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

        {/* ── FOOTER BAR — FECHAR + BAIXAR PDF ── */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flexShrink: 0,
            borderTop: "2px solid #e5e7eb",
            // Garante que os botões ficam acima da barra de navegação em mobile
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "18px 20px",
              backgroundColor: "#ffffff",
              color: "#333",
              border: "none",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              flexShrink: 0,
              letterSpacing: "0.5px",
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
              opacity: isDownloading ? 0.75 : 1,
              transition: "opacity 0.2s",
              letterSpacing: "0.5px",
            }}
          >
            <span style={{ fontSize: "16px" }}>⬇</span>
            {isDownloading ? t.downloading : t.downloadPdf}
          </button>
        </div>
      </div>
    );
  }

  // ===== FORM MODE (initial state) — Responsive =====
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
