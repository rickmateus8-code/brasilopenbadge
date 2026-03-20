/**
 * Validation.tsx — Página de validação de documentos
 * Layout idêntico ao atestado-valide.digital
 *
 * Fluxo:
 * 1. Usuário digita Código de Autenticação (XXXX.XXXX) + Data de Emissão
 * 2. Clica em VALIDAR DOCUMENTO
 * 3. API /api/validate/:code retorna os dados do atestado
 * 4. Modal fullscreen abre com:
 *    - Header: "✅ VÁLIDO E AUTÊNTICO" (verde) + nome do paciente
 *    - Body: iframe com o PDF gerado do atestado
 *    - Footer: FECHAR + BAIXAR PDF
 */
import { useState, useEffect, useRef, useCallback } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import { useParams } from "wouter";
import { exportElementToPDF, exportElementToPDFBlob, generatePDFFilename } from "@/lib/pdfExport";

export default function Validation() {
  const params = useParams();

  // ── Estados ──────────────────────────────────────────────────────────────
  const [codigo, setCodigo] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [validDoc, setValidDoc] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Ref para o AttestationDocument (usado para gerar o PDF)
  const documentRef = useRef<HTMLDivElement>(null);

  // ── Limpar blob URL ao fechar o modal ────────────────────────────────────
  const handleClose = useCallback(() => {
    setShowViewer(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  // ── Gerar PDF blob após o documento ser renderizado ──────────────────────
  useEffect(() => {
    if (!showViewer || !validDoc || !documentRef.current) return;
    // Aguarda o DOM renderizar o AttestationDocument antes de gerar o PDF
    const timer = setTimeout(async () => {
      if (!documentRef.current) return;
      setIsGeneratingPdf(true);
      try {
        const url = await exportElementToPDFBlob(documentRef.current, {});
        setPdfBlobUrl(url);
      } catch (err) {
        console.error("Erro ao gerar PDF blob:", err);
        // Fallback: mantém o AttestationDocument visível
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [showViewer, validDoc]);

  // ── Validar documento ────────────────────────────────────────────────────
  const handleValidate = useCallback(async (codeOverride?: string, dateOverride?: string) => {
    const code = (codeOverride || codigo).trim().toUpperCase();
    if (!code) { setErrorMessage("Informe o código de autenticação."); return; }
    setIsValidating(true);
    setErrorMessage(null);
    setValidDoc(null);
    setShowViewer(false);
    setPdfBlobUrl(null);
    try {
      const res = await fetch(`/api/validate/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.valid && json.data) {
        // Verificar data de emissão se fornecida
        const dateInput = dateOverride || dataEmissao;
        if (dateInput) {
          // Converter data do input (YYYY-MM-DD) para DD/MM/YYYY para comparar
          const [y, m, d] = dateInput.split("-");
          const dateFormatted = `${d}/${m}/${y}`;
          const docDate = json.data.dataEmissao || "";
          // Aceita tanto DD/MM/YYYY quanto YYYY-MM-DD no banco
          const docDateNorm = docDate.includes("/") ? docDate : (() => {
            const [dy, dm, dd] = docDate.split("-");
            return `${dd}/${dm}/${dy}`;
          })();
          if (docDateNorm !== dateFormatted) {
            setErrorMessage("Data de emissão não corresponde ao documento. Verifique e tente novamente.");
            setIsValidating(false);
            return;
          }
        }
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
  }, [codigo, dataEmissao]);

  // ── Auto-validar se vier código na URL (query string ou path param) ────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Tenta pegar código da query string (?codigo=) ou do path param (/v/:id)
    const codeFromQuery = urlParams.get("codigo") || urlParams.get("code") || "";
    const codeFromPath = params.id ? (params.id as string) : "";
    const code = (codeFromQuery || codeFromPath).trim().toUpperCase();
    const dateParam = urlParams.get("data") || "";
    if (code) {
      setCodigo(code);
      if (dateParam) setDataEmissao(dateParam);
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => handleValidate(code, dateParam), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Download PDF ─────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!validDoc) return;
    setIsDownloading(true);
    try {
      if (pdfBlobUrl) {
        // Usar o blob já gerado para download
        const a = document.createElement("a");
        a.href = pdfBlobUrl;
        a.download = generatePDFFilename(validDoc.paciente || "DOCUMENTO", "atestado", "VALIDADO");
        a.click();
      } else if (documentRef.current) {
        // Fallback: gerar PDF direto
        await exportElementToPDF(documentRef.current, {
          filename: generatePDFFilename(validDoc.paciente || "DOCUMENTO", "atestado", "VALIDADO"),
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Formatar data para exibição ──────────────────────────────────────────
  const formatDate = (d: string) => {
    if (!d) return "";
    if (d.includes("/")) return d;
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  // ── Estilos (idênticos ao atestado-valide.digital) ───────────────────────
  const S = {
    page: {
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: "Arial, Helvetica, sans-serif",
      margin: 0,
      padding: 0,
    } as React.CSSProperties,

    // Header azul com "Validador Oficial" centralizado
    header: {
      background: "#005CA9",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    } as React.CSSProperties,

    headerText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: 700,
      margin: 0,
      letterSpacing: 0.3,
    } as React.CSSProperties,

    // Card central branco
    card: {
      background: "#fff",
      borderRadius: 8,
      padding: "24px 28px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
      maxWidth: 480,
      margin: "40px auto",
      marginLeft: "auto",
      marginRight: "auto",
    } as React.CSSProperties,

    cardTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: "#111",
      margin: "0 0 20px",
      textAlign: "center" as const,
    } as React.CSSProperties,

    label: {
      fontSize: 13,
      fontWeight: 600,
      color: "#374151",
      display: "block",
      marginBottom: 5,
    } as React.CSSProperties,

    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 6,
      border: "1.5px solid #d1d5db",
      fontSize: 15,
      outline: "none",
      fontFamily: "monospace",
      letterSpacing: 2,
      textTransform: "uppercase" as const,
      boxSizing: "border-box" as const,
      marginBottom: 14,
    } as React.CSSProperties,

    inputDate: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 6,
      border: "1.5px solid #d1d5db",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box" as const,
      marginBottom: 14,
    } as React.CSSProperties,

    btnGreen: {
      background: "#16a34a",
      color: "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      width: "100%",
      letterSpacing: 0.5,
      marginBottom: 8,
    } as React.CSSProperties,

    btnGray: {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #e5e7eb",
      padding: "12px 20px",
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      width: "100%",
      letterSpacing: 0.5,
    } as React.CSSProperties,

    btnBlue: {
      background: "#005CA9",
      color: "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: 0.5,
    } as React.CSSProperties,

    // Modal fullscreen — idêntico ao atestado-valide.digital
    modal: {
      position: "fixed" as const,
      inset: 0,
      background: "#525659",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column" as const,
    } as React.CSSProperties,

    // Header do modal: verde à esquerda "✅ VÁLIDO E AUTÊNTICO" + nome à direita
    modalHeader: {
      background: "#fff",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #e5e7eb",
      flexShrink: 0,
      minHeight: 48,
    } as React.CSSProperties,

    // Body: fundo cinza escuro com iframe/documento centralizado
    modalBody: {
      flex: 1,
      background: "#525659",
      overflow: "auto",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "12px 0",
    } as React.CSSProperties,

    // Footer: branco com FECHAR (esquerda) e BAIXAR PDF (direita)
    modalFooter: {
      background: "#fff",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderTop: "1px solid #e5e7eb",
      flexShrink: 0,
    } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      {/* ── Header azul com "🛡️ Validador Oficial" centralizado ── */}
      <div style={S.header}>
        <span style={{ fontSize: 16 }}>🛡️</span>
        <span style={S.headerText}>Validador Oficial</span>
      </div>

      {/* ── Card central ── */}
      <div style={{ padding: "0 16px" }}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Consultar Documento</h2>

          {/* Campo: Código de Autenticação */}
          <label style={S.label}>Código de Autenticação</label>
          <input
            style={S.input}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />

          {/* Campo: Data de Emissão */}
          <label style={S.label}>Data de Emissão</label>
          <input
            type="date"
            style={S.inputDate}
            value={dataEmissao}
            onChange={(e) => setDataEmissao(e.target.value)}
          />

          {/* Botão: VALIDAR DOCUMENTO */}
          <button
            style={{ ...S.btnGreen, opacity: isValidating ? 0.7 : 1 }}
            onClick={() => handleValidate()}
            disabled={isValidating}
          >
            {isValidating ? "⏳ Verificando..." : "VALIDAR DOCUMENTO"}
          </button>

          {/* Botão: LIMPAR */}
          <button
            style={S.btnGray}
            onClick={() => {
              setCodigo("");
              setDataEmissao("");
              setErrorMessage(null);
              setValidDoc(null);
              setShowViewer(false);
              if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
            }}
          >
            LIMPAR
          </button>

          {/* Mensagem de erro */}
          {errorMessage && (
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 6, color: "#dc2626", fontSize: 13, fontWeight: 600,
            }}>
              ❌ {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* ── AttestationDocument oculto para geração do PDF ── */}
      {showViewer && validDoc && (
        <div style={{ position: "fixed", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }}>
          <AttestationDocument
            ref={documentRef}
            data={validDoc}
            logoLeft={validDoc.logoUrl}
            logoRight={validDoc.logoRight}
            signatureColor={validDoc.signatureColor}
          />
        </div>
      )}

      {/* ── Modal Fullscreen (idêntico ao atestado-valide.digital) ── */}
      {showViewer && validDoc && (
        <div style={S.modal}>

          {/* Header: "✅ VÁLIDO E AUTÊNTICO" + nome do paciente */}
          <div style={S.modalHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>
                ✅ VÁLIDO E AUTÊNTICO
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 700, color: "#111", fontSize: 13 }}>
                {validDoc.paciente || "—"}
              </span>
            </div>
          </div>

          {/* Body: iframe com PDF ou AttestationDocument com scroll */}
          <div style={S.modalBody}>
            {isGeneratingPdf ? (
              <div style={{ color: "#fff", fontSize: 15, marginTop: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                Gerando visualização do documento...
              </div>
            ) : pdfBlobUrl ? (
              // PDF em iframe — idêntico ao atestado-valide.digital
              <iframe
                src={pdfBlobUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  flex: 1,
                }}
                title="Documento Validado"
              />
            ) : (
              // Fallback: AttestationDocument com scroll
              <div style={{
                background: "#fff",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                overflow: "auto",
                maxHeight: "calc(100vh - 100px)",
              }}>
                <AttestationDocument
                  data={validDoc}
                  logoLeft={validDoc.logoUrl}
                  logoRight={validDoc.logoRight}
                  signatureColor={validDoc.signatureColor}
                />
              </div>
            )}
          </div>

          {/* Footer: FECHAR + BAIXAR PDF */}
          <div style={S.modalFooter}>
            <button
              style={{ ...S.btnGray, width: "auto", padding: "10px 20px", marginBottom: 0 }}
              onClick={handleClose}
            >
              FECHAR
            </button>
            <button
              style={{
                ...S.btnBlue,
                flex: 1,
                opacity: isDownloading ? 0.7 : 1,
                padding: "10px 20px",
              }}
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
