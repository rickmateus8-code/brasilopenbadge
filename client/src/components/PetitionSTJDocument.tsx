import { forwardRef } from "react";

interface PetitionData {
  id: string;
  processo: string;
  credor: string;
  cpf_cnpj: string;
  advogado: string;
  contra: string;
  valor: string;
  data: string;
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

const DOC_WIDTH_PX = 818;  // Aumentado +1% para a esquerda (810 -> 818)
const DOC_HEIGHT_PX = 1123; 

// Configuração Técnica: A4 - 300 DPI
const DPI_TARGET = 300;
const EXPORT_SCALE = 1.94; // Reajustado para a nova largura de 818px

// Constantes de conversão ABNT (Baseadas na grade 818x1123)
const MARGIN_TOP = 113.4;    
const MARGIN_LEFT = 121.4;   // Aumentado +8px (113.4 -> 121.4) para recuo à esquerda
const MARGIN_LEFT_BODY = 89.3; // Deslocado mais 1% para a ESQUERDA conforme solicitado (97.5 -> 89.3)
const MARGIN_RIGHT = 91.6;   // Aumentado em mais 1% (~8px) (83.6 -> 91.6)
const MARGIN_BOTTOM = 75.6;  

const PeticaoDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    // Estilo base para os textos (CORPO UNIFICADO - SINCRONIZADO 12.3pt - Aumentado +1%)
    const textStyle: React.CSSProperties = {
      position: "absolute",
      fontFamily: "Arial, sans-serif",
      color: "#000",
      fontSize: "12.3pt", 
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
        {/* ─── Layer de Fundo: Marca d'Água (Centrada e Rebaixada) ─── */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -42%)", // Subido mais 1 linha (era -40%, agora -42%)
          width: "500pt", 
          zIndex: 1,
          pointerEvents: "none"
        }}>
          <img src="/assets/peticao/background_logo.png" style={{ width: "100%" }} alt="Watermark" />
        </div>

        {/* ─── Cabeçalho Superior Centralizado (Dentro da Margem ABNT - ABAIXADO 2% - COR CINZA 2%) ─── */}
        <div style={{ position: "absolute", top: MARGIN_TOP - 48, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 11, fontFamily: "'Liberation Sans', Helvetica" }}>
           {/* Brasão da República (ALINHADO E CENTRALIZADO + EXTRA 4%) */}
           <img src="/assets/peticao/brasao_republica.png" style={{ width: "91.9pt", marginBottom: "4pt", display: "inline-block" }} alt="Brasão" />
           
           {/* Informações Institucionais (COR CINZA 2% - #222222) */}
           <div style={{ color: "#222222", fontSize: "10.1pt", fontWeight: 400, letterSpacing: "0.5px" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ color: "#222222", fontSize: "8.4pt", fontWeight: 400, marginTop: -3 }}>ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: 0284748/2026</div>
           <div style={{ color: "#222222", fontSize: "8.4pt", fontWeight: 400, marginTop: -3 }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
        </div>

        {/* Logo OAB (LIMITE ABSOLUTO - Canto Superior Esquerdo - SUBIDO 1% E +6% TAMANHO) */}
        <div style={{ position: "absolute", top: "-13pt", left: "4pt", zIndex: 11 }}>
           <img src="/assets/peticao/oab_logo.png" style={{ width: "88.3pt" }} alt="OAB" />
        </div>

        {/* Título do Documento (FONTE LIBERATION SANS / DIMINUÍDO MAIS 5% = 16.2pt) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 180, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 10, fontFamily: "'Liberation Sans', Helvetica" }}>
           <div style={{ fontSize: "16.2pt", fontWeight: 700, color: "#000" }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "12.5pt", fontWeight: 400, marginTop: -6, color: "#000" }}>Processo Judiciário</div>
        </div>

        {/* ─── Corpo da Petição (Grid ABNT - SUBIDO 1MM ≈ 3.8px) ─── */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 241.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Credor:</span>
          <span style={valueStyle}>{data.credor?.toUpperCase() || ""}</span>
        </div>
        
        <div style={{ ...textStyle, top: MARGIN_TOP + 270, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>CPF/CNPJ:</span>
          <span style={valueStyle}>{data.cpf_cnpj || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 291.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Advogado(a):</span>
          <span style={valueStyle}>{data.advogado?.toUpperCase() || ""}</span>
        </div>

        {/* Linha Divisória Superior (Largura Útil Ajustada) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 321.2, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT }}>
          <img src="/assets/peticao/linha.png" style={{ width: "100%", height: 1.5 }} alt="Separator" />
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 341.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Processo N°:</span>
          <span style={valueStyle}>{data.processo || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 391.2, left: MARGIN_LEFT_BODY, borderBottom: "1px solid #000", paddingBottom: 2, display: "inline-block", paddingRight: 130 }}>
          <span style={labelStyle}>CUMPRIMENTO DE SENTENÇA CONTRA:</span>
          <span style={valueStyle}>{data.contra?.toUpperCase() || ""}</span>
        </div>

        {/* Bloco de Decisão (Unificado) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 436.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Assunto:</span>
          <span style={valueStyle}>Decisão Favorável</span>
        </div>
        <div style={{ ...textStyle, top: MARGIN_TOP + 461.2, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Situação:</span>
          <span style={{ ...valueStyle, color: "#000" }}>AUTORIZADO</span>
        </div>

        {/* Código de Barras (ALINHADO À MARGEM ESQUERDA - MOVIDO 2% ESQUERDA E +8% TAMANHO) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 491.2, left: MARGIN_LEFT - 32, zIndex: 11 }}>
           <img src="/assets/peticao/cod_de_barras.png" style={{ width: "146pt", height: "33.7pt" }} alt="Barcode" />
        </div>

        {/* Valor de Repasse (SEM QUEBRA DE LINHA - SINCRONIZADO 12.3pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 556.2, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap" }}>
          Valor a receber: <span style={valueStyle}>R$ {data.valor || ""}</span> será depositado em conta corrente de sua titularidade..
        </div>

        {/* Texto Legal / Informativo (ARIAL - SINCRONIZADO 12.4pt - Aumentado +1% sobre 12.3pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 638.2, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap", textAlign: "justify", lineHeight: "1.5", fontSize: "12.4pt", fontFamily: "Arial, sans-serif" }}>
          Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e <br/>
          posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.
        </div>

        {/* Data Formatada por Extenso (Abaixo do Informativo - SINCRONIZADO 12.3pt - SUBIDO 2 LINHAS) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 718.2, left: MARGIN_LEFT_BODY, fontFamily: "Arial, sans-serif", fontSize: "12.3pt" }}>
          {formatLongDate(data.data)}
        </div>

        {/* ─── Rodapé e Assinatura ─── */}
        {/* PODER JUDICIÁRIO (ARIAL - PRÓXIMO DA ASSINATURA - SUBIDO 1% ≈ 11px) */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM + 70, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "11pt", fontFamily: "Arial, sans-serif" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 400, letterSpacing: "1px", color: "#374151", marginBottom: 2 }}>PODER JUDICIÁRIO</div>
           <div style={{ fontStyle: "italic", color: "#374151", fontSize: "11.7pt", marginLeft: "4.4px" }}>TJ – Tribunal de Justiça.</div>
        </div>

        {/* Assinatura Judicial (Respeitando MARGIN_BOTTOM - TAMANHO +1%) */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM - 55, left: "50%", transform: "translateX(-50%)", width: "100%", textAlign: "center" }}>
           {/* Imagem de Assinatura (Fundo) */}
           <img 
             src={data.signatureImage || "/assets/peticao/assinatura_juiz.png"} 
             style={{ 
               height: 111, 
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
