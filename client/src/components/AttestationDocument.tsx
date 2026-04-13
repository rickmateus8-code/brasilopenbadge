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
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;
const PAD_H = 56;
const PAD_V = 60;

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage }, ref) => {
    const isEmitted = data.codigoQR && data.codigoQR !== "XXXX.XXXX";
    const dataEmissaoForQR = data.dataEmissao
      ? (() => {
          const d = String(data.dataEmissao).trim();
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

    const effectiveLogoLeft = logoLeft || logoUrl || (data as any).logoUrl || "";
    const effectiveLogoRight = logoRight || (data as any).logoRight || "";

    const instituicao = (data as any).instituicao || "";
    const unidade = (data as any).unidade || "";
    const enderecoEmitente = (data as any).enderecoEmitente || "";
    const textoAtestado = (data as any).textoAtestado || "";
    const cidDisplay = (data as any).cidDisplay || data.cid || "";
    const cidNome = (data as any).cidNome || "";
    const cidade = (data as any).cidade || "";
    const modoCarimbo = (data as any).modoCarimbo || false;

    const tipoDoc = (data as any).tipoDoc || "CPF";
    const docLabel = tipoDoc === "CNS" ? "Cartão Nacional:" : "CPF:";
    const docValue = tipoDoc === "CNS"
      ? (data.cns || data.cpf || "___________")
      : (data.cpf || data.cns || "___________");

    const cidadeFormatada = cidade ? `${cidade}, ` : "";
    const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
    
    const dataFormatada = (() => {
      const d = data.dataEmissao || "";
      if (!d || d.length < 10) return d;
      const parts = d.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1]) - 1;
        return `${cidadeFormatada}${parseInt(parts[0])} DE ${meses[m] || parts[1]} DE ${parts[2]}`;
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
          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexShrink: 0 }}>
            {effectiveLogoLeft && (
              <img
                src={effectiveLogoLeft}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ maxHeight: "100%", maxWidth: 154, objectFit: "contain" }}
              />
            )}
          </div>

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

          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
            {effectiveLogoRight && (
              <img
                src={effectiveLogoRight}
                alt="Logo Direita"
                crossOrigin="anonymous"
                style={{ maxHeight: "100%", maxWidth: 154, objectFit: "contain" }}
              />
            )}
          </div>
        </div>

        {/* ===== TÍTULO ===== */}
        <div style={{
          fontWeight: 900,
          fontSize: 22,
          textTransform: "uppercase",
          borderBottom: "2px solid #000",
          display: "block",
          padding: "8px 0",
          width: "100%",
          textAlign: "center",
          marginBottom: 18,
          letterSpacing: 4,
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

          <div>
            <span style={{ fontWeight: 700, color: "#000" }}>Endereço: </span>
            <span style={{ color: "#000", textTransform: "uppercase", fontWeight: 700 }}>{data.endereco}</span>
          </div>
        </div>

        {/* ===== CORPO DO TEXTO ===== */}
        <div style={{
          flex: "1 1 auto",
          fontSize: 13,
          lineHeight: 1.9,
          textAlign: "justify",
          position: "relative",
          zIndex: 2,
          paddingTop: 64,
          paddingBottom: 8,
          color: "#111",
          fontWeight: 400,
        }}>
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
              fontSize: 13,
              marginTop: 35,
              color: "#000",
              textTransform: "uppercase",
            }}>
              CID: {cidDisplay}{cidNome ? ` — ${cidNome}` : ""}
            </div>
          )}
        </div>

        {/* ===== RODAPÉ DIGITAL ===== */}
        {!modoCarimbo && (
          <div style={{
            borderTop: "2px solid #000",
            marginTop: "auto",
            paddingTop: 16,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 8.5, color: "#333", lineHeight: 1.4, maxWidth: "60%" }}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{cidadeFormatada}{data.dataEmissao}</div>
              <div>Valide este documento acessando o endereço:</div>
              <div style={{ fontWeight: 700 }}>validaratestado.digital/validar</div>
              <div>Código: <span style={{ fontWeight: 700 }}>{data.codigoQR}</span></div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, border: "2px solid #000", padding: "10px 14px", background: "#fff" }}>
              {/* QR Code à esquerda */}
              <div style={{ flexShrink: 0, lineHeight: 0 }}>
                <QRCode value={qrValue} size={80} level="M" />
              </div>
              {/* Dados do Médico à direita */}
              <div style={{ textAlign: "left", fontSize: 8.5, color: "#000", lineHeight: 1.3 }}>
                <div style={{ fontSize: 7.5, marginBottom: 2 }}>Documento assinado digitalmente conforme MP nº 2.200-2</div>
                <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 9.5, marginBottom: 1 }}>{data.medico}</div>
                <div style={{ marginBottom: 1 }}>CRM/{data.uf_crm || "SP"} {data.crm}</div>
                <div style={{ textTransform: "uppercase", marginBottom: 1 }}>{data.especialidade}</div>
                <div style={{ marginTop: 2, fontSize: 8 }}>Assinado em {data.dataAssinatura} {data.horaAssinatura}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===== RODAPÉ CARIMBO ===== */}
        {modoCarimbo && (
          <div style={{
            marginTop: "auto",
            paddingTop: 40,
            paddingBottom: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
          }}>
            <div style={{
              width: 300,
              borderTop: "1px solid #000",
              marginBottom: 8,
            }} />
            <div style={{ textAlign: "center", fontSize: 11, color: "#000" }}>
              <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{data.medico}</div>
              <div>CRM/{data.uf_crm || "SP"} {data.crm}</div>
              <div style={{ textTransform: "uppercase" }}>{data.especialidade}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
