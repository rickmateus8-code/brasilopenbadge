import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { getQRCodeValue } from "@/config.qrcode";

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
}

// Gerar rubrica cursiva a partir do nome do médico
function gerarRubrica(nome: string): string {
  if (!nome || nome === "NOME DO MÉDICO") return "Assinado";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    const inicial = partes[1].charAt(0).toUpperCase();
    return `${primeiro} <span style="font-size:0.75em;margin-left:-2px">${inicial}.</span>`;
  }
  return partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
}

// Dimensões A4 exatas em pixels a 96dpi
// A4 = 210mm × 297mm → 794px × 1123px
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;
const PAD_H = 56;  // ~15mm top/bottom
const PAD_V = 60;  // ~16mm left/right

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage, documentType, logoLeftScale = 1, logoRightScale = 1, logoLeftX = 0, logoLeftY = 0, logoRightX = 0, logoRightY = 0 }, ref) => {
    const isEmitted = data.codigoQR && data.codigoQR !== "XXXX.XXXX";
    // QR Code aponta para validaratestado.digital/validar?codigo=XXXX&data=YYYY-MM-DD
    // A data no banco está em DD/MM/YYYY — converte para YYYY-MM-DD para o parâmetro da URL
    const dataEmissaoForQR = data.dataEmissao
      ? (() => {
          const d = String(data.dataEmissao).trim();
          // Formato DD/MM/YYYY → YYYY-MM-DD
          const parts = d.split("/");
          if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
          // Se já vier em YYYY-MM-DD, retorna direto
          return d.substring(0, 10);
        })()
      : undefined;
    const qrValue = isEmitted
      ? getQRCodeValue(data.codigoQR, dataEmissaoForQR)
      : "https://validaratestado.digital";

    const effectiveLogoLeft = logoLeft || logoUrl || (data as any).logoUrl || "";
    const effectiveLogoRight = logoRight || (data as any).logoRight || "";

    const instituicao = (data as any).instituicao || "";
    const unidade = (data as any).unidade || "";
    const enderecoEmitente = (data as any).enderecoEmitente || "";
    const corAssinatura = signatureColor || (data as any).signatureColor || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || "";
    const textoAtestado = (data as any).textoAtestado || "";
    const cidDisplay = (data as any).cidDisplay || data.cid || "";
    const cidNome = (data as any).cidNome || "";
    const cidade = (data as any).cidade || "";
    const modoCarimbo = (data as any).modoCarimbo || false;
    const docType = documentType || (data as any).documentType || 'atestado';

    // Tipo de documento do paciente
    const tipoDoc = (data as any).tipoDoc || "CPF";
    const docLabel = tipoDoc === "CNS" ? "Cartão Nacional:" : "CPF:";
    const docValue = tipoDoc === "CNS"
      ? (data.cns || data.cpf || "___________")
      : (data.cpf || data.cns || "___________");

    // Data de emissão formatada
    const dataFormatada = (data as any).dataEmissaoFormatada || (() => {
      const d = data.dataEmissao || "";
      if (!d || d.length < 10) return d;
      const parts = d.split("/");
      if (parts.length === 3) {
        const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        const dia = parseInt(parts[0]);
        const mes = parseInt(parts[1]) - 1;
        const ano = parts[2];
        // Validar se dia e mês são válidos para evitar NaN
        if (isNaN(dia) || isNaN(mes) || mes < 0 || mes > 11 || dia < 1 || dia > 31) return d;
        return cidade
          ? `${cidade}, ${dia} DE ${meses[mes]} DE ${ano}`
          : `${dia} DE ${meses[mes]} DE ${ano}`;
      }
      return d;
    })();

    // Sexo em português
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
          background: "#ffffff",
          paddingTop: `${PAD_H}px`,
          paddingBottom: `${PAD_H}px`,
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
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&display=swap');
          #attestation-document * { box-sizing: border-box; }
        `}</style>

        {/* Background de segurança */}
        <div style={{
          backgroundImage: "radial-gradient(#ddd 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          opacity: 0.25,
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }} />

        {/* ===== HEADER ===== */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          height: 80,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
        }}>
          {/* Logo Esquerda */}
          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexShrink: 0, overflow: "visible" }}>
            {effectiveLogoLeft && (
              <img
                src={effectiveLogoLeft}
                alt="Logo"
                crossOrigin="anonymous"
                style={{
                  maxHeight: "100%",
                  maxWidth: 154,
                  objectFit: "contain",
                  transform: `scale(${logoLeftScale}) translate(${logoLeftX}px, ${logoLeftY}px)`,
                  transformOrigin: "left center",
                  transition: "transform 0.1s",
                }}
              />
            )}
          </div>

          {/* Centro — Nome da Instituição / Unidade / Endereço */}
          <div style={{ flex: 1, padding: "0 12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {instituicao && (
              <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", marginBottom: 1, color: "#000", letterSpacing: 0.5, lineHeight: 1.3 }}>
                {instituicao}
              </div>
            )}
            {unidade && (
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 1, color: "#000", lineHeight: 1.3 }}>
                {unidade}
              </div>
            )}
            {enderecoEmitente && (
              <div style={{ fontSize: 10, fontWeight: 400, textTransform: "uppercase", color: "#000", lineHeight: 1.3 }}>
                {enderecoEmitente}
              </div>
            )}
          </div>

          {/* Logo Direita */}
          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, overflow: "visible" }}>
            {effectiveLogoRight && (
              <img
                src={effectiveLogoRight}
                alt="Logo Direita"
                crossOrigin="anonymous"
                style={{
                  maxHeight: "100%",
                  maxWidth: 154,
                  objectFit: "contain",
                  transform: `scale(${logoRightScale}) translate(${logoRightX}px, ${logoRightY}px)`,
                  transformOrigin: "right center",
                  transition: "transform 0.1s",
                }}
              />
            )}
          </div>
        </div>

        {/* ===== TÍTULO ===== */}
        <div style={{
          fontWeight: 900,
          fontSize: 21,
          textTransform: "uppercase",
          borderTop: "none",
          borderBottom: "none",
          display: "block",
          padding: "0",
          width: "100%",
          textAlign: "center",
          marginTop: 12,
          marginBottom: 8,
          letterSpacing: 0.5,
          position: "relative",
          zIndex: 2,
          color: "#000",
          flexShrink: 0,
        }}>
          {docType === 'laudo' ? 'LAUDO MÉDICO' : 'ATESTADO MÉDICO'}
        </div>

        {/* Moldura Superior (Linha Preta) */}
        <div style={{
          borderTop: "2px solid #000",
          width: "100%",
          marginBottom: 15,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
        }} />

        {/* ===== DADOS DO PACIENTE ===== */}
        <div style={{
          border: "1px solid #000",
          padding: "7px 10px",
          fontSize: 10.5,
          marginBottom: 4,
          lineHeight: 1.7,
          position: "relative",
          zIndex: 2,
          background: "rgba(255,255,255,0.9)",
          flexShrink: 0,
        }}>
          {/* Linha 1: Paciente | Sexo | Nasc */}
          <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
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

          {/* Linha 2: CPF/CNS */}
          <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
            <div>
              <span style={{ fontWeight: 700, color: "#000" }}>{docLabel} </span>
              <span style={{ color: "#000" }}>{docValue}</span>
            </div>
          </div>

          {/* Linha 3: Nome da Mãe */}
          <div>
            <span style={{ fontWeight: 700, color: "#000" }}>Nome da Mãe: </span>
            <span style={{ color: "#000", textTransform: "uppercase" }}>{data.nomeMae}</span>
          </div>

          {/* Linha 4: Endereço */}
          <div>
            <span style={{ fontWeight: 700, color: "#000" }}>Endereço: </span>
            <span style={{ color: "#000", textTransform: "uppercase" }}>{data.endereco}</span>
          </div>
        </div>

        {/* ===== ENDEREÇO EMITENTE ===== */}
        <div style={{ fontSize: 9, marginBottom: 6, position: "relative", zIndex: 2, flexShrink: 0 }}>
          <span style={{ fontWeight: 700 }}>ENDEREÇO EMITENTE: </span>
          <span style={{ textTransform: "uppercase" }}>{enderecoEmitente}</span>
        </div>

        {/* ===== CORPO DO ATESTADO ===== */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
        }}>
          {/* Texto do atestado */}
          <div style={{
            fontSize: 10,
            lineHeight: 1.6,
            textAlign: "justify",
            marginBottom: 8,
            color: "#000",
          }}>
            <div style={{ marginBottom: 6 }}>
              <strong>Nome do(a) paciente:</strong> {data.paciente}
            </div>

            <div style={{ marginBottom: 6, textAlign: "justify" }}>
              {textoAtestado}
            </div>

            {cidDisplay && (
              <div style={{ marginBottom: 6 }}>
                <strong>CID:</strong> {cidDisplay}
                {cidNome && ` (${cidNome})`}
              </div>
            )}
          </div>

          {/* Rodapé com QR Code e Assinatura */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #000",
            paddingTop: 8,
            position: "relative",
            zIndex: 2,
          }}>
            {/* QR Code + Info */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <QRCode
                  value={qrValue}
                  size={64}
                  level="M"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div style={{ fontSize: 8, lineHeight: 1.4 }}>
                <div><strong>Documento assinado digitalmente</strong></div>
                <div>conforme MP nº 2.200-2</div>
                <div><strong>{data.medico}</strong></div>
                <div>{data.crm}</div>
                <div style={{ marginTop: 2 }}>Assinado em {data.dataAssinatura} {data.horaAssinatura}</div>
                <div style={{ marginTop: 2 }}>
                  <strong>Válido este documento acessando o endereço:</strong>
                </div>
                <div style={{ fontSize: 7, wordBreak: "break-all" }}>https://validaratestado.digital</div>
                <div style={{ fontSize: 7 }}>Código: {data.codigoQR}</div>
              </div>
            </div>

            {/* Assinatura */}
            <div style={{ textAlign: "center", position: "relative", width: 220, height: 80 }}>
              {fotoAssinatura && (
                <img
                  src={fotoAssinatura}
                  alt="Assinatura"
                  style={{
                    maxHeight: 60,
                    maxWidth: "100%",
                    objectFit: "contain",
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                  }}
                />
              )}
              {data.medico && data.medico !== "NOME DO MÉDICO" && (
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%) rotate(-8deg)",
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    color: corAssinatura,
                  }}
                  dangerouslySetInnerHTML={{ __html: gerarRubrica(data.medico) }}
                />
              )}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 220,
                height: 1,
                background: "#000",
                zIndex: 1,
              }} />
            </div>

            <div style={{ textAlign: "center", marginTop: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{data.medico}</div>
              <div style={{ fontSize: 10 }}>{data.crm}</div>
              <div style={{ fontSize: 9, color: "#555" }}>{data.especialidade}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
export type { AttestationData };
