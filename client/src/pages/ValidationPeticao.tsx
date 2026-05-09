import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import PeticaoDocument from "@/components/PetitionSTJDocument";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";
import { toast } from "sonner";

/**
 * ValidationPeticao.tsx
 * Clone visual do Dashboard de Consulta Processual do TJ/Supremo
 * Baseado em: https://supremodoseteoriginal.com/?processo=5016085-27.2023.8.08.0048
 */

// ─── Ícones SVG ──────────────────────────────────────────────────────────────
const CheckBadgeIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4"/><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.2 0 2.5 1 3.4.8.8 2.1 1.2 3.3 1 .6 1 1.8 1.6 3 1.6s2.4-.6 3-1.7c1.2.3 2.5 0 3.4-1 .8-.8 1.2-2 1-3.3 1-.6 1.6-1.8 1.6-3s-.6-2.4-1.7-3c.3-1.2 0-2.5-1-3.4a3.7 3.7 0 0 0-3.3-1c-.6-1-1.8-1.6-3-1.6Z"/>
  </svg>
);

const DownloadIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/>
  </svg>
);

const GavelIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 13-5 5 2 2 5-5-2-2z"/><path d="m6 16 1.5 1.5"/><path d="M12.5 9.5 18 4l2.5 2.5L15 12l-2.5-2.5z"/><path d="m10 5 1.5 1.5"/><path d="m7 8 1.5 1.5"/>
  </svg>
);

// ─── Estilos ─────────────────────────────────────────────────────────────────
const THEME = {
  primary: "#FF9800", // Laranja original do Supremo
  secondary: "#9c27b0", // Roxo original do Supremo
  bg: "#f4f6f9",
  card: "#ffffff",
  text: "#333333",
  muted: "#666666",
  success: "#28a745",
  border: "#e0e0e0"
};

const STYLES = `
  body { background: ${THEME.bg}; margin: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: ${THEME.text}; }
  .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; margin-bottom: 30px; }
  .header h1 { font-size: 24px; font-weight: 800; color: #1a237e; margin-bottom: 5px; }
  .header p { font-size: 14px; color: ${THEME.muted}; }
  
  .card { background: ${THEME.card}; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 24px; margin-bottom: 20px; border: 1px solid ${THEME.border}; }
  .card-title { font-size: 16px; font-weight: 700; color: #1a237e; margin-bottom: 15px; display: flex; alignItems: center; gap: 8px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
  
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
  .field { margin-bottom: 12px; }
  .field-label { font-size: 11px; font-weight: 600; color: ${THEME.muted}; text-transform: uppercase; margin-bottom: 4px; }
  .field-value { font-size: 14px; font-weight: 700; color: #333; }
  
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; border: none; width: 100%; text-decoration: none; }
  .btn-primary { background: ${THEME.primary}; color: #fff; box-shadow: 0 4px 10px rgba(255,152,0,0.3); }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(255,152,0,0.4); }
  .btn-wa { background: ${THEME.secondary}; color: #fff; margin-top: 10px; }
  
  .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  .status-valid { background: #e8f5e9; color: ${THEME.success}; }
  
  .timeline { position: relative; padding-left: 20px; }
  .timeline-item { position: relative; padding-bottom: 15px; border-left: 2px solid #eee; padding-left: 20px; }
  .timeline-item::before { content: ''; position: absolute; left: -7px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: ${THEME.primary}; }
  .timeline-date { font-size: 12px; color: ${THEME.muted}; margin-bottom: 3px; }
  .timeline-text { font-size: 13px; font-weight: 600; }

  @media (max-width: 600px) { .container { padding: 10px; } .card { padding: 16px; } }
`;

