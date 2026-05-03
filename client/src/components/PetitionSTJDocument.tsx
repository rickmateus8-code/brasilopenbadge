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

const DOC_WIDTH_PX = 826;  // Expandido +1% (818 -> 826)
const DOC_HEIGHT_PX = 1180; // Aumentado em mais 3% (1145 -> 1180)

const DPI_TARGET = 300;
const EXPORT_SCALE = 1.92; // Reajustado para a nova largura de 826px

// Constantes de conversão ABNT expandidas para zona de respiro técnica
const MARGIN_TOP = 170.0;    // Aumentado +3% (135.4 -> 170.0)
const MARGIN_LEFT = 129.4;
const MARGIN_LEFT_BODY = 97.3;
const MARGIN_RIGHT = 116.1;   // Aumentado +2% (99.6 -> 116.1)
const MARGIN_BOTTOM = 86.6;

const PeticaoDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    // Estilo base para os textos (CORPO UNIFICADO - SINCRONIZADO 13.3pt - Aumentado +5% sobre 12.7pt)
    const textStyle: React.CSSProperties = {
      position: "absolute",
      fontFamily: "Arial, sans-serif",
      color: "#000",
      fontSize: "13.3pt",
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
        {/* ─── Layer de Fundo: Marca d'Água ─── */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -40%)",
          width: "500pt",
          zIndex: 1,
          pointerEvents: "none"
        }}>
          <img src="/assets/peticao/background_logo.png" style={{ width: "100%" }} alt="Watermark" />
        </div>

        {/* ─── Cabeçalho Superior Centralizado (Brasão Elevação +5% e Espaçamento +2%) ─── */}
        <div style={{ position: "absolute", top: MARGIN_TOP - 140, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 11, fontFamily: "'Liberation Sans', Helvetica" }}>
           <img src="/assets/peticao/brasao_republica.png" style={{ width: "99.3pt", marginBottom: "4pt", display: "inline-block" }} alt="Brasão" />

           <div style={{ color: "#222222", fontSize: "10.1pt", fontWeight: 400, letterSpacing: "0.5px" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ color: "#222222", fontSize: "8.4pt", fontWeight: 400, marginTop: -3 }}>ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: {alvara_final}</div>
           <div style={{ color: "#222222", fontSize: "8.4pt", fontWeight: 400, marginTop: -3 }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
        </div>

        {/* Logo OAB (TOPO ABSOLUTO E +2% TAMANHO) */}
        <div style={{ position: "absolute", top: "-47px", left: "4pt", zIndex: 11 }}>
           <img src="/assets/peticao/oab_logo.png" style={{ width: "101.1pt" }} alt="OAB" />
        </div>

        {/* Título do Documento (SUBIDO +2 LINHAS ≈ -48px) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 97, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 10, fontFamily: "'Liberation Sans', Helvetica" }}>
           <div style={{ fontSize: "16.2pt", fontWeight: 700, color: "#000", transform: "scaleY(0.97)", transformOrigin: "center" }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "12.8pt", fontWeight: 400, marginTop: -6, color: "#000" }}>Processo Judiciário</div>
        </div>

        {/* ─── Corpo da Petição ─── */}
        {/* Dados Superiores (SUBIDO +1% EXTRA ≈ -11px) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 158.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Credor:</span>
          <span style={valueStyle}>{data.credor?.toUpperCase() || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 179.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>CPF/CNPJ:</span>
          <span style={valueStyle}>{data.cpf_cnpj || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 208.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Advogado(a):</span>
          <span style={valueStyle}>{data.advogado?.toUpperCase() || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 293.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Processo N°:</span>
          <span style={valueStyle}>{data.processo || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 391.2, left: MARGIN_LEFT_BODY, borderBottom: "1px solid #000", paddingBottom: 2, display: "inline-block", paddingRight: 130 }}>
          <span style={labelStyle}>CUMPRIMENTO DE SENTENÇA CONTRA:</span>
          <span style={valueStyle}>{data.contra?.toUpperCase() || ""}</span>
        </div>

        {/* Bloco de Decisão */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 436.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Assunto:</span>
          <span style={valueStyle}>Decisão Favorável</span>
        </div>
        <div style={{ ...textStyle, top: MARGIN_TOP + 461.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Situação:</span>
          <span style={{ ...valueStyle, color: "#000" }}>AUTORIZADO</span>
        </div>

        {/* Código de Barras Dinâmico (AJUSTADO: -10% LARGURA / +5% ALTURA / 2 LINHAS RESPIRO) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 509.2, left: MARGIN_LEFT_BODY - 0.6, zIndex: 11 }}>
           <Barcode
             value={alvara_final}
             width={1.4}
             height={40.2}
             displayValue={false}
             margin={0}
             background="transparent"
           />
        </div>

        {/* Valor de Repasse (Garantindo 2 linhas de respiro inferior do barcode: 509.2 + 40.2 + 48 = 597.4) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 597.4, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap", fontSize: "13.1pt" }}>
          Valor a receber: <span style={valueStyle}>R$ {data.valor || ""}</span> será depositado em conta corrente de sua titularidade..    
        </div>

        {/* Texto Legal / Informativo (Deslocado proporcionalmente) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 659.4, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap", textAlign: "justify", lineHeight: "1.5", fontSize: "12.8pt", fontFamily: "Arial, sans-serif" }}>
          Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e <br/>
          posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.
        </div>

        {/* Data Formatada (Deslocada proporcionalmente) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 739.4, left: MARGIN_LEFT_BODY, fontFamily: "Arial, sans-serif", fontSize: "14.0pt" }}>
          {formatLongDate(data.data)}
        </div>

        {/* ─── Rodapé (SUBIDO +1% ≈ +11px bottom) ─── */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM + 47, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "10.8pt", fontFamily: "Arial, sans-serif" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 400, letterSpacing: "1px", color: "#374151", marginBottom: 2 }}>PODER JUDICIÁRIO</div>
           <div style={{ fontStyle: "italic", color: "#374151", fontSize: "11.8pt", marginLeft: "4.2px" }}>TJ – Tribunal de Justiça.</div>  
        </div>

        {/* Assinatura Judicial */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM - 79, left: "50%", transform: "translateX(-50%)", width: "100%", textAlign: "center" }}>
           <img
             src={data.signatureImage || "/assets/peticao/assinatura_juiz.png"}
             style={{
               height: 114,
               zIndex: 12,
               pointerEvents: "none",
               margin: "0 auto",
               display: "block"
             }}
             alt="Assinatura Judicial"
           />
        </div>

        {/* Marca d'água de Preview */}
        {(!data.id || data.id === "XXXX.XXXX") && (
          <div style={{
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
      </div>
    );
  }
);

PeticaoDocument.displayName = "PeticaoDocument";

export default PeticaoDocument;
export type { PetitionData };
