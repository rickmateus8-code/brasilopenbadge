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
const MARGIN_LEFT_BODY = 73.4; // Deslocado 5% (~40px) para a esquerda conforme solicitado
const MARGIN_RIGHT = 75.6;   // 2.0 cm
const MARGIN_BOTTOM = 75.6;  // 2.0 cm

const PeticaoDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    // Estilo base para os textos (fidelidade forense - LIBERATION SANS / HELVETICA)
    const textStyle: React.CSSProperties = {
      position: "absolute",
      fontFamily: "'Liberation Sans', Helvetica",
      color: "#000",
      fontSize: "12.5pt",
      whiteSpace: "nowrap",
      zIndex: 10
    };

    const labelStyle: React.CSSProperties = {
      fontWeight: 400,
      marginRight: 5,
      fontFamily: "'Liberation Sans', Helvetica"
    };

    const valueStyle: React.CSSProperties = {
      fontWeight: 400,
      fontFamily: "'Liberation Sans', Helvetica"
    };

    return (
      <div
        ref={ref}
        id="attestation-document"
        style={{
          width: DOC_WIDTH_PX,
          height: DOC_HEIGHT_PX,
          backgroundColor: "#ffffff",
          fontFamily: "'Liberation Sans', Helvetica",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "0"
        }}
      >
        {/* ─── Layer de Fundo: Marca d'Água (Centrada) ─── */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "420pt",
          zIndex: 1,
          pointerEvents: "none"
        }}>
          <img src="/assets/peticao/background_logo.png" style={{ width: "100%" }} alt="Watermark" />
        </div>

        {/* ─── Cabeçalho Superior Centralizado (Dentro da Margem ABNT) ─── */}
        <div style={{ position: "absolute", top: MARGIN_TOP - 70, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 11, fontFamily: "'Liberation Sans', Helvetica" }}>
           {/* Brasão da República (ALINHADO E CENTRALIZADO) */}
           <img src="/assets/peticao/brasao_republica.png" style={{ width: "85pt", marginBottom: "8pt", display: "inline-block" }} alt="Brasão" />
           
           {/* Informações Institucionais (Abaixo do Brasão) */}
           <div style={{ color: "#000", fontSize: "12pt", fontWeight: 700, letterSpacing: "0.5px" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ color: "#000", fontSize: "10pt", fontWeight: 400, marginTop: 2 }}>ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: 0284748/2026</div>
           <div style={{ color: "#000", fontSize: "10pt", fontWeight: 400 }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
        </div>

        {/* Logo OAB (BEM NA BORDA - Canto Superior Esquerdo) */}
        <div style={{ position: "absolute", top: "15pt", left: "15pt", zIndex: 11 }}>
           <img src="/assets/peticao/oab_logo.png" style={{ width: "77pt" }} alt="OAB" />
        </div>

        {/* Código de Barras */}
        <div style={{ position: "absolute", top: "115pt", right: "45pt", zIndex: 11 }}>
           <img src="/assets/peticao/cod_de_barras.png" style={{ width: "130pt", height: "30pt" }} alt="Barcode" />
        </div>

        {/* Título do Documento (DIMINUÍDO 3% = 17.5pt) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 180, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 10, fontFamily: "'Liberation Sans', Helvetica" }}>
           <div style={{ fontSize: "17.5pt", fontWeight: 700, color: "#000" }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "12pt", fontWeight: 400, marginTop: -6, color: "#000" }}>Poder Judiciário do Estado</div>
        </div>

        {/* ─── Corpo da Petição (Grid ABNT: Esquerda DESLOCADA 5%) ─── */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 260, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Credor:</span>
          <span style={valueStyle}>{data.credor?.toUpperCase() || "LAZARA MARGARIDA PEREIRA PINTO"}</span>
        </div>
        
        <div style={{ ...textStyle, top: MARGIN_TOP + 285, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>CPF/CNPJ:</span>
          <span style={valueStyle}>{data.cpf_cnpj || "15036134885"}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 310, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Advogado(a):</span>
          <span style={valueStyle}>{data.advogado?.toUpperCase() || "KEVIN PEREIRA LEAL"}</span>
        </div>

        {/* Linha Divisória Superior (Largura Útil Ajustada) */}
        <div style={{ position: "absolute", top: MARGIN_TOP + 340, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT }}>
          <img src="/assets/peticao/linha.png" style={{ width: "100%", height: 1.5 }} alt="Separator" />
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 360, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Processo N°:</span>
          <span style={valueStyle}>{data.processo || "1002384-22.2024.8.26.0601"}</span>
        </div>

        <div style={{ ...textStyle, top: MARGIN_TOP + 410, left: MARGIN_LEFT_BODY, fontSize: "11pt" }}>
          <span style={labelStyle}>CUMPRIMENTO DE SENTENÇA CONTRA:</span>
          <span style={valueStyle}>{data.contra?.toUpperCase() || "BANCO ITAU CONSIGNADO S.A."}</span>
        </div>

        {/* Bloco de Decisão */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 455, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>Assunto:</span>
          <span style={valueStyle}>DECISÃO FAVORÁVEL - EXPEDIÇÃO DE ALVARÁ</span>
        </div>
        <div style={{ ...textStyle, top: MARGIN_TOP + 480, left: MARGIN_LEFT_BODY }}>
          <span style={labelStyle}>SITUAÇÃO:</span>
          <span style={{ ...valueStyle, color: "#000" }}>AUTORIZADO</span>
        </div>

        {/* Valor de Repasse (SEM QUEBRA DE LINHA) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 560, left: MARGIN_LEFT_BODY, fontSize: "14pt", width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "nowrap" }}>
          Valor a receber: <span style={valueStyle}>R$ {data.valor || "26.516,28"}</span> será depositado em conta corrente de sua titularidade..
        </div>

        {/* Texto Legal / Informativo (EQUALIZADO PARA 12.5pt) */}
        <div style={{ ...textStyle, top: MARGIN_TOP + 630, left: MARGIN_LEFT_BODY, width: DOC_WIDTH_PX - MARGIN_LEFT_BODY - MARGIN_RIGHT, whiteSpace: "normal", textAlign: "justify", lineHeight: "1.5", fontSize: "12.5pt", fontFamily: "'Liberation Sans', Helvetica" }}>
          Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e <br/>
          posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.
        </div>

        {/* ─── Rodapé e Assinatura ─── */}
        {/* PODER JUDICIÁRIO (ACIMA DA ASSINATURA - COR PRETO ACINZENTADO) */}
        <div style={{ position: "absolute", bottom: MARGIN_BOTTOM + 110, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "11pt", fontFamily: "'Liberation Sans', Helvetica" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 400, letterSpacing: "1px", color: "#374151" }}>PODER JUDICIÁRIO</div>
           <div style={{ fontStyle: "italic", color: "#374151" }}>TJ – Tribunal de Justiça.</div>
        </div>

        {/* Assinatura Judicial (ABAIXADA MAIS 2 LINHAS) */}
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
