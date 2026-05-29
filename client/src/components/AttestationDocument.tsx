import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { getQRCodeValue } from "@/config.qrcode";
import { ATTESTATION_LAYOUT } from "@/config/attestationLayout";

interface AttestationData {
  id: string;
  paciente: string;
  sexo: string;
  nascimento: string;
  cpf?: string;
  cns?: string;
  tipoDoc?: "CPF" | "CNS";
  nomeMae: string;
  endereco: string;
  condicao?: string;
  vacinacao?: string;
  cid?: string;
  codigoQR: string;
  dataAssinatura: string;
  horaAssinatura: string;
  medico: string;
  crm: string;
  especialidade: string;
  dataEmissao: string;
  afastamento?: string;
  [key: string]: any;
}

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
  logoLeft?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
  documentType?: 'atestado' | 'laudo' | 'relatorio';
  logoLeftScale?: number;
  logoRightScale?: number;
  logoLeftX?: number;
  logoLeftY?: number;
  logoRightX?: number;
  logoRightY?: number;
  stampScale?: number;
  stampX?: number;
  stampY?: number;
  stampRotate?: number;
  hideQRCode?: boolean;
  showStampInfo?: boolean;
  isExporting?: boolean;
}

// Dimensões A4 exatas em pixels a 96dpi
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;
const PAD_H = 56;  
const PAD_V = 60;  

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ 
    data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage, documentType, 
    logoLeftScale = 1, logoRightScale = 1, logoLeftX = 0, logoLeftY = 0, logoRightX = 0, logoRightY = 0,
    stampScale, stampX, stampY, stampRotate, hideQRCode, showStampInfo,
    isExporting = false
  }, ref) => {
    const isEmitted = data.codigoQR && data.codigoQR !== "XXXX.XXXX";
    const rawDateToUse = data.dataAssinatura || data.dataEmissao || "";
    const dataEmissaoForQR = rawDateToUse
      ? (() => {
          const d = String(rawDateToUse).trim();
          const parts = d.split("/");
          if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
          return d.substring(0, 10);
        })()
      : undefined;
    const qrValue = isEmitted
      ? getQRCodeValue(data.codigoQR, dataEmissaoForQR)
      : "https://validaratestado.digital";

    const getCrossOrigin = (url: string) => {
      if (!url || url.startsWith("data:") || url.startsWith("/")) return undefined;
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === window.location.hostname) return undefined;
      } catch {
        return undefined;
      }
      return "anonymous";
    };

    const effectiveLogoLeft = logoLeft || logoUrl || (data as any).logoUrl || (data as any).logo_url || "";
    const effectiveLogoRight = logoRight || (data as any).logoRight || (data as any).logo_right || "";

    const instituicao = (data as any).instituicao || "";
    const enderecoEmitente = (data as any).enderecoEmitente || (data as any).endereco_emitente || "";
    const corAssinatura = signatureColor || (data as any).signatureColor || (data as any).signature_color || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || (data as any).signature_image || "";
    const textoAtestado = (data as any).textoAtestado || (data as any).texto_atestado || "";
    const cidDisplay = (data as any).cidDisplay || (data as any).cid_display || data.cid || "";
    const cidNome = (data as any).cidNome || (data as any).cid_nome || "";
    const cidade = (data as any).cidade || "";
    const uf = (data as any).uf || "MG";
    const modoCarimbo = (data as any).modoCarimbo || (data as any).modo_carimbo || false;

    const layout = ATTESTATION_LAYOUT;
    const sScale = stampScale ?? (data as any).stampScale ?? (data as any).stamp_scale ?? layout.stamp.defaultScale;
    const sX = stampX ?? (data as any).stampX ?? (data as any).stamp_x ?? layout.stamp.defaultX;
    const sY = stampY ?? (data as any).stampY ?? (data as any).stamp_y ?? layout.stamp.defaultY;
    const sRotate = stampRotate ?? (data as any).stampRotate ?? (data as any).stamp_rotate ?? layout.stamp.defaultRotate;
    const hQRCode = hideQRCode || (data as any).hideQRCode || (data as any).hide_qr_code === 1;
    const sStampInfo = showStampInfo && ((data as any).showStampInfo !== false && (data as any).show_stamp_info !== 0);

    const docType = (documentType || (data as any).documentType || (data as any).document_type || (data as any).tipo || 'atestado').toLowerCase();
    
    // Data de emissão formatada em Cidade / UF, dia de mês de ano
    const dataFormatada = (data as any).dataEmissaoFormatada || (() => {
      const d = data.dataEmissao || "";
      if (!d || d.length < 10) return d;
      const parts = d.split("/");
      if (parts.length === 3) {
        const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
        const dia = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const ano = parts[2];
        if (isNaN(dia) || isNaN(m) || m < 0 || m > 11 || dia < 1 || dia > 31) return d;
        
        // Formato Cidade / UF (ex: Votorantim / SP)
        const cidadeFormatada = cidade ? cidade.charAt(0).toUpperCase() + cidade.slice(1).toLowerCase() : "";
        const ufFormatada = uf ? uf.toUpperCase() : "";
        
        return `${cidadeFormatada}${ufFormatada ? ' / ' + ufFormatada : ''}, ${dia} de ${meses[m]} de ${ano}`;
      }
      return d;
    })();

    const sexoLabel = (() => {
      const s = data.sexo?.toUpperCase();
      if (s === "MALE" || s === "M" || s === "MASCULINO") return "M";
      if (s === "FEMALE" || s === "F" || s === "FEMININO") return "F";
      return s || "______";
    })();

    return (
      <div
        ref={ref}
        id="attestation-document"
        data-pdf-export="true"
        style={{
          width: `${DOC_WIDTH_PX}px`,
          minHeight: `${DOC_HEIGHT_PX}px`,
          height: `${DOC_HEIGHT_PX}px`,
          backgroundColor: "#ffffff",
          paddingTop: docType === 'relatorio' ? "40px" : `${PAD_H}px`,
          paddingBottom: docType === 'relatorio' ? "40px" : `${PAD_H}px`,
          paddingLeft: `${PAD_V}px`,
          paddingRight: `${PAD_V}px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "Arial, Helvetica, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Marca d'água Preview */}
        {(data.id === "XXXX.XXXX" || (data as any).codigoQR === "XXXX.XXXX") && (
          <div data-html2canvas-ignore="true" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 48.6,
            fontWeight: 900,
            color: "rgba(220, 38, 38, 0.08)",
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            zIndex: 99,
          }}>
            DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA
          </div>
        )}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&family=Courier+Prime:wght@400;700&display=swap');
          #attestation-document * { box-sizing: border-box; }
        `}</style>

        {/* ─── LAYOUT RELATÓRIO (MODO ALFENAS - REFINADO) ─── */}
        {docType === 'relatorio' ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Arial, sans-serif" }}>
            {/* Header: Logo Esquerda + Texto Centralizado */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: 40, 
              border: "1px solid #000", 
              padding: "15px",
              height: 120,
              boxSizing: "border-box",
              background: "transparent"
            }}>
              <div style={{ width: 140, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", overflow: "visible" }}>
                {effectiveLogoLeft && (
                  <img 
                    src={effectiveLogoLeft} 
                    style={{ 
                      maxWidth: "100%", 
                      maxHeight: 90, 
                      objectFit: "contain", 
                      background: "transparent",
                      transform: `scale(${logoLeftScale}) translate(${logoLeftX}px, ${logoLeftY}px)`,
                      transformOrigin: "center center",
                      transition: "transform 0.1s",
                    }} 
                    alt="Logo" 
                    crossOrigin={getCrossOrigin(effectiveLogoLeft)}
                  />
                )}
              </div>
              <div style={{ flex: 1, textAlign: "center", paddingRight: 140 }}>
                <div style={{ fontSize: 16.2, fontWeight: 700, textTransform: "uppercase", color: "#000", marginTop: -15, marginBottom: 8 }}>{instituicao}</div>
                <div style={{ fontSize: 10.8, fontWeight: 700, textTransform: "uppercase", color: "#000" }}>{enderecoEmitente}</div>
              </div>
            </div>

            {/* Título Centralizado */}
            <div style={{ textAlign: "center", marginBottom: 50, marginTop: -12 }}>
               <h1 style={{ fontSize: 17.5, fontWeight: 400, textTransform: "uppercase", color: "#000", letterSpacing: 0 }}>RELATÓRIO MÉDICO</h1>
            </div>

            {/* Corpo do Texto */}
            <div style={{ flex: 1, fontSize: 12.4, lineHeight: 1.8, color: "#000", textAlign: "justify", marginTop: -22 }}>
               <div style={{ whiteSpace: "pre-wrap", marginBottom: 30 }}>
                 {textoAtestado || `Paciente: ${data.paciente?.toUpperCase() || ""}
CPF: ${data.cpf || ""}

Declaro para os devidos fins que a paciente acima encontra-se em acompanhamento médico devido ao diagnóstico:

CID: ${cidDisplay || ""}

A paciente apresenta quadro clínico que causa incapacidade temporária para o exercício de suas atividades laborais habituais, necessitando de afastamento do trabalho para realização de tratamento médico adequado.

Encontra-se em tratamento oncológico, necessitando acompanhamento contínuo, repouso e afastamento laboral, considerando as limitações físicas e emocionais decorrentes da doença e do tratamento realizado.

Informo que a paciente permanece sem condições de exercer suas atividades profissionais pelo período estimado de ${data.afastamento || ""} dias, a contar desta data.`}
               </div>

               {/* Local e Data à Direita */}
               <div style={{ textAlign: "right", marginTop: 20, marginBottom: 80, fontSize: 14 }}>
                  {dataFormatada}
               </div>

               {/* Área de Assinaturas */}
               <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 80 }}>
                  {/* Assinatura Paciente */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -22 }}>
                     <div style={{ width: 400, borderTop: "1.5px solid #000" }}></div>
                     <div style={{ fontSize: 14, marginTop: 4, fontWeight: 700 }}>Assinatura do Paciente ou Responsável</div>
                  </div>

                  {/* Assinatura Médico (Controlado por Elite 2.0) */}
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    position: "relative", 
                    marginTop: -22,
                    zIndex: 10
                  }}>
                     {/* Bloco do Médico posicionado dinamicamente via Elite 2.0 */}
                     <div style={{ 
                       position: "absolute", 
                       top: modoCarimbo ? sY : -45, 
                       left: modoCarimbo ? sX : 0,
                       transform: `scale(${modoCarimbo ? sScale : 1}) rotate(${modoCarimbo ? sRotate : -1}deg)`,
                       opacity: 0.95, 
                       textAlign: "center",
                       width: "max-content",
                       transition: "transform 0.1s"
                     }}>
                        {fotoAssinatura && <img src={fotoAssinatura} style={{ maxHeight: 100, maxWidth: 300, background: "transparent" }} alt="Assinatura" />}
                        {modoCarimbo && sStampInfo && (
                          <div style={{ textAlign: "center", color: corAssinatura, marginTop: -5 }}>
                             <div style={{ fontWeight: 700, fontSize: 13 }}>{data.medico?.toUpperCase()}</div>
                             <div style={{ fontSize: 11 }}>{data.crm}</div>
                          </div>
                        )}
                     </div>
                     <div style={{ width: 400, borderTop: "1.5px solid #000" }}></div>
                     <div style={{ fontSize: 14, marginTop: 4, fontWeight: 700 }}>Assinatura e Carimbo do Médico</div>
                  </div>
               </div>
            </div>

            {/* Rodapé Forense Refinado */}
            <div style={{ borderTop: "1px solid #eee", paddingTop: 15, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
               <div style={{ fontSize: 9.5, color: "#555", lineHeight: 1.5 }}>
                 Documento assinado digitalmente de acordo com a ICP-Brasil, MP 2.200-2/2001, no sistema certificado SBIS nº 167, 168 169 e 170 v 5.2.<br />
                 por {data.medico?.toUpperCase()} em {data.dataAssinatura || data.dataEmissao} {data.horaAssinatura || "12:54"} Estado da assinatura: Válido<br />
                 Valide este documento em https://validaratestado.digital através do Código: {data.codigoQR || "****.****"}<br />
                 <span style={{ fontSize: 8.5, fontWeight: 700 }}>**Esse documento possui dados sensíveis**</span>
               </div>
               <div style={{ fontSize: 11, color: "#555", fontWeight: 400 }}>
                 Página 1 de 1
               </div>
            </div>
          </div>
        ) : (
          /* ─── LAYOUT ORIGINAL (ATESTADO / LAUDO) ─── */
          <>
            {/* ===== HEADER ===== */}
            <div id="preview-header" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 0,
              height: 80,
              position: "relative",
              zIndex: 2,
              flexShrink: 0,
              background: "transparent"
            }}>
              <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexShrink: 0, overflow: "visible", background: "transparent" }}>
                {effectiveLogoLeft && (
                  <img
                    src={effectiveLogoLeft}
                    alt="Logo"
                    crossOrigin={getCrossOrigin(effectiveLogoLeft)}
                    style={{
                      maxHeight: "100%",
                      maxWidth: 149.38, 
                      objectFit: "contain",
                      background: "transparent",
                      transform: `scale(${logoLeftScale}) translate(${logoLeftX}px, ${logoLeftY}px)`,
                      transformOrigin: "left center",
                      transition: "transform 0.1s",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, padding: "0 12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {instituicao && (
                  <div style={{ fontSize: 14.7, fontWeight: 700, textTransform: "uppercase", marginBottom: 2, color: "#000", letterSpacing: 0, lineHeight: 1.3 }}>
                    {instituicao}
                  </div>
                )}
                {enderecoEmitente && (
                  <div style={{ fontSize: 10.5, fontWeight: 400, textTransform: "uppercase", color: "#000", lineHeight: 1.3 }}>
                    {enderecoEmitente}
                  </div>
                )}
              </div>

              <div style={{ width: 149.38, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, overflow: "visible", background: "transparent" }}>
                {effectiveLogoRight && (
                  <img
                    src={effectiveLogoRight}
                    alt="Logo Direita"
                    crossOrigin={getCrossOrigin(effectiveLogoRight)}
                    style={{
                      maxHeight: "100%",
                      maxWidth: 149.38,
                      objectFit: "contain",
                      background: "transparent",
                      transform: `scale(${logoRightScale}) translate(${logoRightX}px, ${logoRightY}px)`,
                      transformOrigin: "right center",
                      transition: "transform 0.1s",
                    }}
                  />
                )}
              </div>
            </div>

            <div style={{
              fontWeight: 900,
              fontSize: 23.15, 
              textTransform: "uppercase",
              borderTop: "none",
              borderBottom: "none",
              display: "block",
              padding: "0",
              width: "100%",
              textAlign: "center",
              marginTop: 15,
              marginBottom: 11,
              lineHeight: 1, 
              letterSpacing: 0, 
              position: "relative",
              zIndex: 2,
              color: "#000",
              flexShrink: 0,
            }}>
              {docType === 'laudo' ? (
                <div style={{ fontSize: 23.15, fontWeight: 900 }}>LAUDO MÉDICO</div>
              ) : (
                <div style={{ fontSize: 23.15, fontWeight: 900 }}>ATESTADO MÉDICO</div>
              )}
            </div>

            <div style={{
              borderTop: "2.04px solid #000", 
              width: "100%",
              marginBottom: 23,
              position: "relative",
              zIndex: 2,
              flexShrink: 0,
            }} />

            {/* ===== DADOS DO PACIENTE ===== */}
            <div id="preview-patient" style={{
              border: "1px solid #000",
              padding: isExporting ? "6px 15px 22px 15px" : "14.25px 15px", 
              boxSizing: "border-box",
              fontSize: 10.815,
              marginBottom: 10,
              lineHeight: 1.2, 
              gap: 4,
              position: "relative",
              zIndex: 2,
              background: "#fff",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <div style={{ flex: 3 }}>
                  <span style={{ fontWeight: 700, color: "#000" }}>Paciente: </span>
                  <span style={{ color: "#000", textTransform: "uppercase" }}>{data.paciente}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: "#000" }}>Sexo: </span>
                  <span style={{ color: "#000" }}>{sexoLabel}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: "#000" }}>Nasc.: </span>
                  <span style={{ color: "#000" }}>{data.nascimento}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: "#000" }}>{data.tipoDoc === "CNS" ? "Cartão Nacional:" : "CPF:"} </span>
                  <span style={{ color: "#000", textTransform: "uppercase" }}>{data.cpf || data.cns || "___________"}</span>
                </div>
                <div style={{ flex: 2 }}>
                  <span style={{ fontWeight: 700, color: "#000" }}>Nome da Mãe: </span>
                  <span style={{ color: "#000", textTransform: "uppercase" }}>{data.nomeMae}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: "100%" }}>
                  <span style={{ fontWeight: 700, color: "#000" }}>Endereço: </span>
                  <span style={{ color: "#000", textTransform: "uppercase" }}>{data.endereco}</span>
                </div>
              </div>
            </div>

            {/* ENDEREÇO EMITENTE (Restaurado da V7.61) */}
            {enderecoEmitente && (
              <div style={{
                fontSize: 10.5,
                lineHeight: 1.2,
                fontFamily: "Arial, Helvetica, sans-serif",
                textAlign: "left",
                position: "relative",
                zIndex: 2,
                flexShrink: 0,
                marginTop: isExporting ? layout.export.addressMarginTop : -2,
                marginBottom: isExporting ? layout.export.addressMarginBottom : 22,
                color: "#000",
                textTransform: "uppercase"
              }}>
                <span style={{ fontWeight: 700 }}>ENDEREÇO EMITENTE:</span> <span style={{ fontWeight: 400 }}>{enderecoEmitente}</span>
              </div>
            )}

            <div id="preview-body" style={{
              flex: "1 1 auto",
              fontSize: 15.18, 
              lineHeight: 1.9,
              textAlign: "justify",
              position: "relative",
              zIndex: 2,
              paddingTop: 48,
              paddingBottom: 8,
              color: "#000",
              fontWeight: 400,
            }}>
              <p style={{ margin: 0, textIndent: "4em", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                {"  "}{textoAtestado || "Atesto para os devidos fins..."}
              </p>
              {cidDisplay && (
                <div style={{ fontWeight: 700, fontSize: 13.42, marginTop: 28, color: "#000", textTransform: "uppercase" }}>
                  CID: {cidDisplay}{cidNome ? ` — ${cidNome}` : ""}
                </div>
              )}
            </div>

            {!hQRCode && (
              <div id="preview-footer" style={{ marginTop: modoCarimbo ? 20 : "auto", position: "relative", zIndex: 2, flexShrink: 0, width: "100%" }}>
                <div style={{ borderTop: "2px solid #000", marginBottom: 6 }} />
                <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 0, width: "100%" }}>
                  <div style={{ color: "#000", lineHeight: 1.2, fontFamily: "Arial, sans-serif", height: 111, paddingBottom: 4, display: "flex", flexDirection: "column", justifyContent: "flex-end", marginRight: "auto" }}>
                    <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 10.21 }}>
                       {dataFormatada}
                    </div>
                    <div style={{ fontSize: 9.65 }}>Valide este documento acessando o endereço:</div>
                    <strong style={{ fontSize: 10.21, display: "block" }}>https://validaratestado.digital</strong>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 9.65 }}>Código: </span>
                      <strong style={{ fontSize: 10.21, marginLeft: 2 }}>{isEmitted ? data.codigoQR : "****.****"}</strong>
                    </div>
                  </div>
                  <div style={{ border: "1px solid #000", width: 385, height: 111, display: "flex", alignItems: "center", background: "white", paddingRight: 10 }}>
                    <div style={{ width: 108, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isEmitted ? (
                        <QRCode value={qrValue} size={96} level="H" />
                      ) : (
                        <div style={{ filter: "blur(4px)", opacity: 0.5 }}>
                           <QRCode value="https://validaratestado.digital" size={96} level="H" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: "right", color: "#000" }}>
                      <div style={{ fontSize: 9.5 }}>Documento assinado digitalmente conforme MP nº 2.200-2</div>
                      <strong style={{ fontSize: 11.2, textTransform: "uppercase" }}>{data.medico}</strong>
                      <span style={{ display: "block", fontSize: 10.1 }}>{data.crm}</span>
                      <span style={{ display: "block", fontSize: 10.1, textTransform: "uppercase" }}>{data.especialidade}</span>
                      <span style={{ display: "block", fontSize: 10.1 }}>Assinado em {data.dataAssinatura} {data.horaAssinatura}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {modoCarimbo && (
              <div style={{
                position: "absolute", bottom: hQRCode ? 100 : 150, left: "50%", marginLeft: -150, zIndex: 99,
                transform: `scale(${sScale}) translate(${sX}px, ${sY}px) rotate(${sRotate}deg)`,
              }}>
                <div style={{ position: "relative", textAlign: "center" }}>
                   {fotoAssinatura && <img src={fotoAssinatura} style={{ maxWidth: 273, maxHeight: 89, background: "transparent" }} alt="Carimbo" />}
                   {sStampInfo && (
                     <div style={{ color: corAssinatura, marginTop: -5, opacity: 0.9 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.2 }}>{data.medico}</div>
                        <div style={{ fontSize: 11 }}>{data.crm}</div>
                     </div>
                   )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
export type { AttestationData };
