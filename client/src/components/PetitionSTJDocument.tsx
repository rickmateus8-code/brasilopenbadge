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

const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;

const PeticaoDocument = forwardRef<HTMLDivElement, PetitionSTJDocumentProps>(
  ({ data }, ref) => {
    // Estilo base para os textos (fidelidade forense)
    const textStyle: React.CSSProperties = {
      position: "absolute",
      fontFamily: "'Times New Roman', Times, serif",
      color: "#000",
      fontSize: "12.5pt", // Tamanho padrão petição jurídica
      whiteSpace: "nowrap",
      zIndex: 10
    };

    const labelStyle: React.CSSProperties = {
      fontWeight: 400,
      marginRight: 5
    };

    const valueStyle: React.CSSProperties = {
      fontWeight: 700
    };

    return (
      <div
        ref={ref}
        id="attestation-document"
        style={{
          width: DOC_WIDTH_PX,
          height: DOC_HEIGHT_PX,
          backgroundColor: "#ffffff",
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

        {/* ─── Cabeçalho Superior ─── */}
        {/* Brasão da República (Logo Principal) */}
        <div style={{ position: "absolute", top: "40pt", left: "40pt", zIndex: 11 }}>
           <img src="/assets/peticao/brasao_republica.png" style={{ width: "100pt" }} alt="Brasão" />
        </div>

        {/* Informações Institucionais (Centro) */}
        <div style={{ position: "absolute", top: "40pt", left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 11 }}>
           <div style={{ fontSize: "12pt", fontWeight: 700, fontFamily: "'Times New Roman', serif", letterSpacing: "1px" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ fontSize: "10pt", fontWeight: 400, fontFamily: "'Times New Roman', serif", marginTop: 2 }}>ALVARÁ DE LIBERAÇÃO DE PAGAMENTO Nº: 0284748/2026</div>
           <div style={{ fontSize: "10pt", fontWeight: 400, fontFamily: "'Times New Roman', serif" }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
        </div>

        {/* Logo OAB (Logo Secundário / Selo) */}
        <div style={{ position: "absolute", top: "40pt", left: "450pt", zIndex: 11 }}>
           <img src="/assets/peticao/oab_logo.png" style={{ width: "80pt" }} alt="OAB" />
        </div>

        {/* Código de Barras */}
        <div style={{ position: "absolute", top: "100pt", right: "40pt", zIndex: 11 }}>
           <img src="/assets/peticao/cod_de_barras.png" style={{ width: "140pt", height: "35pt" }} alt="Barcode" />
        </div>

        {/* Título do Documento */}
        <div style={{ position: "absolute", top: 240, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", zIndex: 10 }}>
           <div style={{ fontSize: "18pt", fontWeight: 700, textDecoration: "underline" }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "14pt", fontWeight: 400, marginTop: 4 }}>Poder Judiciário do Estado</div>
        </div>

        {/* ─── Corpo da Petição (Grid Pixel-Perfect) ─── */}
        <div style={{ ...textStyle, top: 315, left: 80 }}>
          <span style={labelStyle}>Credor:</span>
          <span style={valueStyle}>{data.credor?.toUpperCase() || "LAZARA MARGARIDA PEREIRA PINTO"}</span>
        </div>
        
        <div style={{ ...textStyle, top: 340, left: 80 }}>
          <span style={labelStyle}>CPF/CNPJ:</span>
          <span style={valueStyle}>{data.cpf_cnpj || "15036134885"}</span>
        </div>

        <div style={{ ...textStyle, top: 365, left: 80 }}>
          <span style={labelStyle}>Advogado(a):</span>
          <span style={valueStyle}>{data.advogado?.toUpperCase() || "KEVIN PEREIRA LEAL"}</span>
        </div>

        {/* Linha Divisória Superior */}
        <div style={{ position: "absolute", top: 395, left: 80, width: 634 }}>
          <img src="/assets/peticao/linha.png" style={{ width: "100%", height: 1.5 }} alt="Separator" />
        </div>

        <div style={{ ...textStyle, top: 415, left: 80 }}>
          <span style={labelStyle}>Processo N°:</span>
          <span style={valueStyle}>{data.processo || "1002384-22.2024.8.26.0601"}</span>
        </div>

        <div style={{ ...textStyle, top: 465, left: 80, fontSize: "11pt" }}>
          <span style={labelStyle}>CUMPRIMENTO DE SENTENÇA CONTRA:</span>
          <span style={valueStyle}>{data.contra?.toUpperCase() || "BANCO ITAU CONSIGNADO S.A."}</span>
        </div>

        {/* Bloco de Decisão */}
        <div style={{ ...textStyle, top: 510, left: 80 }}>
          <span style={labelStyle}>Assunto:</span>
          <span style={valueStyle}>DECISÃO FAVORÁVEL - EXPEDIÇÃO DE ALVARÁ</span>
        </div>
        <div style={{ ...textStyle, top: 535, left: 80 }}>
          <span style={labelStyle}>Situação:</span>
          <span style={{ ...valueStyle, color: "#15803d" }}>DEFERIDO / AUTORIZADO</span>
        </div>

        {/* Valor de Repasse */}
        <div style={{ ...textStyle, top: 620, left: 80, fontSize: "14pt", width: 634, whiteSpace: "normal", textAlign: "justify" }}>
          O valor total de repasse <span style={valueStyle}>R$ {data.valor || "26.516,28"}</span> será creditado integralmente na conta bancária informada pelo patrono da causa, conforme trânsito em julgado.
        </div>

        {/* Texto Legal / Informativo */}
        <div style={{ ...textStyle, top: 710, left: 80, width: 634, whiteSpace: "normal", textAlign: "justify", lineHeight: "1.5", fontSize: "11pt" }}>
          Certifico que os autos foram encaminhados pela Instância Superior à Vara da Fazenda Pública para o cumprimento imediato da sentença, devendo o setor de pagamentos realizar o depósito em até 48 horas úteis.
        </div>

        {/* Data e Localidade */}
        <div style={{ ...textStyle, top: 810, left: 80, fontStyle: "italic", fontSize: "11pt" }}>
          Documento expedido eletronicamente em {data.data || "27 de Abril de 2026."}
        </div>

        {/* ─── Rodapé e Assinatura ─── */}
        <div style={{ position: "absolute", bottom: 180, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "11pt" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>Conselho Nacional de Justiça</div>
           <div style={{ fontStyle: "italic", color: "#4b5563" }}>TJ – Tribunal de Justiça Eletrônico.</div>
        </div>

        {/* Assinatura Judicial */}
        <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", width: 480, textAlign: "center" }}>
           {/* Imagem de Assinatura (Fundo) */}
           <img 
             src={data.signatureImage || "/assets/peticao/assinatura_juiz.png"} 
             style={{ 
               position: "absolute", 
               bottom: 25, 
               left: "50%", 
               transform: "translateX(-50%)", 
               height: 110, 
               zIndex: 12,
               pointerEvents: "none"
             }} 
             alt="Assinatura Judicial" 
           />
           
           {/* Linha da Assinatura */}
           <div style={{ width: "100%", borderTop: "1.2px solid #000", marginBottom: 8 }}></div>
           
           {/* Nome da Autoridade */}
           <div style={{ fontSize: "8pt", color: "#6b7280", marginTop: 2 }}>PRESIDENTE DO TRIBUNAL DE JUSTIÇA</div>
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