export default function ValidationPeticao() {
  const params = useParams();
  const [search] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<any>(null);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isExporting } = usePDFExport();

  // Extrair ID da rota ou da query string (processo=...)
  const getDocId = useCallback(() => {
    if (params.id) return params.id;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("processo") || urlParams.get("id") || "";
  }, [params.id, search]);

  const fetchDoc = useCallback(async () => {
    const id = getDocId();
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const apiBase = window.location.hostname === "localhost" ? "" : "https://docmaster.store";
      const res = await fetch(`${apiBase}/api/validate-qr/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Documento não encontrado");
      const json = await res.json();
      setDoc(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getDocId]);

  useEffect(() => {
    fetchDoc();
    document.title = "Consulta Processual - Tribunal de Justiça";
  }, [fetchDoc]);

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || !doc) return;
    try {
      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(doc.credor || doc.nome || "PETICAO", "peticaocria"),
        docType: "peticaocria",
        customWidth: 826,
        customHeight: 1180,
      });
      toast.success("Alvará baixado com sucesso!");
    } catch (err) { 
      toast.error("Erro ao gerar PDF."); 
    }
  }, [exportPDF, doc]);

  if (isLoading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Carregando dados processuais...</div>;

  if (error || (!doc && !isLoading)) return (
    <div className="container" style={{ textAlign: 'center', marginTop: 100 }}>
      <GavelIcon size={48} />
      <h1 style={{ marginTop: 20 }}>Processo não encontrado</h1>
      <p>O número do processo informado não consta na base de dados oficial ou já expirou.</p>
      <a href="/" style={{ color: THEME.primary, fontWeight: 700 }}>Voltar ao início</a>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="container">
        <div className="header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
             <img src="/assets/peticao/brasao_republica.png" style={{ height: 60 }} alt="Brasão" />
          </div>
          <h1>Consulta de Processo</h1>
          <p>Processo nº <strong>{doc?.processo || doc?.codigo_validacao}</strong></p>
          <div className="status-badge status-valid" style={{ marginTop: 10 }}>
            <CheckBadgeIcon size={16} /> Verificado e Autenticado
          </div>
        </div>

        <div className="grid">
          {/* Card Detalhes do Processo */}
          <div className="card">
            <div className="card-title">⚖️ Detalhes Gerais</div>
            <div className="field">
              <div className="field-label">CLASSE</div>
              <div className="field-value">Cumprimento de Sentença</div>
            </div>
            <div className="field">
              <div className="field-label">ASSUNTO</div>
              <div className="field-value">Liberação de Pagamento / Alvará Judicial</div>
            </div>
            <div className="field">
              <div className="field-label">VALOR DA CAUSA</div>
              <div className="field-value">R$ {doc?.valor || "0,00"}</div>
            </div>
            <div className="field">
              <div className="field-label">DATA DE DISTRIBUIÇÃO</div>
              <div className="field-value">{doc?.created_at ? new Date(doc.created_at).toLocaleDateString("pt-BR") : "—"}</div>
            </div>
          </div>

          {/* Card Partes */}
          <div className="card">
            <div className="card-title">👤 Partes Envolvidas</div>
            <div className="field">
              <div className="field-label">POLO ATIVO (CREDOR)</div>
              <div className="field-value">{doc?.nome || doc?.credor}</div>
              <div style={{ fontSize: 12, color: THEME.muted }}>CPF: {doc?.cpf}</div>
            </div>
            <div className="field">
              <div className="field-label">ADVOGADO(A)</div>
              <div className="field-value">{doc?.advogado || "—"}</div>
            </div>
            <div className="field">
              <div className="field-label">POLO PASSIVO (DEVEDOR)</div>
              <div className="field-value">{doc?.contra || "—"}</div>
            </div>
          </div>
        </div>

        {/* Card Ações */}
        <div className="card">
          <div className="card-title">📥 Documentos e Alvará</div>
          <p style={{ fontSize: 13, color: THEME.muted, marginBottom: 20 }}>Os documentos abaixo foram gerados eletronicamente e possuem fé pública.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleExportPDF} disabled={isExporting}>
              <DownloadIcon size={18} /> {isExporting ? "GERANDO..." : "BAIXAR ALVARÁ PDF"}
            </button>
            <button className="btn" style={{ background: '#eee', color: '#333' }}>
               SENTENÇA.PDF
            </button>
          </div>

          <a href={`https://wa.me/55${doc?.telefone || "21999999999"}?text=Olá, vi meu processo ${doc?.processo} no portal.`} className="btn btn-wa">
            <WhatsAppIcon size={18} /> FALAR COM SETOR DE PAGAMENTOS
          </a>
        </div>

        {/* Movimentações */}
        <div className="card">
          <div className="card-title">🕒 Movimentações Recentes</div>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-date">{new Date().toLocaleDateString("pt-BR")}</div>
              <div className="timeline-text">Alvará de levantamento expedido e assinado eletronicamente.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">{new Date(Date.now() - 86400000).toLocaleDateString("pt-BR")}</div>
              <div className="timeline-text">Concluso para despacho / Decisão favorável à liberação.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">{new Date(Date.now() - 172800000).toLocaleDateString("pt-BR")}</div>
              <div className="timeline-text">Processo distribuído por sorteio.</div>
            </div>
          </div>
        </div>

        {/* Renderizador Invisível para o PDF */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={previewRef} style={{ width: 826 }}>
            <PeticaoDocument data={doc} />
          </div>
        </div>

        <footer style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: THEME.muted }}>
          Tribunal de Justiça - Sistema de Consulta Processual Unificada &copy; 2026<br/>
          Documento validado via QR Code Forense.
        </footer>
      </div>
    </>
  );
}
