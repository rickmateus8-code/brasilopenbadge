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
  ({ data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage, logoLeftScale = 1, logoRightScale = 1, logoLeftX = 0, logoLeftY = 0, logoRightX = 0, logoRightY = 0 }, ref) => {
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
        const m = parseInt(parts[1]) - 1;
        return cidade
          ? `${cidade}, ${parseInt(parts[0])} DE ${meses[m] || parts[1]} DE ${parts[2]}`
          : `${parseInt(parts[0])} DE ${meses[m] || parts[1]} DE ${parts[2]}`;
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
          fontWeight: 700,
          fontSize: 18,
          textTransform: "uppercase",
          borderBottom: "2px solid #000",
          display: "block",
          padding: "5px 0",
          width: "100%",
          textAlign: "center",
          marginBottom: 14,
          letterSpacing: 0.5,
          position: "relative",
          zIndex: 2,
          color: "#000",
          flexShrink: 0,
        }}>
          ATESTADO MÉDICO
        </div>

        {/* ===== DADOS DO PACIENTE ===== */}
        <div style={{
          border: "1px solid #000",
          padding: "7px 10px",
          fontSize: 10.5,
          marginBottom: 6,
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

          {/* Linha 2: CPF/CNS | Nome da Mãe */}
          <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: "#000" }}>{docLabel} </span>
              <span style={{ color: "#000", textTransform: "uppercase" }}>{docValue}</span>
            </div>
            <div style={{ flex: 2 }}>
              <span style={{ fontWeight: 700, color: "#000" }}>Nome da Mãe: </span>
              <span style={{ color: "#000", textTransform: "uppercase" }}>{data.nomeMae}</span>
            </div>
          </div>

          {/* Linha 3: Endereço */}
          <div>
            <span style={{ fontWeight: 700, color: "#000" }}>Endereço: </span>
            <span style={{ fontWeight: 400, color: "#000", textTransform: "uppercase" }}>{data.endereco}</span>
          </div>
        </div>
        {/* ENDEREÇO EMITENTE: exibido apenas no cabeçalho do documento, não aqui */}

        {/* ===== CORPO DO TEXTO ===== */}
        <div style={{
          flex: "1 1 auto",
          fontSize: 13,
          lineHeight: 1.9,
          textAlign: "justify",
          position: "relative",
          zIndex: 2,
          paddingTop: 48,
          paddingBottom: 8,
          color: "#111",
          fontWeight: 400,
        }}>
          {/* Parágrafo com recuo */}
          <p style={{
            margin: 0,
            textIndent: "3em",
            lineHeight: 1.9,
            whiteSpace: "pre-wrap",
          }}>
            {textoAtestado || "        Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de 04 (quatro) dias de afastamento de suas atividades laborais para repouso e tratamento de saúde."}
          </p>

          {cidDisplay && (
            <div style={{
              fontWeight: 700,
              fontSize: 11,
              marginTop: 28,
              color: "#000",
              textTransform: "uppercase",
            }}>
              CID: {cidDisplay}{cidNome ? ` — ${cidNome}` : ""}
            </div>
          )}
        </div>

        {/* ===== RODAPÉ DIGITAL ===== */}
        {!modoCarimbo && (
          /* ===== RODAPÉ DIGITAL — footer_strip spec ===== */
          /* 32mm×210mm | bg #E6E6E6 | border 0.25mm | pad L8/R10/T5/B5 mm */
          <div style={{
            marginTop: "auto",
            flexShrink: 0,
            position: "relative",
            zIndex: 2,
            /* 32mm = ~121px; inclui a borda superior */
            height: 121,
            background: "#E6E6E6",
            border: "1px solid #000000",
            /* padding: T=19px R=38px B=19px L=30px (5/10/5/8 mm) */
            padding: "19px 38px 19px 30px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}>
            {/* QR Code — 24mm = ~91px, alinhado à esquerda do bloco */}
            <div style={{ flexShrink: 0, lineHeight: 0 }}>
              {isEmitted ? (
                <QRCode
                  value={qrValue}
                  size={91}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#E6E6E6"
                />
              ) : (
                <div style={{ position: "relative", width: 91, height: 91, flexShrink: 0 }}>
                  <div style={{ filter: "blur(4px)", opacity: 0.5, lineHeight: 0 }}>
                    <QRCode
                      value="https://validaratestado.digital"
                      size={91}
                      level="H"
                      includeMargin={false}
                      fgColor="#1a1a1a"
                      bgColor="#E6E6E6"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bloco de texto — offset 10mm = ~38px do QR */}
            <div style={{
              marginLeft: 38,
              flex: 1,
              minWidth: 0,
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#000",
              lineHeight: 0.98,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0,
            }}>
              {/* Linha 1: 8pt = ~10.7px, regular — "Documento assinado..." */}
              <div style={{ fontSize: 10.7, fontWeight: 400, whiteSpace: "nowrap", marginBottom: 0 }}>Documento assinado digitalmente conforme MP nº 2.200-2</div>
              {/* Linha 2: 11pt = ~14.7px, bold — NOME DO MÉDICO */}
              <div style={{ fontSize: 14.7, fontWeight: 700, textTransform: "uppercase", marginBottom: 0 }}>{data.medico}</div>
              {/* Linha 3: 8.5pt = ~11.3px, regular — CRM/UF */}
              <div style={{ fontSize: 11.3, fontWeight: 400, marginBottom: 0 }}>{data.crm}</div>
              {/* Linha 4: 8.5pt = ~11.3px, regular — ESPECIALIDADE */}
              <div style={{ fontSize: 11.3, fontWeight: 400, textTransform: "uppercase", marginBottom: 0 }}>{data.especialidade}</div>
              {/* Linha 5: 8pt = ~10.7px, regular — Assinado em ... */}
              <div style={{ fontSize: 10.7, fontWeight: 400, marginBottom: 0 }}>Assinado em {data.dataAssinatura} {data.horaAssinatura}</div>
            </div>

            {/* Bloco esquerdo: data + URL validação — alinhado à direita */}
            <div style={{
              flexShrink: 0,
              marginLeft: 16,
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#000",
              fontSize: 8,
              lineHeight: 0.98,
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0,
            }}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 8 }}>{dataFormatada || data.dataEmissao}</div>
              <div style={{ fontSize: 8 }}>Valide este documento acessando o endereço:</div>
              <strong style={{ fontSize: 8, display: "block" }}>https://validaratestado.digital</strong>
              <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                <span style={{ fontWeight: 400, fontSize: 8, whiteSpace: "nowrap" }}>Código:</span>
                <strong style={{ fontFamily: "'Courier New', monospace", letterSpacing: 0, fontSize: 8, fontWeight: 900, whiteSpace: "nowrap" }}>
                  {isEmitted ? data.codigoQR : "****.****"}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* ===== RODAPÉ FÍSICO (CARIMBO) ===== */}
        {modoCarimbo && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            position: "relative",
            zIndex: 2,
            paddingBottom: 16,
            marginTop: "auto",
            flexShrink: 0,
          }}>
            <div style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 20, fontSize: 11 }}>
              {dataFormatada || data.dataEmissao}
            </div>

            <div style={{
              position: "relative",
              textAlign: "center",
              width: 300,
              height: 90,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.85,
              filter: "contrast(120%) sepia(20%)",
              transform: "rotate(-1deg)",
            }}>
              {fotoAssinatura ? (
                <img
                  src={fotoAssinatura}
                  alt="Assinatura"
                  crossOrigin="anonymous"
                  style={{ maxWidth: 240, maxHeight: 75, objectFit: "contain", position: "absolute", zIndex: 3 }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Herr Von Muellerhoff', cursive",
                    fontSize: 44,
                    fontWeight: 100,
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
        )}
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
export type { AttestationData };
