/**
 * Validation.tsx — Página UNIVERSAL de validação de documentos
 *
 * Suporta TODOS os tipos de documentos:
 * - Atestados (AttestationDocument → PDF)
 * - Receitas  (PrescricaoDocument → PDF)
 * - CNH       (CNHDocument → JPEG via Canvas)
 * - Futuros   (fallback genérico com dados JSON)
 *
 * Fluxo:
 * 1. Usuário digita Código de Autenticação (XXXX.XXXX) + Data de Emissão
 * 2. Clica em VALIDAR DOCUMENTO
 * 3. API /api/validate/:code retorna os dados do documento
 * 4. Modal fullscreen abre com visualização do documento
 *
 * Rotas que usam este componente:
 * - /v/:id                                (genérico docmaster.store)
 * - /verificar/atestado/:id               (validaratestado.digital)
 * - /verificar/receita/:id                (verificamed.digital)
 * - /verificar/:id                        (carteira-digital-transito-vio.digital)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import AttestationDocument from "@/components/AttestationDocument";
import PrescricaoDocument from "@/components/PrescricaoDocument";
import CNHDocument from "@/components/CNHDocument";
import { useParams } from "wouter";
import { exportElementToPDF, exportElementToPDFBlob, generatePDFFilename } from "@/lib/pdfExport";

type DocType = "atestado" | "receita" | "cnh" | "unknown";

function detectDocType(data: any): DocType {
  if (data.tipo === "receita") return "receita";
  if (data.tipo === "cnh") return "cnh";
  if (data.tipo === "atestado") return "atestado";
  // Fallback: se tem campo 'textoAtestado' ou 'afastamento', é atestado
  if (data.textoAtestado || data.afastamento) return "atestado";
  // Se tem campo 'prescricao', é receita
  if (data.prescricao) return "receita";
  // Se tem campo 'categoria' ou 'registro', é CNH
  if (data.categoria || data.registro) return "cnh";
  return "unknown";
}

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
  const [docType, setDocType] = useState<DocType>("unknown");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Refs para os documentos (usado para gerar PDF)
  const attestationRef = useRef<HTMLDivElement>(null);
  const prescricaoRef = useRef<HTMLDivElement>(null);
  const cnhRef = useRef<any>(null);

  // ── Limpar blob URL ao fechar o modal ────────────────────────────────────
  const handleClose = useCallback(() => {
    setShowViewer(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  // ── Gerar PDF/JPEG blob após o documento ser renderizado ─────────────────
  useEffect(() => {
    if (!showViewer || !validDoc) return;
    const timer = setTimeout(async () => {
      setIsGeneratingPdf(true);
      try {
        if (docType === "cnh") {
          // CNH usa Canvas → JPEG
          if (cnhRef.current?.exportAsBlob) {
            const blob = await cnhRef.current.exportAsBlob();
            if (blob) {
              const url = URL.createObjectURL(blob);
              setPdfBlobUrl(url);
            }
          }
        } else if (docType === "atestado" && attestationRef.current) {
          const url = await exportElementToPDFBlob(attestationRef.current, {});
          setPdfBlobUrl(url);
        } else if (docType === "receita" && prescricaoRef.current) {
          const url = await exportElementToPDFBlob(prescricaoRef.current, {});
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error("Erro ao gerar preview:", err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [showViewer, validDoc, docType]);

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
      // Usar API do docmaster.store para validação (funciona para todos os domínios)
      const apiBase = window.location.hostname === "localhost"
        ? ""
        : "https://docmaster.store";
      const res = await fetch(`${apiBase}/api/validate/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.valid && json.data) {
        // Verificar data de emissão se fornecida
        const dateInput = dateOverride || dataEmissao;
        if (dateInput) {
          // Normalizar data de entrada (aceita DD/MM/YYYY ou YYYY-MM-DD)
          let dateFormatted = dateInput;
          if (dateInput.includes("-")) {
            // Formato YYYY-MM-DD → DD/MM/YYYY
            const [y, m, d] = dateInput.split("-");
            dateFormatted = `${d}/${m}/${y}`;
          }
          // Normalizar data do documento
          const docDate = json.data.dataEmissao || json.data.data_emissao || "";
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
        const type = detectDocType(json.data);
        setDocType(type);
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
  // ── Auto-validar se vier código na URL ──────────────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromQuery = urlParams.get("codigo") || urlParams.get("code") || "";
    const codeFromPath = params.id ? (params.id as string) : "";
    const code = (codeFromQuery || codeFromPath).trim().toUpperCase();
    const dateParam = urlParams.get("data") || "";
    if (code) {
      setCodigo(code);
      if (dateParam) {
        // Converter YYYY-MM-DD (da URL) para DD/MM/YYYY (input brasileiro)
        if (dateParam.includes("-")) {
          const [y, m, d] = dateParam.split("-");
          setDataEmissao(`${d}/${m}/${y}`);
        } else {
          setDataEmissao(dateParam);
        }
      }
      setTimeout(() => handleValidate(code, dateParam), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ── Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!validDoc) return;
    setIsDownloading(true);
    try {
      const nome = validDoc.paciente || validDoc.nome || "DOCUMENTO";
      if (docType === "cnh") {
        // CNH → download JPEG
        if (cnhRef.current?.exportAsBlob) {
          const blob = await cnhRef.current.exportAsBlob();
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `CNH_${nome.replace(/\s+/g, "_")}_VALIDADO.jpeg`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      } else if (pdfBlobUrl) {
        const a = document.createElement("a");
        a.href = pdfBlobUrl;
        a.download = generatePDFFilename(nome, docType as any, "VALIDADO");
        a.click();
      } else {
        // Fallback: gerar PDF direto
        const ref = docType === "receita" ? prescricaoRef.current : attestationRef.current;
        if (ref) {
          await exportElementToPDF(ref, {
            filename: generatePDFFilename(nome, docType as any, "VALIDADO"),
          });
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Título por tipo de documento ─────────────────────────────────────────
  const getDocTitle = () => {
    switch (docType) {
      case "atestado": return "Atestado Médico";
      case "receita": return "Receita Médica";
      case "cnh": return "Carteira Nacional de Habilitação";
      default: return "Documento";
    }
  };

  // ── Estilos ──────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: "Arial, Helvetica, sans-serif",
      margin: 0,
      padding: 0,
    } as React.CSSProperties,
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
    card: {
      background: "#fff",
      borderRadius: 8,
      padding: "24px 28px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
      maxWidth: 480,
      margin: "40px auto",
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
    modal: {
      position: "fixed" as const,
      inset: 0,
      background: "#525659",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column" as const,
    } as React.CSSProperties,
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
    modalBody: {
      flex: 1,
      background: "#525659",
      overflow: "auto",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "12px 8px",
    } as React.CSSProperties,
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

  // ── Renderizar documento por tipo ─────────────────────────────────────────
  const renderDocument = (hidden = false) => {
    if (!validDoc) return null;
    const style: React.CSSProperties = hidden
      ? { position: "fixed", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }
      : { background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "auto", maxHeight: "calc(100vh - 100px)" };

    switch (docType) {
      case "atestado":
        return (
          <div style={style}>
            <AttestationDocument
              ref={attestationRef}
              data={validDoc}
              logoLeft={validDoc.logoUrl}
              logoRight={validDoc.logoRight}
              signatureColor={validDoc.signatureColor}
            />
          </div>
        );
      case "receita":
        return (
          <div style={style}>
            <PrescricaoDocument
              data={{
                ...validDoc,
                tipo_receituario: validDoc.tipo_receituario || "simples",
              }}
            />
          </div>
        );
      case "cnh":
        return (
          <div style={hidden ? { position: "fixed", left: -9999, top: 0, visibility: "hidden" } : { display: "flex", justifyContent: "center", padding: 12 }}>
            <CNHDocument
              ref={cnhRef}
              fotoUrl={validDoc.fotoUrl || validDoc.foto}
              assinaturaUrl={validDoc.assinaturaUrl || validDoc.assinatura}
              qrCodeUrl={`https://carteira-digital-transito-vio.digital/verificar/${validDoc.codigoQR || ""}`}
              blurQR={false}
              {...validDoc}
            />
          </div>
        );
      default:
        // Fallback genérico: exibir dados em tabela
        return (
          <div style={{ ...style, padding: 24, maxWidth: 600 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#111" }}>Documento Validado</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {Object.entries(validDoc).filter(([k]) => !["id", "tipo"].includes(k)).map(([key, val]) => (
                  <tr key={key} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</td>
                    <td style={{ padding: "8px 12px", color: "#111" }}>{String(val || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div style={S.page}>
      {/* ── Header azul ── */}
      <div style={S.header}>
        <span style={{ fontSize: 16 }}>&#128737;</span>
        <span style={S.headerText}>Validador Oficial</span>
      </div>

      {/* ── Card central ── */}
      <div style={{ padding: "0 16px" }}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Consultar Documento</h2>

          <label style={S.label}>Código de Autenticação</label>
          <input
            style={S.input}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />

          <label style={S.label}>Data de Emissão (DD/MM/AAAA)</label>
          <input
            type="text"
            style={S.inputDate}
            value={dataEmissao}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, "");
              if (val.length >= 2) val = val.slice(0, 2) + "/" + val.slice(2);
              if (val.length >= 5) val = val.slice(0, 5) + "/" + val.slice(5, 9);
              setDataEmissao(val);
            }}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />

          <button
            style={{ ...S.btnGreen, opacity: isValidating ? 0.7 : 1 }}
            onClick={() => handleValidate()}
            disabled={isValidating}
          >
            {isValidating ? "Verificando..." : "VALIDAR DOCUMENTO"}
          </button>

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

          {errorMessage && (
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 6, color: "#dc2626", fontSize: 13, fontWeight: 600,
            }}>
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* ── Documento oculto para geração de PDF/JPEG ── */}
      {showViewer && validDoc && renderDocument(true)}

      {/* ── Modal Fullscreen ── */}
      {showViewer && validDoc && (
        <div style={S.modal}>
          {/* Header */}
          <div style={S.modalHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>
                VÁLIDO E AUTÊNTICO
              </span>
              <span style={{ color: "#6b7280", fontSize: 12 }}>({getDocTitle()})</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 700, color: "#111", fontSize: 13 }}>
                {validDoc.paciente || validDoc.nome || "—"}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={S.modalBody}>
            {docType === "cnh" && pdfBlobUrl ? (
              // CNH: exibir imagem JPEG
              <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
                <img
                  src={pdfBlobUrl}
                  alt="CNH Digital Validada"
                  style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: 4, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
                />
              </div>
            ) : (
              // Atestado/Receita: renderizar documento diretamente com escala responsiva
              <div style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                overflow: "auto",
                padding: "12px 8px",
              }}>
                <div style={{
                  width: "min(794px, 100vw - 16px)",
                  transformOrigin: "top center",
                  transform: typeof window !== "undefined" && window.innerWidth < 794
                    ? `scale(${(window.innerWidth - 16) / 794})`
                    : "scale(1)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}>
                  {renderDocument(false)}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={S.modalFooter}>
            <button
              style={{ ...S.btnGray, width: "auto", padding: "10px 20px", marginBottom: 0 }}
              onClick={handleClose}
            >
              FECHAR
            </button>
            <button
              style={{ ...S.btnBlue, flex: 1, opacity: isDownloading ? 0.7 : 1, padding: "10px 20px" }}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Gerando..." : docType === "cnh" ? "BAIXAR JPEG" : "BAIXAR PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
