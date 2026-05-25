import { forwardRef } from "react";
import Barcode from "react-barcode";

interface PetitionData {
  id: string;
  processo: string;
  credor: string;
  cpf_cnpj: string;
  advogado: string;
  contra: string;
  valor: string;
  data: string;
  alvara_numero?: string;
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

const DOC_WIDTH_PX = 794;  // Padronizado A4 (96 DPI)
const DOC_HEIGHT_PX = 1123; // Padronizado A4 (96 DPI)

const DPI_TARGET = 300;
const EXPORT_SCALE = 2.0; // Proporção padrão para A4 1:1

// Constantes de conversão ABNT expandidas para zona de respiro técnica
const MARGIN_TOP = 170.0;    
const MARGIN_LEFT = 129.4;
const MARGIN_LEFT_BODY = 97.3;
const MARGIN_RIGHT = 116.1;   
const MARGIN_BOTTOM = 86.6;

const PeticaoDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    // Estilo base para os textos (REDUZIDO 3% ≈ 12.64pt)
    const textStyle: React.CSSProperties = {
      position: "absolute",
      fontFamily: "Arial, sans-serif",
      color: "#000",
      fontSize: "12.64pt",
      whiteSpace: "nowrap",
      zIndex: 10
    };

    const labelStyle: React.CSSProperties = {
      fontWeight: 400,
      marginRight: 5,
      fontFamily: "Arial, sans-serif"
    };

    const valueStyle: React.CSSProperties = {
      fontWeight: 400,
      fontFamily: "Arial, sans-serif"
    };

