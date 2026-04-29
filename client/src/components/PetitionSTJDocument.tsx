import { forwardRef } from "react";

interface PetitionData {
  id: string;
  enderecamento: string;
  processo: string;
  requerente: string;
  requerido: string;
  corpo: string;
  cidade: string;
  data: string;
  advogado: string;
  oab: string;
  logoUrl?: string;
  logoRight?: string;
  signatureImage?: string;
  logoLeftScale?: number;
  logoRightScale?: number;
  logoLeftX?: number;
  logoLeftY?: number;
  logoRightX?: number;
  logoRightY?: number;
  [key: string]: any;
}

interface PetitionSTJDocumentProps {
  data: PetitionData;
}

const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;

const PetitionSTJDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        id="attestation-document"
        style={{
          width: DOC_WIDTH_PX,
          height: DOC_HEIGHT_PX,
          backgroundColor: "#ffffff",
          position: "relative",
          fontFamily: "'Times New Roman', Times, serif",
          color: "#000",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "0"
        }}
      >
        {/* Layer de Fundo (Asset Original) */}
        <img 
          src="/assets/peticao_bg.png" 
          alt="Layout Base" 
          style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            zIndex: 1,
            pointerEvents: "none"
          }} 
        />

        {/* Layer de Dados Dinâmicos */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2, padding: "80px 85px" }}>
          
          {/* Logos */}
          <div style={{ position: "absolute", top: 40, left: 85, zIndex: 3 }}>
            {data.logoUrl && (
              <img 
                src={data.logoUrl} 
                alt="Logo Esquerda" 
                style={{ 
                  height: 60,
                  transform: `scale(${data.logoLeftScale || 1}) translate(${data.logoLeftX || 0}px, ${data.logoLeftY || 0}px)`,
                  transformOrigin: "center",
                  objectFit: "contain"
                }} 
              />
            )}
          </div>
          <div style={{ position: "absolute", top: 40, right: 85, zIndex: 3 }}>
            {data.logoRight && (
              <img 
                src={data.logoRight} 
                alt="Logo Direita" 
                style={{ 
                  height: 60,
                  transform: `scale(${data.logoRightScale || 1}) translate(${data.logoRightX || 0}px, ${data.logoRightY || 0}px)`,
                  transformOrigin: "center",
                  objectFit: "contain"
                }} 
              />
            )}
          </div>

          {/* Endereçamento */}
          <div id="preview-header" style={{ 
            marginTop: 40, 
            fontSize: 12, 
            fontWeight: 700, 
            textAlign: "left", 
            textTransform: "uppercase",
            lineHeight: 1.5,
            width: "100%",
            maxWidth: 550,
            color: "#1a1a1a"
          }}>
            {data.enderecamento || "EXCELENTÍSSIMO SENHOR MINISTRO PRESIDENTE DO SUPERIOR TRIBUNAL DE JUSTIÇA"}
          </div>

          {/* Processo */}
          <div style={{ 
            marginTop: 60, 
            fontSize: 12, 
            fontWeight: 700,
            textAlign: "left",
            color: "#1a1a1a"
          }}>
            Processo nº: {data.processo || "____________________"}
          </div>

          {/* Qualificação */}
          <div id="preview-patient" style={{ 
            marginTop: 60, 
            fontSize: 12, 
            textAlign: "justify", 
            lineHeight: 1.6,
            color: "#1a1a1a",
            textIndent: "2cm"
          }}>
            <span style={{ fontWeight: 700 }}>{data.requerente || "NOME DO REQUERENTE"}</span>, já qualificado nos autos do processo em epígrafe, que move em face de <span style={{ fontWeight: 700 }}>{data.requerido || "NOME DO REQUERIDO"}</span>, vem, respeitosamente, à presença de Vossa Excelência, por intermédio de seu advogado, expor e requerer o que segue:
          </div>

          {/* Corpo da Petição */}
          <div id="preview-body" style={{ 
            marginTop: 25, 
            fontSize: 12, 
            textAlign: "justify", 
            lineHeight: 1.8, 
            whiteSpace: "pre-wrap",
            minHeight: 400,
            color: "#1a1a1a",
            textIndent: "2cm"
          }}>
            {data.corpo || "Digite aqui o conteúdo da sua petição..."}
          </div>

          {/* Fecho e Data */}
          <div id="preview-footer" style={{ 
            marginTop: 40, 
            textAlign: "right", 
            fontSize: 12,
            color: "#1a1a1a"
          }}>
            {data.cidade || "Cidade"}, {data.data || "Data"}
          </div>

          {/* Assinatura */}
          <div id="preview-signature" style={{ marginTop: 60, textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", textAlign: "center" }}>
              {data.signatureImage && (
                <img 
                  src={data.signatureImage} 
                  alt="Assinatura" 
                  style={{ 
                    height: 80, 
                    position: "absolute", 
                    bottom: 30, 
                    left: "50%", 
                    transform: "translateX(-50%)",
                    zIndex: 3,
                    pointerEvents: "none"
                  }} 
                />
              )}
              <div style={{ borderTop: "1px solid #000", width: 350, margin: "0 auto", paddingTop: 5 }}>
                <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", color: "#1a1a1a" }}>
                  {data.advogado || "Nome do Advogado"}
                </div>
                <div style={{ fontSize: 12, color: "#1a1a1a" }}>
                  OAB/{data.oab || "00.000"}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Marca d'água de Preview (Se não houver ID real) */}
        {!data.id || data.id === "XXXX.XXXX" ? (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 54,
            fontWeight: 900,
            color: "rgba(220, 38, 38, 0.15)",
            zIndex: 99,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textTransform: "uppercase"
          }}>
            DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA
          </div>
        ) : null}
      </div>
    );
  }
);

PetitionSTJDocument.displayName = "PetitionSTJDocument";

export default PetitionSTJDocument;
export type { PetitionData };
