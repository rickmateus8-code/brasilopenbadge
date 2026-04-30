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
      fontSize: "12pt",
      whiteSpace: "nowrap",
      zIndex: 10
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
        {/* Layer de Fundo (Asset Original - Se houver um novo, substituir aqui) */}
        {/* Como o usuário quer uma replicação perfeita do PDF, vamos reconstruir os elementos fixos se não houver asset */}
        
        {/* Brasão e Cabeçalho Superior */}
        <div style={{ position: "absolute", top: 45, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%" }}>
           <img src="/assets/brasao_republica.png" style={{ width: 100, marginBottom: 5 }} alt="Brasão" />
           <div style={{ fontSize: "11pt", fontWeight: 700, fontFamily: "serif" }}>TRIBUNAL DE JUSTIÇA</div>
           <div style={{ fontSize: "9pt", fontWeight: 400, fontFamily: "serif" }}>ALVARA DE LIBERAÇÃO DE PAGAMENTO Nº: 0284748/202</div>
           <div style={{ fontSize: "9pt", fontWeight: 400, fontFamily: "serif" }}>AÇÃO: EXECUÇÃO DE SENTENÇA CNJ LEI.13.105</div>
        </div>

        {/* Logo OAB (Canto Superior Esquerdo) */}
        <div style={{ position: "absolute", top: 15, left: 15 }}>
           <img src="/assets/oab_logo.png" style={{ width: 110 }} alt="OAB" />
        </div>

        {/* Título Central */}
        <div style={{ position: "absolute", top: 255, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%" }}>
           <div style={{ fontSize: "18pt", fontWeight: 600 }}>PROCESSO JUDICIAL ELETRÔNICO</div>
           <div style={{ fontSize: "14pt", fontWeight: 400 }}>Processo Judiciário</div>
        </div>

        {/* Blocos de Dados (Posicionamento Pixel-Perfect conforme PDF) */}
        <div style={{ ...textStyle, top: 310, left: 95 }}>Credor: <span style={{ fontWeight: 600 }}>{data.credor || "LAZARA MARGARIDA PEREIRA PINTO"}</span></div>
        <div style={{ ...textStyle, top: 330, left: 95 }}>CPF/CNPJ: <span style={{ fontWeight: 600 }}>{data.cpf_cnpj || "15036134885"}</span></div>
        <div style={{ ...textStyle, top: 350, left: 95 }}>Advogado(a): <span style={{ fontWeight: 600 }}>{data.advogado || "KEVIN PEREIRA LEAL"}</span></div>

        <div style={{ ...textStyle, top: 405, left: 95 }}>Processo N°: <span style={{ fontWeight: 600 }}>{data.processo || "1002384-22.2024.8.26.0601"}</span></div>

        {/* Linha e Contra */}
        <div style={{ ...textStyle, top: 468, left: 95, width: 620, display: 'flex', borderBottom: '1px solid #000', paddingBottom: 2 }}>
           CUMPRIMENTO DE SENTENÇA CONTRA: <span style={{ fontWeight: 600, marginLeft: 5 }}>{data.contra || "BANCO ITAU CONSIGNADO S.A."}</span>
        </div>

        {/* Assunto e Situação */}
        <div style={{ ...textStyle, top: 500, left: 95 }}>Assunto: Decisão Favorável</div>
        <div style={{ ...textStyle, top: 518, left: 95 }}>Situação: <span style={{ fontWeight: 600 }}>AUTORIZADO</span></div>

        {/* Valor a Receber */}
        <div style={{ ...textStyle, top: 620, left: 95 }}>
           Valor a receber: R$ <span style={{ fontWeight: 600 }}>{data.valor || "26.516,28"}</span> será depositado em conta corrente de sua titularidade..
        </div>

        {/* Texto Informativo */}
        <div style={{ ...textStyle, top: 685, left: 95, width: 610, whiteSpace: 'normal', textAlign: 'justify', lineHeight: 1.3 }}>
           Os autos foram encaminhados pelo TJ à Vara da Fazenda para a execução do processo e posteriormente encaminhado para Vara das Execuções gerando o processo de Execução.
        </div>

        {/* Data */}
        <div style={{ ...textStyle, top: 755, left: 95 }}>{data.data || "27 de Abril de 2026."}</div>

        {/* Rodapé (Poder Judiciário) */}
        <div style={{ position: "absolute", bottom: 150, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%", fontSize: "11pt" }}>
           <div style={{ textTransform: "uppercase", fontWeight: 400 }}>Poder Judiciário</div>
           <div style={{ fontStyle: "italic" }}>TJ– Tribunal de Justiça.</div>
        </div>

        {/* Assinatura */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", width: 450 }}>
           {data.signatureImage && (
             <img src={data.signatureImage} style={{ position: "absolute", bottom: 35, left: "50%", transform: "translateX(-50%)", height: 100, zIndex: 11 }} alt="Assinatura" />
           )}
           <div style={{ width: "100%", borderTop: "1.5px solid #000" }}></div>
           <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: "9pt", fontWeight: 600, textTransform: "uppercase" }}>
              <span>GERALDO</span>
              <span>FRANCISCO</span>
              <span>PINHEIRO</span>
              <span>FRANCO</span>
           </div>
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
            color: "rgba(220, 38, 38, 0.15)",
            zIndex: 99,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textTransform: "uppercase"
          }}>
            DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA
          </div>
        )}
      </div>
    );
  }
);

PeticaoDocument.displayName = "PeticaoDocument";

export default PeticaoDocument;
export type { PetitionData };
