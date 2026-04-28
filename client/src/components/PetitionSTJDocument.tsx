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
        <div style={{ position: "absolute", inset: 0, zIndex: 2, padding: "80px 70px" }}>
          
          {/* Endereçamento */}
          <div id="preview-header" style={{ 
            marginTop: 60, 
            fontSize: 14, 
            fontWeight: 700, 
            textAlign: "left", 
            textTransform: "uppercase",
            lineHeight: 1.6,
            width: "100%",
            maxWidth: 500
          }}>
            {data.enderecamento || "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ____ VARA CÍVEL DA COMARCA DE ______________"}
          </div>

          {/* Processo */}
          <div style={{ marginTop: 80, fontSize: 13, fontWeight: 700 }}>
            Processo nº: {data.processo || "____________________"}
          </div>

          {/* Qualificação */}
          <div id="preview-patient" style={{ marginTop: 60, fontSize: 13, textAlign: "justify", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700 }}>{data.requerente || "NOME DO REQUERENTE"}</span>, já qualificado nos autos do processo em epígrafe, que move em face de <span style={{ fontWeight: 700 }}>{data.requerido || "NOME DO REQUERIDO"}</span>, vem, respeitosamente, à presença de Vossa Excelência, por intermédio de seu advogado, expor e requerer o que segue:
          </div>

          {/* Corpo da Petição */}
          <div id="preview-body" style={{ 
            marginTop: 30, 
            fontSize: 13, 
            textAlign: "justify", 
            lineHeight: 1.8, 
            whiteSpace: "pre-wrap",
            minHeight: 350 
          }}>
            {data.corpo || "Digite aqui o conteúdo da sua petição..."}
          </div>

          {/* Fecho e Data */}
          <div id="preview-footer" style={{ marginTop: 50, textAlign: "right", fontSize: 13 }}>
            {data.cidade || "Cidade"}, {data.data || "Data"}
          </div>

          {/* Assinatura */}
          <div style={{ marginTop: 80, textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #000", width: 300, margin: "0 auto", paddingTop: 5 }}>
              <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>{data.advogado || "Nome do Advogado"}</div>
              <div style={{ fontSize: 13 }}>OAB/{data.oab || "00.000"}</div>
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
