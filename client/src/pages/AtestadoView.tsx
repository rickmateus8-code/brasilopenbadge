import { useLocation, useParams } from "wouter";
import AttestationDocument from "@/components/AttestationDocument";
import { useRef, useState, useEffect } from "react";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import type { AttestationData } from "@/data/attestations";

export default function AtestadoView() {
  const params = useParams();
  const id = params?.id as string;
  const [, navigate] = useLocation();
  const documentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setIsLoading(false); return; }
    fetch(`/api/attestations/${encodeURIComponent(id)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setAttestation(data as AttestationData);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!documentRef.current || !attestation) return;
    setIsDownloading(true);
    try {
      await exportElementToPDF(documentRef.current, {
        filename: generatePDFFilename(attestation.paciente, "EMITIDO"),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const btnBlue: React.CSSProperties = {
    background: "#005CA9", color: "#fff", border: "none",
    padding: "8px 18px", borderRadius: 7, fontSize: 13,
    fontWeight: 700, cursor: "pointer",
  };
  const btnGray: React.CSSProperties = {
    background: "#e2e8f0", color: "#374151", border: "none",
    padding: "8px 18px", borderRadius: 7, fontSize: 13,
    fontWeight: 700, cursor: "pointer",
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial" }}>
        <p style={{ color: "#6b7280", fontSize: 16 }}>Carregando atestado...</p>
      </div>
    );
  }

  if (notFound || !attestation) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial", gap: 16 }}>
        <div style={{ fontSize: 48 }}>❌</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>Atestado não encontrado</h2>
        <p style={{ color: "#6b7280" }}>O atestado solicitado não existe ou foi removido.</p>
        <button style={btnBlue} onClick={() => navigate("/historico/atestados")}>← Voltar ao Histórico</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", fontFamily: "Arial" }}>
      {/* Header */}
      <div style={{ background: "#005CA9", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => navigate("/historico/atestados")}>← VOLTAR</button>
          <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>DocMaster — VISUALIZAR ATESTADO</h1>
        </div>
        <button style={btnBlue} onClick={handleDownloadPdf} disabled={isDownloading}>
          {isDownloading ? "⏳ Gerando PDF..." : "⬇ BAIXAR PDF"}
        </button>
      </div>

      {/* Preview */}
      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#525659", borderRadius: 10, padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <AttestationDocument
            ref={documentRef}
            data={attestation}
            logoLeft={attestation.logoUrl}
            logoRight={attestation.logoRight}
            signatureColor={attestation.signatureColor}
          />
        </div>
      </div>
    </div>
  );
}
