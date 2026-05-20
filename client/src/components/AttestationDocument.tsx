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
  [key: string]: any;
}

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
  logoLeft?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
  documentType?: 'atestado' | 'laudo';
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
    const unidade = (data as any).unidade || "";
    const enderecoEmitente = (data as any).enderecoEmitente || (data as any).endereco_emitente || "";
    const corAssinatura = signatureColor || (data as any).signatureColor || (data as any).signature_color || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || (data as any).signature_image || "";
    const textoAtestado = (data as any).textoAtestado || (data as any).texto_atestado || "";
    const cidDisplay = (data as any).cidDisplay || (data as any).cid_display || data.cid || "";
    const cidNome = (data as any).cidNome || (data as any).cid_nome || "";
    const cidade = (data as any).cidade || "";
    const modoCarimbo = (data as any).modoCarimbo || (data as any).modo_carimbo || false;

    const layout = ATTESTATION_LAYOUT;

    const sScale = stampScale ?? (data as any).stampScale ?? (data as any).stamp_scale ?? layout.stamp.defaultScale;
    const sX = stampX ?? (data as any).stampX ?? (data as any).stamp_x ?? layout.stamp.defaultX;
    const sY = stampY ?? (data as any).stampY ?? (data as any).stamp_y ?? layout.stamp.defaultY;
    const sRotate = stampRotate ?? (data as any).stampRotate ?? (data as any).stamp_rotate ?? layout.stamp.defaultRotate;
    const hQRCode = hideQRCode || (data as any).hideQRCode || (data as any).hide_qr_code === 1;
    const sStampInfo = showStampInfo && ((data as any).showStampInfo !== false && (data as any).show_stamp_info !== 0);

    const docType = (documentType || (data as any).documentType || (data as any).document_type || (data as any).tipo || 'atestado').toLowerCase();

    const dataAssinatura = data.dataAssinatura || (data as any).data_assinatura || "";
    const horaAssinatura = data.horaAssinatura || (data as any).hora_assinatura || "";

    const tipoDoc = (data as any).tipoDoc || "CPF";
    const docLabel = tipoDoc === "CNS" ? "Cartão Nacional:" : "CPF:";
    const docValue = tipoDoc === "CNS" ? (data.cns || data.cpf || "___________") : (data.cpf || data.cns || "___________");

    const dataFormatada = (data as any).dataEmissaoFormatada || (() => {
      const d = data.dataEmissao || "";
      if (!d || d.length < 10) return d;
      const parts = d.split("/");
      if (parts.length === 3) {
        const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        const dia = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const ano = parts[2];
        if (isNaN(dia) || isNaN(m) || m < 0 || m > 11 || dia < 1 || dia > 31) return d;
        return cidade ? `${cidade}, ${dia} DE ${meses[m]} DE ${ano}` : `${dia} DE ${meses[m]} DE ${ano}`;
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
      <div ref={ref} id="attestation-document" style={{
          width: `${DOC_WIDTH_PX}px`, minHeight: `${DOC_HEIGHT_PX}px`, height: `${DOC_HEIGHT_PX}px`,
          backgroundColor: "#ffffff", paddingTop: `${PAD_H}px`, paddingBottom: `${PAD_H}px`,
          paddingLeft: `${PAD_V}px`, paddingRight: `${PAD_V}px`, boxSizing: "border-box",
          display: "flex", flexDirection: "column", position: "relative",
          fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&family=Courier+Prime:wght@400;700&display=swap');
          #attestation-document * { box-sizing: border-box; }
          #attestation-document .courier-prime { font-family: 'Courier Prime', 'Courier New', monospace !important; }
        `}</style>

        {(data.id === "XXXX.XXXX" || (data as any).codigoQR === "XXXX.XXXX") && (
          <div data-html2canvas-ignore="true" style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 48.6, fontWeight: 900, color: "rgba(220, 38, 38, 0.08)", pointerEvents: "none", zIndex: 99,
          }}>DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA</div>
        )}

        {/* ===== HEADER (LOGOS) ===== */}
        <div id="preview-header" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          height: 80, position: "relative", zIndex: 2, flexShrink: 0,
        }}>
          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", overflow: "visible" }}>
            {effectiveLogoLeft && <img src={effectiveLogoLeft} crossOrigin={getCrossOrigin(effectiveLogoLeft)} style={{ maxHeight: "100%", maxWidth: 149.38, objectFit: "contain", transform: `scale(${logoLeftScale}) translate(${logoLeftX}px, ${logoLeftY}px)`, transformOrigin: "left center" }} />}
          </div>
          <div style={{ flex: 1, padding: "0 12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {instituicao && <div style={{ fontSize: 14.7, fontWeight: 700, textTransform: "uppercase", marginBottom: 2, color: "#000", lineHeight: 1.3 }}>{instituicao}</div>}
            {unidade && unidade !== instituicao && <div style={{ fontSize: 12.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 2, color: "#000", lineHeight: 1.3 }}>{unidade}</div>}
            {enderecoEmitente && <div style={{ fontSize: 10.5, fontWeight: 400, textTransform: "uppercase", color: "#000", lineHeight: 1.3 }}>{enderecoEmitente}</div>}
          </div>
          <div style={{ width: 149.38, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", overflow: "visible" }}>
            {effectiveLogoRight && <img src={effectiveLogoRight} crossOrigin={getCrossOrigin(effectiveLogoRight)} style={{ maxHeight: "100%", maxWidth: 149.38, objectFit: "contain", transform: `scale(${logoRightScale}) translate(${logoRightX}px, ${logoRightY}px)`, transformOrigin: "right center" }} />}
          </div>
        </div>

        {/* ===== TÍTULO ===== */}
        <div style={{ fontWeight: 900, fontSize: 23.15, textTransform: "uppercase", textAlign: "center", marginTop: 15, marginBottom: 11, color: "#000", flexShrink: 0 }}>
          {docType === 'laudo' ? "LAUDO MÉDICO" : "ATESTADO MÉDICO"}
        </div>
        <div style={{ borderTop: "2.04px solid #000", width: "100%", marginBottom: 23, flexShrink: 0 }} />

        {/* ===== DADOS DO PACIENTE (FORÇAR PRETO ABSOLUTO) ===== */}
        <div id="preview-patient" style={{
          border: "1px solid #000",
          padding: isExporting ? layout.export.patientPadding : "14.25px 15px", 
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
          color: "#000 !important", // Forçar preto
        }}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", color: "#000" }}>
            <div style={{ flex: 3 }}><strong style={{ color: "#000" }}>Paciente: </strong><span style={{ color: "#000", textTransform: "uppercase" }}>{data.paciente}</span></div>
            <div style={{ color: "#000" }}><strong style={{ color: "#000" }}>Sexo: </strong><span style={{ color: "#000" }}>{sexoLabel}</span></div>
            <div style={{ color: "#000" }}><strong style={{ color: "#000" }}>Nasc.: </strong><span style={{ color: "#000" }}>{data.nascimento}</span></div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", color: "#000" }}>
            <div style={{ flex: 1 }}><strong style={{ color: "#000" }}>{docLabel} </strong><span style={{ color: "#000", textTransform: "uppercase" }}>{docValue}</span></div>
            <div style={{ flex: 2 }}><strong style={{ color: "#000" }}>Nome da Mãe: </strong><span style={{ color: "#000", textTransform: "uppercase" }}>{data.nomeMae}</span></div>
          </div>
          <div style={{ display: "flex", color: "#000" }}><div style={{ width: "100%", color: "#000" }}><strong style={{ color: "#000" }}>Endereço: </strong><span style={{ color: "#000", textTransform: "uppercase" }}>{data.endereco}</span></div></div>
        </div>

        {/* SPACER FÍSICO PARA ENDEREÇO */}
        {enderecoEmitente && <div style={{ height: layout.export.addressSpacerHeight }} />}

        {/* Endereço Emitente (Opcional) */}
        {enderecoEmitente && (
          <div style={{
            fontSize: 10.5, lineHeight: 1.2, fontFamily: "Arial, sans-serif",
            textAlign: "left", position: "relative", zIndex: 2, flexShrink: 0,
            marginTop: isExporting ? 0 : -2,
            marginBottom: 22, color: "#000", textTransform: "uppercase"
          }}>
            <strong style={{ color: "#000" }}>ENDEREÇO EMITENTE:</strong> <span style={{ fontWeight: 400, color: "#000" }}>{enderecoEmitente}</span>
          </div>
        )}

        {/* CORPO DO TEXTO (FORÇAR PRETO) */}
        <div id="preview-body" style={{ flex: "1 1 auto", fontSize: 15.18, lineHeight: 1.9, textAlign: "justify", position: "relative", paddingTop: 48, paddingBottom: 8, color: "#000 !important" }}>
          <p style={{ margin: 0, textIndent: "4em", whiteSpace: "pre-wrap", color: "#000" }}>
            {"  "}{textoAtestado || "Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico."}
          </p>
          {cidDisplay && <div style={{ fontWeight: 700, fontSize: 13.42, marginTop: 28, textTransform: "uppercase", color: "#000" }}>CID: {cidDisplay}{cidNome ? ` — ${cidNome}` : ""}</div>}
        </div>

        {/* RODAPÉ DIGITAL (FORÇAR PRETO) */}
        {!hQRCode && (
          <div id="preview-footer" style={{ marginTop: modoCarimbo ? 20 : "auto", position: "relative", zIndex: 2, width: "100%", color: "#000" }}>
            <div style={{ borderTop: "2px solid #000", marginBottom: 6 }} />
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", width: "100%", color: "#000" }}>
              <div style={{ color: "#000", lineHeight: 1.2, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 111, paddingBottom: 4, gap: 3 }}>
                <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 10.21, color: "#000" }}>{dataFormatada}</div>
                <div style={{ fontSize: 9.65, color: "#000" }}>Valide este documento acessando o endereço:</div>
                <strong style={{ fontSize: 10.21, color: "#000" }}>https://validaratestado.digital</strong>
                <div style={{ fontSize: 9.65, color: "#000" }}>Código: <strong style={{ fontSize: 10.21, color: "#000" }}>{isEmitted ? data.codigoQR : "****.****"}</strong></div>
              </div>
              <div style={{ border: "1px solid #000", width: 385, height: 111, display: "flex", background: "white", marginLeft: "auto" }}>
                <div style={{ width: 108, display: "flex", alignItems: "center", justifyContent: "center", padding: "19px 6px" }}>
                  <QRCode value={qrValue} size={96} level="H" includeMargin={false} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", textAlign: "right", paddingRight: 10, color: "#000" }}>
                  <div style={{ fontSize: 9.5, color: "#000" }}>Documento assinado digitalmente conforme MP nº 2.200-2</div>
                  <strong style={{ fontSize: 11.2, textTransform: "uppercase", color: "#000" }}>{data.medico}</strong>
                  <span style={{ fontSize: 10.1, color: "#000" }}>{data.crm}</span>
                  <span style={{ fontSize: 10.1, textTransform: "uppercase", color: "#000" }}>{data.especialidade}</span>
                  <span style={{ fontSize: 10.1, color: "#000" }}>Assinado em {data.dataAssinatura} {data.horaAssinatura}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RODAPÉ DE SISTEMA */}
        {hQRCode && (
          <div style={{ marginTop: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 10, color: "#000" }}>
            <div style={{ position: "absolute", bottom: 100, transform: "translate(253px, -128px)", width: 300, textAlign: "center", fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#000" }}>
              {dataFormatada}
            </div>
            <div style={{ textAlign: "center", width: "100%", marginBottom: 48, fontSize: 14, color: "#000" }}>___________________________</div>
            <div style={{ width: "100%", fontSize: 8.5, color: "#000", fontFamily: "monospace", opacity: 0.8 }}>
              <div>Gerado por {data.medico?.toUpperCase()}</div>
              <div>Versão.5.123.9.23129</div>
              <div>{data.dataAssinatura} {data.horaAssinatura}</div>
            </div>
          </div>
        )}

        {/* CARIMBO REALISTA INTERATIVO */}
        {modoCarimbo && (
          <div id="draggable-stamp" style={{
              width: 300, position: "absolute", bottom: hQRCode ? 100 : 150, left: "50%", marginLeft: -150, zIndex: 99,
              transform: `scale(${sScale}) translate(${sX}px, ${sY}px) rotate(${sRotate}deg)`, transformOrigin: "center center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              <div style={{ position: "relative", width: 280, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {fotoAssinatura && <img src={fotoAssinatura} crossOrigin={getCrossOrigin(fotoAssinatura)} style={{ maxWidth: 273, maxHeight: 89, objectFit: "contain", transform: "rotate(-1deg)", userSelect: "none" }} />}
              </div>
              {sStampInfo && (
                <div style={{ 
                  textAlign: "center", marginTop: -5, color: corAssinatura, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                  // MOTOR DE REALISMO PDF 3.3
                  opacity: isExporting ? 0.82 : 0.94,
                  textShadow: isExporting ? `0.2px 0.2px 0.5px ${corAssinatura}88` : "none",
                  filter: isExporting ? "contrast(1.2) brightness(0.92)" : "contrast(1.2) brightness(0.95) blur(0.15px)",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12.23, textTransform: "uppercase", lineHeight: 1 }}>{data.medico}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>{data.crm}</div>
                  <div style={{ fontSize: 9.5, opacity: 0.9, textTransform: "uppercase", lineHeight: 1 }}>{data.especialidade}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";
export default AttestationDocument;
export type { AttestationData };