    const formatLongDate = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('/')) return "2 de maio de 2026";
      const parts = dateStr.split('/');
      if (parts.length !== 3) return dateStr;
      const [d, m, y] = parts.map(Number);
      const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
      return `${d} de ${months[m - 1]} de ${y < 2026 ? 2026 : y}`;
    };

    const getYear = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('/')) return "2026";
      const parts = dateStr.split('/');
      return parts[2] || "2026";
    };

    const alvara_final = `${data.alvara_numero || "0000000"}/${getYear(data.data)}`;

    return (
      <div
        ref={ref}
        id="attestation-document"
        style={{
          width: DOC_WIDTH_PX,
          height: DOC_HEIGHT_PX,
          backgroundColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "0"
        }}
      >
        {/* ─── Layer de Fundo: Marca d'Água (REDUZIDO 2% E SUBIDO 1%) ─── */}
        <div style={{
          position: "absolute",
          top: "49%",
          left: "50%",
          transform: "translate(-50%, -41.3%)", 
          width: "489.8pt",
          zIndex: 1,
          pointerEvents: "none"
        }}>
          <img src="/assets/peticao/background_logo.png" style={{ width: "100%" }} alt="Watermark" />
        </div>

        {/* ─── Cabeçalho Superior Centralizado (Subido 1 linha) ─── */}
        <div style={{ position: "absolute", top: MARGIN_TOP - 158, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 11, fontFamily: "'Liberation Sans', Helvetica" }}>
           <img src="/assets/peticao/brasao_republica.png" style={{ width: "99.3pt", marginBottom: "4pt", display: "inline-block" }} alt="Brasão" />

           <div style={{ color: "#222222", fontSize: "10.1pt", fontWeight: 700, letterSpacing: "0.5px", margin: 0, padding: 0, lineHeight: "1" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ marginTop: "22.4px" }}>
             <div style={{ color: "#222222", fontSize: "8.4pt", fontWeight: 400, margin: 0, padding: 0, lineHeight: "1" }}>ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: {alvara_final}</div>
             <div style={{ color: "#222222", fontSize: "8.4pt", fontWeight: 400, margin: 0, padding: 0, lineHeight: "1" }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
           </div>
        </div>

        {/* Logo OAB (Diminuído 5% adicional ≈ 93.2pt) */}
        <div style={{ position: "absolute", top: "-26px", left: "4pt", zIndex: 11 }}>
           <img src="/assets/peticao/oab_logo.png" style={{ width: "93.2pt" }} alt="OAB" />
        </div>

        {/* Título do Documento (SUBIDO 1% E ESPAÇAMENTO +1mm) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 68, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 10, fontFamily: "'Liberation Sans', Helvetica" }}>
           <div style={{ fontSize: "16.2pt", fontWeight: 700, color: "#000", transform: "scaleX(0.97) scaleY(0.97)", transformOrigin: "center" }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "13.06pt", fontWeight: 400, marginTop: -13, color: "#000" }}>Processo Judiciário</div>
        </div>

        {/* ─── Corpo da Petição ─── */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 114.7, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Credor:</span>
          <span style={valueStyle}>{data.credor?.toUpperCase() || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 135.7, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>CPF/CNPJ:</span>
          <span style={valueStyle}>{data.cpf_cnpj || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 156.7, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Advogado(a):</span>
          <span style={valueStyle}>{data.advogado?.toUpperCase() || ""}</span>
        </div>

        {/* Processo N° (Subido 2% ≈ -22px) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 246.8, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Processo N°:</span>
          <span style={valueStyle}>{data.processo || ""}</span>
        </div>

        {/* Cumprimento de Sentença (Subido 1 linha) */}
        <div style={{ 
          ...textStyle, 
          top: MARGIN_TOP + 328.8, 
          left: MARGIN_LEFT_BODY, 
          borderBottom: "1px solid #000", 
          paddingBottom: "3.78px", 
          display: "inline-block", 
          paddingRight: 130,
          fontSize: "13.03pt" 
        }}>
          <span style={labelStyle}>CUMPRIMENTO DE SENTENÇA CONTRA:</span>
          <span style={valueStyle}>{data.contra?.toUpperCase() || ""}</span>
        </div>

        {/* Bloco de Decisão (Subido 1 linha) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 385.8, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Assunto:</span>
          <span style={valueStyle}>Decisão Favorável</span>
        </div>
        <div style={{ ...textStyle, top: MARGIN_TOP + 410.8, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Situação:</span>
          <span style={{ ...valueStyle, color: "#000" }}>AUTORIZADO</span>
        </div>

        {/* Código de Barras Dinâmico (Subido 1 linha) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 455.2, left: MARGIN_LEFT_BODY + 4, zIndex: 11 }}>
           <Barcode
             value={alvara_final}
             width={1.4}
             height={40.2}
             displayValue={false}
             margin={0}
             background="transparent"
           />
        </div>

        {/* Valor de Repasse (REDUZIDO 2% ≈ 12.77pt E DESCIDO 1% ≈ +11px) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 534.6, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap", fontSize: "12.77pt" }}>
          Valor a receber: <span style={valueStyle}>R$ {data.valor ? data.valor.replace(/^R\$\s?/, "") : ""}</span> será depositado em conta corrente de sua titularidade..    
        </div>

        {/* Texto Legal (REDUZIDO 4% ≈ 12.29pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 617.4, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap", textAlign: "justify", lineHeight: "1.5", fontSize: "12.29pt", fontFamily: "Arial, sans-serif" }}>
          Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e <br/>
          posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.
        </div>

        {/* Data (REDUZIDO 3% ≈ 13.31pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 697.4, left: MARGIN_LEFT_BODY, fontFamily: "Arial, sans-serif", fontSize: "13.31pt" }}>
          {formatLongDate(data.data)}.
        </div>

        {/* ─── Rodapé (SUBIDO +1% adicional ≈ +11.2px) ─── */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM + 47.0, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "10.8pt", fontFamily: "Arial, sans-serif" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 400, letterSpacing: "1px", color: "#374151", marginBottom: 2 }}>PODER JUDICIÁRIO</div>
           <div style={{ fontStyle: "italic", color: "#374151", fontSize: "11.8pt", marginLeft: "4.2px" }}>TJ – Tribunal de Justiça.</div>  
        </div>

        {/* Assinatura Judicial (DIMINUIDA 5% E DESCIDA 2%) */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM - 74.2, left: "50%", transform: "translateX(-50%)", width: "100%", textAlign: "center" }}>
           <img
             src={data.signatureImage || "/assets/peticao/assinatura_juiz.png"}
             style={{
               height: 108,
               zIndex: 12,
               pointerEvents: "none",
               margin: "0 auto",
               display: "block"
             }}
             alt="Assinatura Judicial"
           />
        </div>

        {/* QR CODE (CANTO INFERIOR ESQUERDO - REDUZIDO 2% ADICIONAL) */}
        <div style={{ position: "absolute", bottom: "25px", left: "25px", zIndex: 12 }}>
           <img src="/assets/peticao/qr_code_peticao.png" style={{ width: "81px" }} alt="QR Code" />
        </div>

        {/* COD DE BARRAS 2 (VERTICAL DIREITA - DESCIDO 2% ≈ -23px bottom) */}
        <div style={{ 
          position: "absolute", 
          bottom: "67px", 
          right: "16px", 
          zIndex: 12 
        }}>
           <img 
             src="/assets/peticao/cod_barras_vertical.png" 
             style={{ height: "171px", width: "auto", display: "block" }} 
             alt="Vertical Barcode" 
           />
        </div>

        {/* Marca d'água de Preview */}
        {(!data.id || data.id === "XXXX.XXXX") && (
          <div className="preview-watermark" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 54,
            fontWeight: 900,
            color: "rgba(220, 38, 38, 0.12)",
            zIndex: 99,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            border: "10px solid rgba(220, 38, 38, 0.12)",
            padding: "20px 40px",
            borderRadius: 20
          }}>
            DOCUMENTO INVÁLIDO - PRÉVIA
          </div>
        )}

        <style>{`
          @media print {
            .preview-watermark { display: none !important; }
          }
        `}</style>
      </div>
    );
  }
);

PeticaoDocument.displayName = "PeticaoDocument";

export default PeticaoDocument;
export type { PetitionData };
