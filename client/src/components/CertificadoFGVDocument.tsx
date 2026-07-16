import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface CertificadoFGVData {
  id?: string;
  codigo_validacao?: string;
  nome_aluno: string;
  curso: string;
  data_emissao: string;
  carga_horaria: string;
  codigo_autenticidade: string;
  matricula?: string;
  turma?: string;
  ementa?: string;
  competencias?: string;
  requisitos?: string;
  signature_image?: string;
  diretora_nome?: string;
  diretora_cargo?: string;
  diretora_instituicao?: string;
  url_validacao?: string;
}

interface CertificadoFGVDocumentProps {
  data: CertificadoFGVData;
  isPreview?: boolean;
}

const PAGE_WIDTH_PX = 1123; // A4 Landscape
const PAGE_HEIGHT_PX = 794;

const CertificadoFGVDocument = forwardRef<HTMLDivElement, CertificadoFGVDocumentProps>(
  ({ data, isPreview = false }, ref) => {
    // Default values if fields are empty
    const nomeAluno = data.nome_aluno || "Stela Teles da Silva";
    const cursoNome = data.curso || "Liderança e Gestão de Equipes";
    const dataEmissao = data.data_emissao || "18/12/2024";
    const cargaHoraria = data.carga_horaria || "30 horas-aula";
    const codigoAutenticidade = data.codigo_autenticidade || "857019448";
    const diretoraNome = data.diretora_nome || "Mary Kimiko Guimarães Murashima";
    const diretoraCargo = data.diretora_cargo || "Diretora Executiva - DGA";
    const diretoraInst = data.diretora_instituicao || "Instituto de Desenvolvimento Educacional - IDE";
    
    // Construct validation URL based on the validation token
    const validationToken = (data.codigo_validacao || data.id || codigoAutenticidade).toLowerCase();
    const validationUrl = data.url_validacao || `https://brasilopenbadge.pages.dev/pages/badge/${validationToken}`;

    return (
      <div
        ref={ref}
        id="fgv-certificate-document"
        style={{
          width: PAGE_WIDTH_PX,
          height: PAGE_HEIGHT_PX,
          backgroundColor: "#ffffff",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          fontFamily: "'Outfit', 'Inter', 'Helvetica Neue', sans-serif",
          color: "#000000",
        }}
      >
        {/* Marca d'água de prévia se for visualização antes de emitir */}
        {isPreview && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99,
              pointerEvents: "none",
              transform: "rotate(-30deg)",
            }}
          >
            <span
              style={{
                fontSize: "54px",
                fontWeight: 900,
                color: "rgba(220, 38, 38, 0.15)",
                border: "8px solid rgba(220, 38, 38, 0.15)",
                padding: "16px 32px",
                borderRadius: "16px",
                textTransform: "uppercase",
                letterSpacing: "4px",
              }}
            >
              DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA
            </span>
          </div>
        )}

        {/* ── 1. Borda Ondulada Esquerda (SVG) ── */}
        <div style={{ position: "absolute", top: 0, left: 0, height: PAGE_HEIGHT_PX, width: 220, zIndex: 1 }}>
          <svg width="220" height="794" viewBox="0 0 220 794" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Onda Azul Escura principal */}
            <path
              d="M0 0 H140 C110 160, 40 300, 40 397 C40 494, 90 610, 110 794 H0 V0Z"
              fill="#002d62"
            />
            {/* Detalhe Azul Ciano */}
            <path
              d="M140 0 C110 160, 40 300, 40 397 C40 494, 90 610, 110 794"
              stroke="#00b5e2"
              strokeWidth="6"
              opacity="0.8"
            />
            {/* Detalhe Azul Médio */}
            <path
              d="M130 0 C102 160, 35 300, 35 397 C35 494, 82 610, 100 794"
              stroke="#0054a6"
              strokeWidth="3"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* ── 2. Logotipo FGV (Top Right) ── */}
        <div style={{ position: "absolute", top: 60, right: 80, zIndex: 2 }}>
          <img
            src="/assets/fgv_logo.png"
            alt="FGV"
            style={{ height: 46 }}
            crossOrigin={undefined}
          />
        </div>

        {/* ── 3. Conteúdo Principal do Certificado ── */}
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 200,
            width: 740,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: 15,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: "14.5pt", color: "#4A5568", fontWeight: 400, letterSpacing: "-0.2px" }}>
            O Instituto de Desenvolvimento Educacional da Fundação Getulio Vargas confere a
          </div>

          {/* Nome do Aluno */}
          <div
            style={{
              fontSize: "30pt",
              fontWeight: 700,
              color: "#1A202C",
              margin: "5px 0",
              letterSpacing: "-0.5px",
            }}
          >
            {nomeAluno}
          </div>

          <div style={{ fontSize: "12.5pt", color: "#4A5568", fontWeight: 500 }}>
            O Certificado do Curso
          </div>

          {/* Nome do Curso */}
          <div
            style={{
              fontSize: "22pt",
              fontWeight: 700,
              color: "#1A202C",
              lineHeight: "1.2",
              letterSpacing: "-0.3px",
            }}
          >
            {cursoNome}
          </div>

          <div style={{ fontSize: "12.5pt", color: "#4A5568", fontWeight: 400, marginTop: 4 }}>
            Nível atualização oferecido pelo Programa FGV Educação Executiva.
          </div>

          {/* Data de Emissão e Carga Horária */}
          <div
            style={{
              display: "flex",
              gap: 80,
              fontSize: "12.5pt",
              color: "#1A202C",
              fontWeight: 500,
              marginTop: 15,
            }}
          >
            <div>
              <span style={{ fontWeight: 400, color: "#4A5568" }}>Data de Emissão:</span> {dataEmissao}
            </div>
            <div>
              <span style={{ fontWeight: 400, color: "#4A5568" }}>Carga horária:</span> {cargaHoraria}
            </div>
          </div>

          {/* Matrícula e Turma */}
          {(data.matricula || data.turma) && (
            <div
              style={{
                display: "flex",
                gap: 80,
                fontSize: "12.5pt",
                color: "#1A202C",
                fontWeight: 500,
                marginTop: 5,
              }}
            >
              {data.matricula && (
                <div>
                  <span style={{ fontWeight: 400, color: "#4A5568" }}>Matrícula:</span> {data.matricula}
                </div>
              )}
              {data.turma && (
                <div>
                  <span style={{ fontWeight: 400, color: "#4A5568" }}>Turma:</span> {data.turma}
                </div>
              )}
            </div>
          )}

          {/* Código de Autenticidade */}
          <div style={{ fontSize: "12.5pt", color: "#1A202C", fontWeight: 500, marginTop: 5 }}>
            <span style={{ fontWeight: 400, color: "#4A5568" }}>Código de Autenticidade:</span> {codigoAutenticidade}
          </div>
        </div>

        {/* ── 4. Rodapé: Assinatura e QR Code ── */}
        {/* Assinatura (Bottom Center) */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 360,
            width: 420,
            textAlign: "center",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={data.signature_image || "/assets/fgv_assinatura.png"}
            alt="Assinatura"
            style={{ height: 60, marginBottom: 4, mixBlendMode: "multiply" }}
            crossOrigin={undefined}
          />
          
          {/* Linha da assinatura */}
          <div style={{ width: 280, height: 1, backgroundColor: "#A0AEC0", margin: "4px 0" }} />
          
          <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#2D3748" }}>
            {diretoraNome}
          </div>
          <div style={{ fontSize: "8.5pt", color: "#718096", fontWeight: 500 }}>
            {diretoraCargo}
          </div>
          <div style={{ fontSize: "8.5pt", color: "#718096", fontWeight: 500 }}>
            {diretoraInst}
          </div>
        </div>

        {/* QR Code de Autenticidade (Bottom Right) */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 80,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              padding: 6,
              backgroundColor: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
            }}
          >
            <QRCodeSVG value={validationUrl} size={110} />
          </div>
          <div style={{ fontSize: "6.5pt", color: "#718096", fontWeight: 700, textTransform: "uppercase" }}>
            QR Code de Autenticidade
          </div>
        </div>
      </div>
    );
  }
);

CertificadoFGVDocument.displayName = "CertificadoFGVDocument";
export default CertificadoFGVDocument;
