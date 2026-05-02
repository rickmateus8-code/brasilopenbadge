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

const DOC_WIDTH_PX = 794;  // Visualização CSS (A4 96 DPI)
const DOC_HEIGHT_PX = 1123; // Visualização CSS (A4 96 DPI)

// Constantes de conversão ABNT (1cm ≈ 37.8px em 96 DPI)
const MARGIN_TOP = 113.4;    // 3.0 cm
const MARGIN_LEFT = 113.4;   // 3.0 cm
const MARGIN_LEFT_BODY = 113.1; // Deslocado +3% para a direita conforme solicitado (Total ~113px)
const MARGIN_RIGHT = 83.6;   // Aumentado em 1% (~8px) (75.6 -> 83.6)
const MARGIN_BOTTOM = 75.6;  // 2.0 cm

const PeticaoDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    // Estilo base para os textos (CORPO UNIFICADO - SINCRONIZADO E REDUZIDO 1% + 5% = 11.4pt + 3% = 11.7pt)
    const textStyle: React.CSSProperties = {
      position: "absolute",
      fontFamily: "Arial, sans-serif",
      color: "#000",
      fontSize: "11.7pt", // Aumentado em 3%
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
          transform: "translate(-50%, -20%)", // Rebaixado aprox 3 linhas (~40px em escala visual)
          width: "500pt", // Aumentado em mais 8% (463pt -> 500pt)
          zIndex: 1,
          pointerEvents: "none"
        }}>
          <img src="/assets/peticao/background_logo.png" style={{ width: "100%" }} alt="Watermark" />
        </div>

        {/* ─── Cabeçalho Superior Centralizado (Dentro da Margem ABNT - ABAIXADO 2%) ─── */}
        <div style={{ position: "absolute", top: MARGIN_TOP - 48, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 11, fontFamily: "'Liberation Sans', Helvetica" }}>
           {/* Brasão da República (ALINHADO E CENTRALIZADO) */}
           <img src="/assets/peticao/brasao_republica.png" style={{ width: "85pt", marginBottom: "4pt", display: "inline-block" }} alt="Brasão" />
           
           {/* Informações Institucionais (Abaixo do Brasão - COMPACTAÇÃO RADICAL E REDUÇÃO EXTRA 5%) */}
           <div style={{ color: "#000", fontSize: "10.2pt", fontWeight: 400, letterSpacing: "0.5px" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ color: "#000", fontSize: "8.5pt", fontWeight: 400, marginTop: -3 }}>ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: 0284748/2026</div>
           <div style={{ color: "#000", fontSize: "8.5pt", fontWeight: 400, marginTop: -3 }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
        </div>

        {/* Logo OAB (LIMITE ABSOLUTO - Canto Superior Esquerdo) */}
        <div style={{ position: "absolute", top: "4pt", left: "4pt", zIndex: 11 }}>
           <img src="/assets/peticao/oab_logo.png" style={{ width: "79.3pt" }} alt="OAB" />
        </div>

        {/* Título do Documento (FONTE LIBERATION SANS / DIMINUÍDO MAIS 5% = 16.2pt) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 180, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 10, fontFamily: "'Liberation Sans', Helvetica" }}>
           <div style={{ fontSize: "16.2pt", fontWeight: 700, color: "#000" }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "12pt", fontWeight: 400, marginTop: -6, color: "#000" }}>Processo Judiciário</div>
        </div>

        {/* ─── Corpo da Petição (Grid ABNT: Esquerda DESLOCADA +3% - FONTE ARIAL UNIFICADA 11.7pt - SUBIDO 1 LINHA) ─── */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 245, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Credor:</span>
          <span style={valueStyle}>{data.credor?.toUpperCase() || ""}</span>
        </div>
        
        <div style={{ ...textStyle, top: MARGIN_TOP + 270, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>CPF/CNPJ:</span>
          <span style={valueStyle}>{data.cpf_cnpj || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 295, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Advogado(a):</span>
          <span style={valueStyle}>{data.advogado?.toUpperCase() || ""}</span>
        </div>

        {/* Linha Divisória Superior (Largura Útil Ajustada) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 325, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT }}>
          <img src="/assets/peticao/linha.png" style={{ width: "100%", height: 1.5 }} alt="Separator" />
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 345, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Processo N°:</span>
          <span style={valueStyle}>{data.processo || ""}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 395, left: MARGIN_LEFT_BODY, borderBottom: "1px solid #000", paddingBottom: 2, display: "inline-block", paddingRight: 130 }}>
          <span style={labelStyle}>CUMPRIMENTO DE SENTENÇA CONTRA:</span>
          <span style={valueStyle}>{data.contra?.toUpperCase() || ""}</span>
        </div>

        {/* Bloco de Decisão (Unificado) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 440, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Assunto:</span>
          <span style={valueStyle}>Decisão Favorável</span>
        </div>
        <div style={{ ...textStyle, top: MARGIN_TOP + 465, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Situação:</span>
          <span style={{ ...valueStyle, color: "#000" }}>AUTORIZADO</span>
        </div>

        {/* Código de Barras (ALINHADO À MARGEM ESQUERDA - 1%) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 495, left: MARGIN_LEFT - 8, zIndex: 11 }}>
           <img src="/assets/peticao/cod_de_barras.png" style={{ width: "130pt", height: "30pt" }} alt="Barcode" />
        </div>

        {/* Valor de Repasse (SEM QUEBRA DE LINHA - SINCRONIZADO 11.7pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 560, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap" }}>
          Valor a receber: <span style={valueStyle}>R$ {data.valor || ""}</span> será depositado em conta corrente de sua titularidade..
        </div>

        {/* Texto Legal / Informativo (SINCRONIZADO 11.7pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 630, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "normal", textAlign: "justify", lineHeight: "1.5", fontFamily: "Arial, sans-serif" }}>
          Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e <br/>
          posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.
        </div>

        {/* Data Formatada por Extenso (Abaixo do Informativo - DESCIDO 1 LINHA EXTRA) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 765, left: MARGIN_LEFT_BODY, fontFamily: "Arial, sans-serif" }}>
          {data.data ? (
            (() => {
              const d = new Date(data.data);
              const day = String(d.getDate()).padStart(2, '0');
              const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
              const month = months[d.getMonth()];
              const year = d.getFullYear() < 2026 ? 2026 : d.getFullYear();
              return `${day} de ${month} de ${year}`;
            })()
          ) : "02 de Maio de 2026"}
        </div>

        {/* ─── Rodapé e Assinatura ─── */}
        {/* PODER JUDICIÁRIO (ARIAL - PRÓXIMO DA ASSINATURA - REBAIXADO 3 LINHAS) */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM + 55, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "11pt", fontFamily: "Arial, sans-serif" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 400, letterSpacing: "1px", color: "#374151" }}>PODER JUDICIÁRIO</div>
           <div style={{ fontStyle: "italic", color: "#374151", fontSize: "11.4pt" }}>TJ – Tribunal de Justiça.</div>
        </div>

        {/* Assinatura Judicial (Respeitando MARGIN_BOTTOM) */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM - 55, left: "50%", transform: "translateX(-50%)", width: "100%", textAlign: "center" }}>
           {/* Imagem de Assinatura (Fundo) */}
           <img 
             src={data.signatureImage || "/assets/peticao/assinatura_juiz.png"} 
             style={{ 
               height: 110, 
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
